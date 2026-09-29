/**
 * features/player — app-side wrapper around @bilisound/player.
 *
 * 职责：为 UI 层（routes / components / hooks）提供稳定的播放器
 * hooks / controls / types 入口，把 `@bilisound/player` 的直接 import
 * 收敛到此模块。未来需要为播放器添加 app-side 语义（埋点、错误边界、
 * 与 config 联动、view model 映射）时，在此扩展而不污染 player 包。
 *
 * 依赖方向：UI -> features/player；features/player -> @bilisound/player。
 * 不在低层 wrapper 中引入 playlist / bilibili / cache 领域知识。
 * features/playback 作为播放编排边界，仍可直接消费 @bilisound/player。
 *
 * 当前为 curated re-export：player 公共 API 经 packages/player/src/index.ts
 * 已 curated，此处再导出供 UI 使用。Epic 7 可在此层注入 view model。
 */

export * from "@bilisound/player";
