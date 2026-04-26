# Bilisound 架构

## 包依赖关系

```
apps/mobile ──── depends on ────> @bilisound/sdk
     │                                  │
     │                                  │ BilisoundSDKDirect (原生端)
     │                                  │ BilisoundSDKRemote (Web 端)
     │                                  │
     └── depends on ────> @bilisound/player (原生音频播放)

apps/server-cf ── depends on ──> @bilisound/sdk (只用 Direct 实现)
apps/server-netlify (独立，无 SDK 依赖)
```

## 数据流

```
┌──────────┐     ┌──────────────────────┐     ┌──────────────────┐     ┌─────────┐
│ 用户输入  │────>│  SDK 解析 + 获取元数据  │────>│  Player 播放/下载  │────>│ 音频输出  │
│ (BV/URL) │     │ (app/mobile/api/)    │     │ (@bilisound/player) │     │         │
└──────────┘     └──────┬───────────────┘     └──────────────────┘     └─────────┘
                        │
          ┌─────────────┴──────────────┐
          │                            │
   Platform.OS !== "web"        Platform.OS === "web"
          │                            │
   BilisoundSDKDirect          BilisoundSDKRemote
   (直接调 B 站 API)            (通过 CF Worker 代理)
   - WBI 签名                   - fetch → /api/internal/*
   - axios + 缓存
```

## SDK 双模式详解

切换入口: `apps/mobile/api/bilisound.ts`

### BilisoundSDKDirect (原生端 iOS/Android)

- 直接在客户端调用 `api.bilibili.com`
- 自动处理 WBI 签名 (wbi.ts)
- 内置 KV 缓存 (axios 请求级)
- CDN URL 过滤 (排除 HKG 节点)
- 跨域无障碍 (原生 HTTP 不受浏览器 CORS 限制)

### BilisoundSDKRemote (Web 端)

- 所有 B 站 API 调用转发到 Cloudflare Worker 的 `/api/internal/*`
- Worker 上复用 `BilisoundSDKDirect` 实例
- Web 客户端只需知道 Worker 地址 (`EXPO_PUBLIC_API_URL`)
- 解决浏览器 CORS + Referer 校验问题

## 两个 Server 的定位

### server-cf (Cloudflare Worker) — API 代理

- **职责**: 为 Web 端代理所有 B 站 API 请求
- **端点**: `/api/internal/resolve-b23`, `/api/internal/metadata`, `/api/internal/resource`, `/api/internal/user-list`, `/api/internal/image`, `/api/internal/app/update`
- **为什么需要**: 浏览器无法直接调 `api.bilibili.com`（CORS/Referer 限制）
- **技术栈**: itty-router + `@bilisound/sdk` (Direct 模式)

### server-netlify (Netlify Functions) — 版本分发

- **职责**: 代理 GitHub Releases API，为客户端提供版本更新检查和 APK 下载
- **端点**: `/latest`, `/releases`, `/download/:tag/:filename`
- **技术栈**: Netlify Functions + Netlify Blobs (缓存)
- **为什么需要**: 避免客户端直接调 GitHub API（频率限制、私密 Token）

## 平台分叉策略

项目使用 Expo 的 `.web.ts` 后缀约定进行平台特定实现：

| 文件 | 平台 |
|------|------|
| `download.ts` | iOS/Android |
| `download.web.ts` | Web |
| `init.ts` | iOS/Android |
| `init.web.ts` | Web |
| `playlist.ts` | iOS/Android (SQLite) |
| `playlist.web.ts` | Web (IndexedDB) |
| `logger.ts` | iOS/Android |
| `logger.web.ts` | Web |

运行时也通过 `Platform.OS === "web"` 做分支判断。

## 技术栈速览

### apps/mobile
- Expo SDK 55 + React Native 0.83
- Expo Router (文件路由)
- NativeWind 4 (Tailwind CSS) + GluestackUI (组件库)
- Drizzle ORM (SQLite, `expo-sqlite`)
- MMKV (KV 存储)
- Zustand (UI 状态)
- TanStack React Query

### packages/sdk
- TypeScript + tsdown (构建)
- axios (HTTP, peer dependency)
- md5 (WBI 签名, peer dependency)

### packages/player
- expo-modules-core (原生模块桥接)
- iOS: Swift + Kotlin
- Android: Kotlin

### apps/server-cf
- Cloudflare Workers
- itty-router
- @bilisound/sdk (Direct 模式 + KV 缓存)
