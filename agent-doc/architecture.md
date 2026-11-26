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

UI 层（`app/`、`components/`、`hooks/`）只通过 `~/features/*` 访问业务能力，不直接 import `@bilisound/player`、`@bilisound/sdk`、`~/storage/*` 或 `~/api/*`。播放、歌单、配置、缓存和 B 站数据已经按 feature 边界拆分，UI 应只消费这些 feature 暴露的用例 API；直接接触播放器内部、SDK DTO 或存储 key 会绕过既有边界。

- 播放器能力从 `features/player`（`@bilisound/player` 的应用侧重导出）获取。播放编排在 `features/playback`，它直接使用 `@bilisound/player` 与 `~/storage/playlist`。
- `store/` 只放无业务语义的 UI 交互状态；业务状态放进对应 feature。
- 例外：`features/theme` 没有 `index.ts`，UI 目前直接引用其模块文件。
- 公开 API 以各 feature 的 `index.ts` 为准。
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
- 样式现状是 NativeWind v5 + GluestackUI 与逐步替换它们的本地组件并存，详见下节

### packages/sdk

- TypeScript + tsdown (构建)
- axios (HTTP, peer dependency)
- md5 (WBI 签名, peer dependency)

### packages/player

- expo-modules-core（原生模块桥接）
- iOS: Swift / AVQueuePlayer
- Android: Kotlin / Media3 / ExoPlayer
- Web: TypeScript / HTMLAudioElement 实现

## 当前 UI 栈与维护边界

mobile 端同时存在两套 UI 代码，判断该往哪写之前先确认落点：

| 位置                   | 状态                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| `components/ui/*`      | GluestackUI 包装层，存量，不要在此新增                            |
| `components/ui-next/*` | 无 NativeWind / Gluestack 的本地 RN 组件，mobile 内新共享组件落点 |

`className` / NativeWind 与 Gluestack 在 mobile 中仍有可观存量，属于预期状态而非待修 bug。维护时不追求一次性替换；样式迁移只在具体技术约束或局部维护需要时进行。整体维护边界见 [AGENTS.md 的 Current Maintenance Policy](../AGENTS.md#current-maintenance-policy)。

### NativeWind 版本约定

- 样式引擎是 NativeWind v5 + `react-native-css` + Tailwind v4。v5 目前只有 RC：`nativewind` 与 `react-native-css` 必须按精确版本成对升级（`nativewind` 的 peer 锁死了 `react-native-css` 版本）。上游 RC 只在 Expo 57 上验证过，本仓库跑在更新的 Expo / RN 上，升级后要重新做视觉回归。
- 根 `pnpm-workspace.yaml` 的 `overrides` 把 `lightningcss` 钉在单一版本：Expo 的 CSS 管线与 `react-native-css` 用不同版本时，`global.css` 会反序列化失败。
- `patches/react-native-css@3.1.0-rc.1.patch` 回移了上游 #504：`react-native-css/components` 手写了一份 `react-native` 导出清单，RC 版缺少 RN 0.88 新增的 `AssetRegistry`，expo-asset 会在启动时报 `getAssetByID of undefined`。升级 `react-native-css` 时先确认新版已包含该修复，再删除补丁。
- 没有 `tailwind.config.js`。主题 token、阴影、字体等写在 `global.css` 的 `@theme` 里；扫描范围由 `@source` 显式限定为 `app/`、`components/`、`features/`。`postcss.config.mjs` 只挂 `@tailwindcss/postcss`。
- `metro.config.js` 的 `inlineRem: 16` 保留 v4 时的 rem 换算；v5 原生默认是 14，去掉会让所有 rem 尺寸缩小。
- 颜色是运行时变量：`global.css` 用 `@theme inline` 把 `--color-primary-500` 映射为 `rgb(var(--primary-500))`；原始 RGB 通道由 `GluestackUIProvider` 提供（原生用 `VariableContextProvider`，Web 写入 `:root` 的 `<style>`，让 portal 出去的浮层也能继承）。JS 侧（`ConfigDetail`、`useRawThemeValues`、用户主题）仍使用 `--color-*` 键名，转换只在 `toCssVariables()` 一处。
  - 不要在 CSS 里给原始通道变量写默认值：`react-native-css` 会在编译期内联只声明过一次的变量，运行时换主题就失效了。
- `dark:` 编译为 `prefers-color-scheme` 媒体查询，跟随系统；没有 `.dark` class 策略。
- NativeWind v5 不再全局修补组件（没有 `cssInterop` / `remapProps`）。从 `react-native` 导入的基础组件由 Metro resolver 自动支持 `className`；Reanimated / legend-motion / SVG / expo-image / DOM 组件等第三方组件需要用 `styled()` 包装后再使用：
  - 普通 `className → style` 用 `components/ui/utils/with-class-name.ts` 的 `withClassName()`（直接用 `styled()` 时，TypeScript 会在这类组件上报类型过深）。
  - gluestack 图标用 `components/ui/utils/styled-icon.ts`；expo-image 用 `~/components/image` 导出的 `Image`。
- 原生端会丢弃没有 RN 对应的工具类（如 `basis-auto`、`overflow-auto`、`fixed`），Metro 会打印汇总警告。另外 Tailwind v4 的 `flex-0` 是 CSS `flex: 0`（`flexBasis: 0%`），在原生端会把元素压扁，不要使用。

### GluestackUI 版本约定

- `@gluestack-ui/core` / `@gluestack-ui/utils` 使用 5.x 正式包，组件包装层 `components/ui/*` 是本地维护的版本，`cssInterop` 已按上游 v5 模板的做法换成 `styled()`。
- 不要运行 `npx gluestack-ui upgrade` / `add`：它们会覆盖 `components/ui/*` 的本地定制和色板（用户主题依赖 `--color-primary-*` / `--color-accent-*`）。
- `modal`、`alert-dialog`、`menu` 的进出场动画用 Reanimated Keyframe，参数集中在 `components/ui/utils/overlay-animations.ts`；`actionsheet` 与上游 v4 模板一致，仍使用 `@legendapp/motion`。
- `patches/@gluestack-ui__core@5.0.15.patch` 回移了 v3 线 3.0.23 的 Actionsheet 初始高度修复（打开时防跳动），5.x 未包含。升级 core 时先确认上游是否已修复，再决定保留或删除该 patch。
