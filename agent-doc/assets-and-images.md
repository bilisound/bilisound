# 图片资源与渲染约定

本页记录 mobile 图片资源的已知坑。改图片显示问题前先读这里。

## TypeScript 声明

- `*.png` 声明在 `apps/mobile/global.d.ts`。
- `global.d.ts` 不能有顶层 `import` / `export`，否则 `declare module "*.png"` 不再作为全局声明生效。
- 需要引用外部类型时，使用内联 `import("...").TypeName`。

## ThemeButton 看板娘预览

- `apps/mobile/app/settings/theme.tsx` 的主题按钮预览应使用 PNG。
- 这里以前使用 SVG，但进入设置页时会出现约 0.5 秒卡顿。
- 不要为了复用 `components/yuru-chara.tsx` 再把设置页预览改回 SVG。
- 本地 PNG 预览优先使用 `react-native` 的 `Image` 加 `StyleSheet`。此前在该页面观察到 `expo-image` + `className` + 静态 PNG source 的组合会导致预览不显示。

## 首页看板娘

- `components/yuru-chara.tsx` 仍使用 SVG 组件渲染首页右下角看板娘。
- 首页看板娘和设置页主题按钮预览不是同一性能场景，不要默认合并实现。
- Expo Image 57 的 Android 实现不会对本地 `file://` 图片应用 `source.cacheKey`。替换用户看板娘时必须生成新的资源 ID 和文件 URI，不能覆盖同一路径后只修改 `cacheKey`。

## 验证方式

- 图片是否显示不能只依赖 `agent-device snapshot -i`。
- 必须使用截图确认，尤其是透明度、裁切、选中态背景上的可见性。
