# UI 基础组件缺口清单（mobile → ui）

> 目的：厘清 `apps/mobile` 中哪些属于**基础组件**需要复刻到 `packages/ui`，哪些属于**业务组件**不应进入设计系统。  
> 关联文档：[ui-foundation.md](./ui-foundation.md) / `packages/ui/README.md` / `packages/ui/src/component/index.ts`  
> 判定标准：基础组件 = 无业务语义、可跨页面复用、仅依赖设计 token / 平台能力；业务组件 = 绑定歌单、播放、下载、存储、路由。

## 1. `packages/ui` 已有（无需重复）

`Button` `TextInput` `TextArea` `Checkbox` `Slider` `Switch` `Icon` `Label` `ActionMenu` `Modal` `AlertDialog` `DropdownSelect`，对应 `src/component/*` + `src/recipe/*`。已覆盖 `mobile/components/ui-next` 的 Tamagui 等价能力。

## 2. 待复刻的基础组件

按优先级排序，均为 `mobile/components/ui/*` 或 `mobile/components/*.tsx` 中的通用能力。

### P0 — 排版与原子

| 已完成？ | 组件      | mobile 源                                                                      | 复刻要点                                                               |
| -------- | --------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| ✅       | `Text`    | [`apps/mobile/components/ui/text`](../../apps/mobile/components/ui/text)       | 通用文本，`isTruncated/bold/size` 等排版变体；`ui` 的 `Label` 不能替代 |
| ✅       | `Heading` | [`apps/mobile/components/ui/heading`](../../apps/mobile/components/ui/heading) | `H1-H6` 语义标题，`Expo` 兼容                                          |

### P0 — 布局原语

| 已完成？ | 组件                | mobile 源                                                                                                                                                   | 复刻要点                                      |
| -------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
|          | `HStack` / `VStack` | [`apps/mobile/components/ui/hstack`](../../apps/mobile/components/ui/hstack) / [`apps/mobile/components/ui/vstack`](../../apps/mobile/components/ui/vstack) | `space/reversed` flex 原语，全局布局基石      |
|          | `DualScrollView`    | [`apps/mobile/components/dual-scroll-view.tsx`](../../apps/mobile/components/dual-scroll-view.tsx)                                                          | 响应式双栏骨架（`sm` 分栏），纯布局，不含业务 |

> `Box`（[`apps/mobile/components/ui/box`](../../apps/mobile/components/ui/box)）不复刻：其在 mobile 仅为 `View + boxStyle(tva)` 的 NativeWind 薄壳，用于透传 `className`；`packages/ui` 基于 Tamagui，`View`/`Stack` 已具备 styled 能力（`backgroundColor`/`padding`/`borderRadius` 等直接为 props），无需再包一层 `Box`。

### P1 — 表单与交互

| 已完成？ | 组件                          | mobile 源                                                                                                                                                                                | 复刻要点                                                                                                                                                                                     |
| -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|          | `FormControl`                 | [`apps/mobile/components/ui/form-control`](../../apps/mobile/components/ui/form-control)                                                                                                 | `Label + HelperText + ErrorText` 标准组合；`ui` 目前只有 `LabelError`                                                                                                                        |
|          | `Pressable`                   | [`apps/mobile/components/ui/pressable`](../../apps/mobile/components/ui/pressable)                                                                                                       | 通用按压层，需保留 `android-ripple` 处理（见 [`android-ripple.ts`](../../apps/mobile/components/ui/android-ripple.ts)）                                                                      |
|          | `Input` / `Textarea` Chrome   | [`apps/mobile/components/ui/input`](../../apps/mobile/components/ui/input) / [`textarea`](../../apps/mobile/components/ui/textarea)                                                      | 带 `Slot/Icon` 的输入容器；`ui-next/TextField` 是其无 NativeWind 平替，复刻时二选一，按 [`migrate-to-plain-stylesheet`](../skills/migrate-to-plain-stylesheet/SKILL.md) 采用 `StyleSheet` 版 |
|          | `TextField` / `TextareaField` | [`apps/mobile/components/ui-next/text-field.tsx`](../../apps/mobile/components/ui-next/text-field.tsx) / [`textarea-field.tsx`](../../apps/mobile/components/ui-next/textarea-field.tsx) | `StyleSheet + useUiNextColors` 实现，`sm/md/lg/xl` 与 `invalid/disabled/left/right` 能力，应作为 `TextInput/TextArea` 的下一代形态进入 `ui`                                                  |

### P1 — 反馈与状态

| 已完成？ | 组件                        | mobile 源                                                                                                                                                | 复刻要点                                           |
| -------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
|          | `Skeleton` / `SkeletonText` | [`apps/mobile/components/ui/skeleton`](../../apps/mobile/components/ui/skeleton) / [`skeleton-text.tsx`](../../apps/mobile/components/skeleton-text.tsx) | 骨架屏，`SkeletonText` 为 `VStack + Skeleton` 组合 |
|          | `Toast` / `NotifyToast`     | [`apps/mobile/components/notify-toast.tsx`](../../apps/mobile/components/notify-toast.tsx)                                                               | `success/info/warning/error` 纯 UI 提示            |
|          | `ErrorContent`              | [`apps/mobile/components/error-content.tsx`](../../apps/mobile/components/error-content.tsx)                                                             | 通用错误/空状态占位（图标 + 文案）                 |

### P2 — 浮层

| 已完成？ | 组件          | mobile 源                                                                              | 复刻要点                                                                              |
| -------- | ------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
|          | `Actionsheet` | [`apps/mobile/components/ui/actionsheet`](../../apps/mobile/components/ui/actionsheet) | 底部动作面板容器；`ui` 的 `ActionMenu` 已有 Sheet 交互，但原生 `Actionsheet` 结构未搬 |
|          | `Menu`        | [`apps/mobile/components/ui/menu`](../../apps/mobile/components/ui/menu)               | 锚点浮层菜单，与 `ActionMenu` 互补                                                    |

## 3. 特殊项：`Layout` 不应原样复刻

[`apps/mobile/components/layout.tsx`](../../apps/mobile/components/layout.tsx)（含 [`layout-button.tsx`](../../apps/mobile/components/layout-button.tsx)）是**应用壳**而非纯基础组件：

- 通用部分（可抽象为 `PageShell` 进入 `ui`）：`safeAreaInsets` 分发、`maxWidth: 1280` 居中、`header 64px`、`contentOuter/contentInner` 响应式骨架、标题 `header` 的 `AccessibilityInfo` 自动聚焦。
- 业务耦合（必须留在 `mobile`）：`leftAccessories === "BACK_BUTTON"` 内联 `router.back()/navigate("/")`、` <MainBottomSheetCloseHost />` 钉底。前者依赖 `expo-router`，后者依赖播放器业务，违背 `ui -/-> mobile` 隔离（见 `ui-foundation.md` 依赖方向）。

建议拆两层：`ui` 仅提供无路由/无业务的 `PageShell(props: { headerLeft, headerCenter, headerRight, children, insets, maxWidth? })`，`mobile` 再包 `AppLayout` 实现返回按钮与 `CloseHost`。

`DualScrollView` 虽与 `Layout` 配合使用，但本身无路由/业务耦合，仍属基础组件。

## 4. 明确不搬的业务组件（避免混淆）

以下均绑定播放、歌单、下载、存储或路由编排，不进入 `packages/ui`，待 Epic 7 屏幕重写时通过稳定用例 API 消费：

`playlist-item.tsx` `song-item.tsx` `video-item.tsx` `playlist-detail/*` `video-detail/*` `main-bottom-sheet/*` `download-button.tsx` `check-update-dialog.tsx` `setting-menu.tsx` `settings-switch.tsx` `log-viewer.tsx` `action-sheet-current.tsx` `action-menu.tsx`（业务版）`yuru-chara.tsx` `error-toast-host.tsx` 等。

## 5. 建议复刻顺序

1. `Text/Heading` + `HStack/VStack`（所有页面依赖；`Box` 由 Tamagui `View`/`Stack` 的 styled 能力直接覆盖）
2. `FormControl/Pressable` + `TextField/TextareaField`（表单闭环）
3. `Skeleton/SkeletonText/Toast/ErrorContent`（加载与反馈）
4. `Menu/Actionsheet`（浮层补齐）
5. `PageShell`（去业务壳，配合屏幕重写时机）

> 维护：每完成一项，在 `ui-foundation.md` 的 Initial Components 列表中追加并补充 Story。
