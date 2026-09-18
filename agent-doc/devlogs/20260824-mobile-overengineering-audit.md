# Bilisound mobile 过度工程审计

> 审计日期：2026-08-24  
> 范围：`apps/mobile/`（不含 `components/ui/` vendored gluestack 全量，仅审查其死区）  
> 方法：4 个并行 agent 分区扫描（features / utils+business+hooks / components+storage+store / dependencies）+ 人工交叉验证  
> 边界：仅针对过度工程与复杂度。正确性 bug、安全漏洞、性能问题不在范围内。

## 排名清单（从大到小）

每行一条，格式：`<tag> <what to cut>. <replacement>. [<path>]`

标签说明：

- `delete:` 死代码、未使用的灵活性、投机性功能。替换：无。
- `stdlib:` 手写标准库已有的东西。标注函数名。
- `native:` 依赖或代码做了平台已提供的事。标注平台特性。
- `yagni:` 单实现接口、无人设置的配置、单调用方层级。
- `shrink:` 同逻辑、更少行。给出更短形式。

---

```
delete  components/ui/icon/ 整个 2378 行 vendored 图标桶——全项目仅 AlertCircleIcon、CheckIcon 被引（4 处），且 components/icon.tsx 已有等价实现。迁移这 2 个引用后整目录删除。 [apps/mobile/components/ui/icon/index.tsx]
delete  components/ui/input/（190 行）零外部引用，已被 ui-next/text-field 取代。 nothing. [apps/mobile/components/ui/input/index.tsx]
delete  components/ui/textarea/（77 行）零外部引用，已被 ui-next/textarea-field 取代。 nothing. [apps/mobile/components/ui/textarea/index.tsx]
delete  components/ui/hstack/（56 行）全项目零引用（vstack 仍存活）。 nothing. [apps/mobile/components/ui/hstack/index.tsx]
delete  utils/wbi.ts 整个文件（encWbi/getWbiKeys/signParam + WbiCache）——SDK 在 packages/sdk/src/wbi.ts 有自己的副本，apps/mobile 无一文件 import 它。连带 md5 依赖也可删。 [apps/mobile/utils/wbi.ts]
delete  jscodeshift——codemod CLI 被误放 runtime deps，0 source import、0 script 引用。 nothing. [jscodeshift]
native  react-native-url-polyfill——唯一用途是 business/format.ts 的 new URL()+searchParams.get()，RN 0.86 hermes 已内置 WHATWG URL+URLSearchParams。 [react-native-url-polyfill]
delete  p-queue——0 imports。 nothing. [p-queue]
delete  promise-memoize——0 imports（+ @types/promise-memoize）。 nothing. [promise-memoize]
delete  sanitize-filename——0 imports。 nothing. [sanitize-filename]
delete  sleep-promise——0 imports，new Promise(r=>setTimeout(r,ms)) 即可。 nothing. [sleep-promise]
yagni   core-js——to-spliced 导入但未用；structured-clone 仅用于 app/_layout.tsx 主题对象浅拷贝，{...theme,colors:{...theme.colors}} spread 即可。 [core-js]
yagni   path-browserify——仅用 path.extname() 和 path.parse().name（3 文件），2 行 regex helper 替代（+ @types/path-browserify）。 [path-browserify]
yagni   uuid——仅 v4() 用于 store/history.ts 和 app/video/[id].tsx；react-native-get-random-values 已 polyfill crypto.getRandomValues，5 行 helper 替代。 [uuid]
yagni   superjson——仅为 storage/zustand.ts 里 visitedAt: Date 的 round-trip，JSON.stringify + date-reviver 替代。 [superjson]
yagni   filesize——3 调用全默认选项，~8 行 KB/MB/GB helper 替代。 [filesize]
yagni   fuse.js——2 调用做歌单模糊搜索，case-insensitive includes filter 可替代（丢失 fuzzy，UX tradeoff）。 [fuse.js]
yagni   babel-plugin-module-resolver——tsconfig.json 已映射 ~/*，metro 直接读 tsconfig paths，删 babel.config.js 里的 plugin 块。 [babel-plugin-module-resolver]
yagni   md5——唯一消费者 utils/wbi.ts 本身是死代码（见上），删 wbi.ts 后此依赖随之去除。 [md5]
delete  store/features.ts 整个 persisted store（enableNavbar2 标志）零外部引用，纯 speculative feature flag。 nothing. [apps/mobile/store/features.ts]
delete  useLoading hook——0 importers。 nothing. [apps/mobile/hooks/useLoading.tsx]
delete  utils/migration/playlist.web.ts shim（export async function handlePlaylist() {}）——init.web.ts 不 import 它，不可达。 nothing. [apps/mobile/utils/migration/playlist.web.ts]
shrink  utils/datetime.ts 的 formatDate 格式引擎——唯一调用方传 "yyyy-MM-dd"（MetaData.tsx:138），22 行格式解析器是 yagni，`${y}-${pad(M)}-${pad(d)}` 即可。 [apps/mobile/utils/datetime.ts]
stdlib  utils/misc.ts 的 simpleCopy（JSON.parse(JSON.stringify(x))）——structuredClone 已在 polyfill.js 注入且 _layout.tsx 已用。 [apps/mobile/utils/misc.ts]
shrink  utils/string.ts 的 convertToHTTPS（10 行含 console.log）——url.startsWith("http://localhost:") ? url : url.replace(/^http:\/\//,"https://")。 [apps/mobile/utils/string.ts]
shrink  features/playlist/source-codec.ts 整个文件（两个 one-liner：JSON.parse/JSON.stringify 包装）——inline 进 mappers.ts/exchange.ts 的 5 个调用点。 [apps/mobile/features/playlist/source-codec.ts]
yagni   utils/logger-common.ts——2 个 regex 的独立文件，logger.web.ts 从不 import 它，inline 进 logger.ts。 [apps/mobile/utils/logger-common.ts]
yagni   hooks/useIsNarrowWidth——单调用方（app/(main)/index.tsx:24），inline useWindowSize().height < 480。 [apps/mobile/hooks/useIsNarrowWidth.ts]
yagni   business/qrcode.ts（handleQrCode = resolveVideoAndJump + return ""）——单调用方 app/barcode.tsx:64，inline。 [apps/mobile/business/qrcode.ts]
yagni   business/mp4.ts（extractAudioFile，16 行包装 Mp4.extractAudio + 计时 log）——inline 进唯一调用方 download.ts:155。 [apps/mobile/business/mp4.ts]
delete  features/theme/editor.ts 的 removeYuruCharaFromTheme——exported 但只在自身测试里调用，近重复 createYuruCharaRemovalDraft（仅差 updatedAt 字段）。 nothing. [apps/mobile/features/theme/editor.ts:78]
delete  features/playlist/apply-draft.ts 的 getApplyPlaylistDraft——exported getter，仅测试引用，无生产调用方。 nothing. [apps/mobile/features/playlist/apply-draft.ts:51]
delete  features/theme/components/native-color-picker-modal.tsx base stub（return null）——native 解析 .native.tsx、web 解析 .web.tsx，base 的 stub 函数从不渲染，只保留共享的 Props 类型。 [apps/mobile/features/theme/components/native-color-picker-modal.tsx:10]
yagni   features/theme/editor.ts 的 getYuruCharaRenderMetrics——无条件返回 usesFullscreenFrame:false + contentFit:"fill"，_frame 参数未用，两个调用方的 metrics.usesFullscreenFrame 判断是死分支。 drop 字段+死分支。 [apps/mobile/features/theme/editor.ts:113]
shrink  features/theme/image-colors.ts 的 ExtractedThemeDebugColor——携带 label/count/weight/selectedAs 但从不读取（getUniqueDebugColorValues 只读 .color），让 extractThemeBaseColors 直接返回 string[]。 [apps/mobile/features/theme/image-colors.ts:13]
shrink  features/theme/components/editor-mascot-background.tsx 的 handleChange/handleOverlayLayout——useMemo(()=>fn,[deps]) 当 useCallback 用，handleChange 仅转发 onChange?.(patch) 无稳定化收益。 useCallback 或直接 inline。 [apps/mobile/features/theme/components/editor-mascot-background.tsx:133]
delete  store/history.ts 的 swapHistoryList/setHistoryList/removeHistoryList——三方法无调用者（仅 append/clear/repair 在用）。 nothing. [apps/mobile/store/history.ts:56]
delete  store/download.ts 的 clearDownloadItem（与 cancelAll 同体，clearDownloadItem 无人调）+ 未声明且从不读取的 abortController 字段。 nothing. [apps/mobile/store/download.ts:51]
delete  store/playback-speed.ts 的 setSpeedValue/setRetainPitch——两 setter 无调用者（外部只用 applySpeed + speedValue + retainPitch）。 nothing. [apps/mobile/store/playback-speed.ts:18]
delete  store/bottom-sheet.ts 的 toggle 方法——无调用者（调用方只用 open/close）。 nothing. [apps/mobile/store/bottom-sheet.ts:7]
shrink  utils/vendors/av-bv.ts 的 av2bv——无调用者（仅 bv2av 在 useDownloadMenuItem.ts 被用）。 nothing. [apps/mobile/utils/vendors/av-bv.ts:13]
yagni   features/theme/editor.ts 的 getYuruCharaContainScale——export 但仅文件内部调用。 drop export。 [apps/mobile/features/theme/editor.ts:68]
```

## 交叉验证修正

`md5` 依赖：单 agent 初判保留（因 `utils/wbi.ts` 需要 MD5 做 WBI 签名），但跨区域交叉验证发现 `wbi.ts` 本身是死代码——SDK 在 `packages/sdk/src/wbi.ts` 有独立副本，`apps/mobile` 无一文件 import 本地副本。因此 `md5` 可随 `wbi.ts` 一起删除。这是分区审计中单 agent 会漏掉的交叉发现。

## 汇总

```
net: -~2600 lines, -14 deps possible.
```

- **最大单笔行数削减**：`components/ui/icon/`（2378 行 vendored 图标桶，仅 2 个图标存活）。迁移这 2 个引用（`AlertCircleIcon`、`CheckIcon`）至 `components/icon.tsx` 后整目录删除。
- **最大依赖瘦身**：`jscodeshift`（codemod 工具误入 runtime deps，0 引用）+ `core-js`（仅用于可替代的浅拷贝）+ `react-native-url-polyfill`（RN 0.86 已内置）。

## 未列入（已确认有正当理由）

以下经审查后确认非过度工程，保留现状：

- **`repository-contract.ts` + 双实现**：native/web 在 `importPlaylistBatch` 真实分歧（事务 vs 顺序执行），且有 `__tests__/repository.test.ts` 契约测试覆盖两端。注：16 个方法中 15 个完全重复，仍有 shrink 空间（基础 repo + web 仅 override 一个方法），但属平台分歧边界，尊重原架构判定。
- **`config/policies.ts` / `selectors.ts`**：薄但每个 accessor 有真实调用方，是有意的类型切片边界（业务层不直接依赖 Zustand）。
- **`nativewind` / `tailwind-merge`**：19 / 5 处活跃 import（cssInterop、twMerge、vars）。migrate-to-plain-stylesheet skill 存在但迁移未完成，当前删除会破坏运行。
- **`colorjs.io`**：`features/theme/color-scale.ts` 的 OKLCH↔sRGB 色彩空间转换，非平凡数学。
- **`smol-toml`**：`utils/exchange/{playlist,import-helper}` 真实 parse/stringify。
- **`lodash`**：`merge`（深合并，app.config.ts）、`throttle`（playback-speed.ts）、`omit` 均非平凡。
- **`react-hook-form`**：3 个表单（playlist meta、theme editor、index）在用。
- **`entities`**：Hermes/RN 无原生 HTML 实体解码器；B 站描述含命名实体，手写风险高。保留（边界）。
- **`@tailwindcss/container-queries`**：2 个文件使用 `@container` 类。
- **`logger.ts` / `logger.web.ts` 分流**：web 端无 `expo-file-system`，真实平台分歧。
- **其余 `.web.ts` / `.native.tsx` 平台分叉**：`repository.web.ts`、`storage.web.ts`、`archive.web.ts`、`image-colors.web.ts` 等——真实平台分歧，不在过度工程范围。

## 审计方法

1. 摸清 `apps/mobile/` 全部 260 个 `.ts/.tsx` 文件结构与体积分布。
2. 派出 4 个并行 agent 分区深挖：
   - **Aoi**：`features/`（playlist、config、bilibili、playback、theme）
   - **Rin**：`utils/` + `business/` + `hooks/`
   - **Sora**：`components/` + `storage/` + `store/`（重点调查 `ui/` vs `ui-next/` 双层关系）
   - **Kai**：`package.json` 依赖逐个 grep 验证
3. 人工读取关键文件（`repository-contract.ts`、`repository.ts`、`repository.web.ts`、`config/types.ts`、`string.ts`）校准判定。
4. 跨 agent 结果交叉验证（如 `md5` ↔ `wbi.ts` 的依赖关系）。
