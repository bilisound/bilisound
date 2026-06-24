# Bilisound - 20260624 Config Facade 重构

## 背景

`apps/mobile/store/settings.ts` 是一个 Zustand store，包含 7 个字段，混合了外观、下载、资源策略、诊断四个语义层级。这个 store 被 16 个文件直接 import，覆盖 UI 组件、business 逻辑、初始化代码。多个消费者使用 `useSettingsStore.getState()` 做非响应式读取，依赖关系被隐藏。

v3 计划中 Config Architecture epic 的第一步是：在不改变持久化数据的前提下，引入 `features/config/` 作为 facade，通过语义化的 selectors 和 policies 暴露窄访问点，将消费者对 Zustand 的直接依赖收拢到单一模块。

## 主要变更

### 1. 创建 features/config/ 模块

新增 5 个文件，按职责分层：

**类型层** — `apps/mobile/features/config/types.ts`

```ts
export interface AppearanceConfig {
  theme: string;
  showYuruChara: boolean;
  showPlaylistInGrid: boolean;
}

export interface DownloadConfig {
  downloadNextTrack: boolean;
}

export interface ResourceConfig {
  filterResourceURL: boolean;
  useLegacyID: boolean;
}

export interface DiagnosticsConfig {
  debugMode: boolean;
}

export interface AllConfig extends AppearanceConfig, DownloadConfig, ResourceConfig, DiagnosticsConfig {}
```

**Store 包装层** — `apps/mobile/features/config/store.ts`

唯一保留对 `~/store/settings` 直接 import 的文件。暴露 `getConfigState()`、`updateConfig()`、`toggleConfig()`、`rehydrateConfig()` 四个函数：

```ts
import useSettingsStore from "~/store/settings";
import type { AllConfig } from "./types";

export function getConfigState(): AllConfig {
  const state = useSettingsStore.getState();
  return {
    theme: state.theme,
    showYuruChara: state.showYuruChara,
    showPlaylistInGrid: state.showPlaylistInGrid,
    downloadNextTrack: state.downloadNextTrack,
    filterResourceURL: state.filterResourceURL,
    useLegacyID: state.useLegacyID,
    debugMode: state.debugMode,
  };
}
```

**响应式 selectors** — `apps/mobile/features/config/selectors.ts`

供 UI 组件使用的 hooks，基于 `useShallow` 做精确订阅：

- `useSettingsManagement()` — 设置管理页面专用，返回全部字段 + update/toggle
- `useThemeConfig()` — 外观设置页面
- `useThemeName()` / `useShowYuruChara()` — 单字段轻量 hooks
- `usePlaylistViewConfig()` / `useDownloadConfig()` / `useResourceConfig()` / `useDiagnosticsConfig()`

**非响应式 policies** — `apps/mobile/features/config/policies.ts`

供 business/init 代码使用的纯函数读取器：

```ts
export function shouldFilterResourceURL(): boolean {
  return getConfigState().filterResourceURL;
}

export function isDebugMode(): boolean {
  return getConfigState().debugMode;
}
```

**公共 API** — `apps/mobile/features/config/index.ts`

统一 barrel export，消费者只需 `import { ... } from "~/features/config"`。

### 2. 迁移 16 个消费者

所有直接 import `useSettingsStore` 的文件（`features/config/` 以外）已迁移。示例：

**business 代码**（非响应式 → policy reader）

`apps/mobile/business/download.ts:89`

```diff
-    useSettingsStore.getState().filterResourceURL,
+    shouldFilterResourceURL(),
```

**UI 组件**（响应式 → selector hook）

`apps/mobile/components/yuru-chara.tsx:12`

```diff
-import useSettingsStore from "~/store/settings";
-import { useShallow } from "zustand/shallow";
+import { useThemeName } from "~/features/config";

-  const theme = useSettingsStore(useShallow(state => state.theme));
+  const theme = useThemeName();
```

**初始化代码**（store 直接调用 → policy + helper）

`apps/mobile/utils/init.ts:5`

```diff
-import useSettingsStore from "../store/settings";
+import { rehydrateConfig, isDebugMode } from "~/features/config";

-  await useSettingsStore.persist.rehydrate();
-  const settings = useSettingsStore.getState();
-  log.setSeverity(settings.debugMode ? "debug" : "info");
+  await rehydrateConfig();
+  log.setSeverity(isDebugMode() ? "debug" : "info");
```

### 3. 更新 v3 plan 文档

`agent-doc/v3-plan/config-architecture.md` 新增 Implementation Status 章节，记录 facade 结构和消费者迁移状态。`agent-doc/v3-plan/epic-breakdown.md` 的 Epic 2 标记 facade 和迁移为已完成。

### 4. 同步 agent-doc

`agent-doc/data-layer.md` 的 Zustand 章节新增 Config Facade 说明表。`agent-doc/architecture.md` 新增 Feature 模块章节。

## 验证

```bash
pnpm -C apps/mobile exec tsc --noEmit 2>&1 | grep -E "features/config|store/settings"
```

结果：无 config 相关错误（其余报错均为已有的 gluestack-ui 类型、expo-file-system 等问题）。

```bash
agent-device open moe.bilisound.app.dev --platform android --relaunch
agent-device snapshot --platform android
```

结果：Android 真机上主界面正常加载，设置页面所有开关、按钮、子页面（外观设置）渲染正常，`useThemeConfig()` / `useSettingsManagement()` / `useShowYuruChara()` 等 hooks 响应式更新通过验证。

```bash
grep -r 'from "~/store/settings"' apps/mobile/ --include='*.ts' --include='*.tsx'
```

结果：仅 `features/config/store.ts` 保留直接引用，其余 16 个消费者全部迁移。

## 提交

```txt
3a1eaa1 refactor(config): introduce features/config facade over settings store
0f90349 docs: sync agent-doc with config facade refactoring
```
