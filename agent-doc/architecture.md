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

## 平台分叉策略

项目使用 Expo 的 `.web.ts` 后缀约定进行平台特定实现：

| 文件              | 平台                 |
| ----------------- | -------------------- |
| `download.ts`     | iOS/Android          |
| `download.web.ts` | Web                  |
| `init.ts`         | iOS/Android          |
| `init.web.ts`     | Web                  |
| `playlist.ts`     | iOS/Android (SQLite) |
| `playlist.web.ts` | Web (IndexedDB)      |
| `logger.ts`       | iOS/Android          |
| `logger.web.ts`   | Web                  |

运行时也通过 `Platform.OS === "web"` 做分支判断。

## 技术栈速览

具体版本一律看对应的 `package.json` 与根 `pnpm-workspace.yaml` 的 `catalog:`，本节只记录「用了什么」和「为什么」。

### apps/mobile

- Expo + Expo Router (文件路由)
- Drizzle ORM (SQLite, `expo-sqlite`)
- MMKV (KV 存储)
- Zustand (UI 状态)
- TanStack React Query
- 样式现状是 NativeWind + GluestackUI 与逐步替换它们的本地组件并存，详见下节

### packages/ui

- `@tamagui/core` 及按需引入的 Tamagui 组件包，不使用 `@tamagui/config` 或聚合的 `tamagui` 包
- 分层为 `design-token` → `recipe` → `component`，Tamagui 属于组件契约之下的实现细节
- 源码直供 (`react-native` / `exports` 指向 `src/index.ts`)，无 `dist` 契约，由消费方 Metro/Babel 转译
- Storybook (React Native Web) 作为组件目录，`App.tsx` 是独立的原生 smoke 展示
- **尚未被 `apps/mobile` 依赖**：mobile 的 `package.json` 目前只依赖 `@bilisound/player` 和 `@bilisound/sdk`

### packages/sdk

- TypeScript + tsdown (构建)
- axios (HTTP, peer dependency)
- md5 (WBI 签名, peer dependency)

### packages/player

- expo-modules-core (原生模块桥接)
- iOS: Swift
- Android: Kotlin (Media3 / ExoPlayer)

### apps/server-cf

- Cloudflare Workers
- itty-router
- @bilisound/sdk (Direct 模式 + KV 缓存)

## 当前 UI 栈的过渡状态

mobile 端同时存在三代 UI 代码，判断该往哪写之前先确认落点：

| 位置                            | 状态                                                              |
| ------------------------------- | ----------------------------------------------------------------- |
| `components/ui/*`               | GluestackUI 包装层，存量，不要在此新增                            |
| `components/ui-next/*`          | 无 NativeWind / Gluestack 的本地 RN 组件，mobile 内新共享组件落点 |
| `packages/ui` (`@bilisound/ui`) | v3 Tamagui 组件库，独立演进，暂未接入 mobile                      |

`className` / NativeWind 与 Gluestack 在 mobile 中仍有可观存量，属于预期状态而非待修 bug。是否整体替换属于 v3 UI 重写阶段的决定，见 [v3-plan/README.md](v3-plan/README.md)。
