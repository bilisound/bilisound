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
features/bilibili/url-resolver.ts          解析输入并选择视频或远程列表路由
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

## 分层约束（apps/mobile）

UI 层（`app/`、`components/`、`hooks/`）只通过 `~/features/*` 访问业务能力，不直接 import `@bilisound/player`、`@bilisound/sdk`、`~/storage/*` 或 `~/api/*`。v3 把播放、歌单、配置、缓存和 B 站数据拆成用例 API，UI 重写（Epic 7）只消费这些 API；UI 直接接触播放器内部、SDK DTO 或存储 key，会把耦合带进新界面。

- 播放器能力从 `features/player`（`@bilisound/player` 的应用侧重导出）获取。播放编排在 `features/playback`，它直接使用 `@bilisound/player` 与 `~/storage/playlist`。
- `store/` 只放无业务语义的 UI 交互状态；业务状态放进对应 feature。
- 例外：`features/theme` 没有 `index.ts`，UI 目前直接引用其模块文件。
- 公开 API 以各 feature 的 `index.ts` 和 [phase-2-audit.md 的冻结 API](v3-plan/phase-2-audit.md#frozen-feature-use-case-api) 为准。
- 没有 lint 规则强制这条约束。改动 UI 层后在仓库根目录自查，应无输出：

```bash
grep -rnE 'from "(@bilisound/(player|sdk)|~/storage/|~/api/)' apps/mobile/app apps/mobile/components apps/mobile/hooks
```

## Server 定位

### server-cf（Cloudflare Worker）— Web 代理

- **职责**: 为 Web 端代理 B 站 API、图片和支持 Range 的媒体资源
- **端点**: 完整列表、参数与 Referer 规则见 [apps/server-cf/README.md](../apps/server-cf/README.md#api-端点)；mobile 侧的代理 URL 在 `features/bilibili/client.ts` 构造
- **为什么需要**: 浏览器无法稳定直连 B 站 API 与 CDN（CORS、Referer 和受限请求头）
- **技术栈**: itty-router + `@bilisound/sdk` Direct 模式 + Cloudflare KV

## 平台分叉策略

项目使用 Expo 的 `.web.ts` 后缀约定进行平台特定实现：

| 文件（相对 `apps/mobile/`）                      | 平台                |
| ------------------------------------------------ | ------------------- |
| `features/cache/download.ts` / `download.web.ts` | 原生下载 / Web 存根 |
| `utils/init.ts` / `init.web.ts`                  | 原生 / Web 启动流程 |
| `storage/sqlite/playlist.ts` / `playlist.web.ts` | SQLite / IndexedDB  |
| `features/playlist/repository.ts` / `.web.ts`    | 原生 / Web 歌单仓库 |
| `utils/logger.ts` / `logger.web.ts`              | 文件日志 / Web 日志 |

以上是示例，不是完整清单。同名文件可能出现在多个目录（例如 `storage/playlist.ts` 是 MMKV 播放上下文，与 `storage/sqlite/playlist.ts` 无关），引用时写完整路径。完整清单用 `find apps/mobile -path '*/node_modules' -prune -o \( -name '*.web.ts*' -o -name '*.native.ts*' \) -print` 查询；少数组件使用 `.native.tsx` + `.web.tsx` 分叉。

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

## 当前 UI 栈的过渡状态

mobile 端同时存在三代 UI 代码，判断该往哪写之前先确认落点：

| 位置                            | 状态                                                              |
| ------------------------------- | ----------------------------------------------------------------- |
| `components/ui/*`               | GluestackUI 包装层，存量，不要在此新增                            |
| `components/ui-next/*`          | 无 NativeWind / Gluestack 的本地 RN 组件，mobile 内新共享组件落点 |
| `packages/ui` (`@bilisound/ui`) | v3 Tamagui 组件库，独立演进，暂未接入 mobile                      |

`className` / NativeWind 与 Gluestack 在 mobile 中仍有可观存量，属于预期状态而非待修 bug。Epic 7 已决定由 `packages/ui`（Tamagui）取代 NativeWind 与 Gluestack，并在新的 `apps/mobile-next` 中重写界面、而非原地迁移 `apps/mobile`，见 [v3-plan/epic-7-plan.md](v3-plan/epic-7-plan.md)。在 `apps/mobile` 上的业务改动仍不借机替换 UI 技术，规则见 [v3-plan/README.md](v3-plan/README.md#ui-framework-replacement-is-a-later-decision)。
