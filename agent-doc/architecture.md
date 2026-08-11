# Bilisound 架构

> 本文用于导航与解释设计；源码是当前实现事实的最终权威。引用具体文件或符号前应确认其仍然存在。

## 包依赖关系

```
apps/mobile ──── depends on ────> @bilisound/sdk
     │                                  │
     │                                  │ BilisoundSDKDirect (原生端)
     │                                  │ BilisoundSDKRemote (Web 端)
     │                                  │
     └── depends on ────> @bilisound/player (跨平台音频播放；原生端为 Expo 模块)

apps/server-cf ── depends on ──> @bilisound/sdk (只用 Direct 实现)
```

## 数据流

```text
用户输入（BV / URL / b23 / 二维码）
  │
  ▼
business/format.ts                         解析输入并选择视频或远程列表路由
  │
  ▼
features/bilibili/client.ts + mappers.ts  B 站访问边界；SDK DTO 转为应用领域模型
  │
  ├─ iOS / Android ─> BilisoundSDKDirect ────────────────> B 站网页 / API
  │
  └─ Web ──────────> BilisoundSDKRemote / server-cf ────> B 站网页 / API / CDN
  │
  ▼
应用领域模型
  ├─ playlist ─> features/playlist repository ─> SQLite / IndexedDB
  └─ playback ─> track-data / track-operations ─> @bilisound/player ─> 音频输出
```

播放队列中的媒体地址可能来自本地缓存，也可能来自 B 站 CDN。Web 端的媒体与图片不能直接携带原生端使用的请求头，因此分别使用 server-cf 的 `/api/internal/resource` 与 `/api/internal/image` 代理。

## SDK 双模式详解

`apps/mobile/features/bilibili` 是 mobile 内唯一的 SDK 边界：`client.ts` 负责运行时调用与平台切换，`mappers.ts` 只导入 SDK 类型并将 DTO 收窄为应用领域模型。

### BilisoundSDKDirect（原生端 iOS / Android）

- 直接在客户端访问 B 站网页与 `api.bilibili.com`
- 自动处理 WBI 签名
- 支持注入 `CacheProvider`；mobile 当前未配置缓存提供者，默认实现不缓存
- `getResourceUrl` 支持按设置过滤 CDN URL；过滤关闭或无匹配节点时使用原始候选地址
- 原生 HTTP 不受浏览器 CORS 限制

### BilisoundSDKRemote（Web 端）

- 短链接、元数据和远程列表等 SDK 请求转发到 Cloudflare Worker 的 `/api/internal/*`
- 媒体与图片地址由 `features/bilibili/client.ts` 直接构造成 Worker 代理 URL
- Worker 内复用 `BilisoundSDKDirect`，并注入 Cloudflare KV 缓存（TTL 3600 秒）
- Web 客户端只需知道 Worker 地址（`EXPO_PUBLIC_API_URL`）
- 解决浏览器 CORS、Referer 与受限请求头问题

## Server 定位

### server-cf（Cloudflare Worker）— Web 代理

- **职责**: 为 Web 端代理 B 站 API、图片和支持 Range 的媒体资源
- **端点**: `/api/internal/resolve-b23`, `/api/internal/metadata`, `/api/internal/resource`, `/api/internal/user-list`, `/api/internal/user-list-all`, `/api/internal/image`, `/api/internal/app/update`
- **为什么需要**: 浏览器无法稳定直连 B 站 API 与 CDN（CORS、Referer 和受限请求头）
- **技术栈**: itty-router + `@bilisound/sdk` Direct 模式 + Cloudflare KV

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

- expo-modules-core（原生模块桥接）
- iOS: Swift / AVQueuePlayer
- Android: Kotlin / Media3 / ExoPlayer
- Web: TypeScript / HTMLAudioElement 实现

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
