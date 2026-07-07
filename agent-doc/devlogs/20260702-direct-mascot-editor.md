# Bilisound - 20260702 看板娘直接拖拽与缩放编辑

## 背景

主题编辑器原先通过 `originalScale`、`offsetX`、`offsetY` 三个滑块调整看板娘原始尺寸模式下的位置和大小。这个交互有两个问题：

- 用户需要在滑块和预览之间来回观察，难以直观地把图片拖到目标位置。
- Android 真机上直接实现 pinch 时，如果继续以用户选择的锚点参与每一帧计算，容易在缩放过程或松手时出现位置漂移。

因此本次改动为 `original` 尺寸模式增加独立编辑模式：用户进入编辑模式后直接拖拽图片、双指缩放，完成后再回到普通主题编辑表单。内部实现上，编辑态使用更简单稳定的 `left / top / scale` 坐标模型，只在进入和提交时与用户配置的锚点 offset 互转。

## 主要变更

### 1. 在主题编辑页增加看板娘编辑模式

主题编辑页新增 `isMascotEditMode` 状态和编辑快照。进入编辑模式时保存当前表单值，取消时恢复快照，完成时保留当前拖拽和缩放结果。

文件引用：`apps/mobile/app/settings/theme/editor.tsx:141`

```tsx
const enterMascotEditMode = useCallback(() => {
  mascotEditSnapshotRef.current = {
    align: form.getValues("align"),
    verticalAlign: form.getValues("verticalAlign"),
    size: form.getValues("size"),
    originalScale: form.getValues("originalScale"),
    opacity: form.getValues("opacity"),
    offsetX: form.getValues("offsetX"),
    offsetY: form.getValues("offsetY"),
  };
  setIsMascotEditMode(true);
}, [form]);
```

编辑模式中的位置变化通过 `handleMascotChange` 写回 react-hook-form，避免直接耦合到保存逻辑。

文件引用：`apps/mobile/app/settings/theme/editor.tsx:180`

```tsx
const handleMascotChange = useCallback(
  (patch: Partial<YuruCharaLayout>) => {
    if (patch.offsetX !== undefined) form.setValue("offsetX", patch.offsetX, { shouldValidate: false });
    if (patch.offsetY !== undefined) form.setValue("offsetY", patch.offsetY, { shouldValidate: false });
    if (patch.originalScale !== undefined)
      form.setValue("originalScale", patch.originalScale, { shouldValidate: false });
  },
  [form],
);
```

### 2. 原始尺寸模式改为进入直接编辑

当看板娘处于 `original` 尺寸模式且存在图片资源时，表单展示「调整位置和大小」按钮。进入编辑模式后，ScrollView 禁止滚动并禁用普通表单指针事件，避免拖拽和页面滚动互相干扰。

文件引用：`apps/mobile/app/settings/theme/editor.tsx:344`

```tsx
<EditorMascotBackground
  layout={previewLayout ?? theme.yuruChara}
  uri={assetUri}
  editable={isMascotEditMode}
  onChange={handleMascotChange}
  onCancel={cancelMascotEditMode}
  onReset={resetMascotEdit}
  onDone={saveMascotEditMode}
/>
```

文件引用：`apps/mobile/app/settings/theme/editor.tsx:432`

```tsx
{currentSize === "original" && assetUri ? (
  <View style={styles.field}>
    <ButtonOuter>
      <Button variant="outline" action="secondary" onPress={enterMascotEditMode}>
        <ButtonMonIcon name="fa6-solid:arrows-up-down-left-right" />
        <ButtonText>调整位置和大小</ButtonText>
      </Button>
    </ButtonOuter>
  </View>
) : null}
```

原始尺寸模式下隐藏原来的比例和偏移滑块，避免出现两套控制方式。

文件引用：`apps/mobile/app/settings/theme/editor.tsx:458`

```tsx
{size !== "original" ? (
  <View style={styles.conditionalField}>
    <Controller
      control={form.control}
      name="originalScale"
      render={({ field: { value, onChange } }) => <OriginalScaleSlider value={value} onChange={onChange} />}
    />
  </View>
) : null}
```

文件引用：`apps/mobile/app/settings/theme/editor.tsx:513`

```tsx
{currentSize !== "original" ? (
  <Controller
    control={form.control}
    name="offsetX"
    render={({ field: { value, onChange } }) => (
      <View style={styles.sliderField}>
        <OffsetSlider label="水平偏移" value={value} onChange={onChange} />
      </View>
    )}
  />
) : null}
```

### 3. 编辑态内部使用左上角绝对坐标

`EditorMascotBackground` 在编辑态内部不再持续使用用户选择的锚点参与每帧手势计算，而是将当前配置转换为 `left / top / scale`。这样拖拽只改变 `left / top`，缩放只围绕固定焦点改变 `left / top / scale`。

文件引用：`apps/mobile/features/theme/components/editor-mascot-background.tsx:54`

```tsx
const leftRef = useSharedValue(0);
const topRef = useSharedValue(0);
const scaleRef = useSharedValue(layout?.originalScale ?? 100);
const anchorXRef = useSharedValue(0.5);
const anchorYRef = useSharedValue(0.5);
const referenceXRef = useSharedValue(frame.width / 2);
const referenceYRef = useSharedValue(frame.height / 2);
```

进入编辑模式或非编辑态渲染时，使用当前锚点、offset 和 scale 计算内部左上角坐标。

文件引用：`apps/mobile/features/theme/components/editor-mascot-background.tsx:87`

```tsx
if (!editable || enteringEditable) {
  const scale = effectiveLayout.originalScale ?? 100;
  const scaleRatio = clampOriginalScale(scale) / 100;
  scaleRef.value = scale;
  leftRef.value = referenceX + (effectiveLayout.offsetX ?? 0) - imageWidth * scaleRatio * anchorX;
  topRef.value = referenceY + (effectiveLayout.offsetY ?? 0) - imageHeight * scaleRatio * anchorY;
}
```

渲染时，编辑态图片直接使用 UI thread 上的 animated frame。

文件引用：`apps/mobile/features/theme/components/editor-mascot-background.tsx:133`

```tsx
const animatedImageStyle = useAnimatedStyle(() => {
  const scaleRatio = clampOriginalScale(scaleRef.value) / 100;
  const width = Math.max(1, imageWidthRef.value * scaleRatio);
  const height = Math.max(1, imageHeightRef.value * scaleRatio);
  return {
    width,
    height,
    left: leftRef.value,
    top: topRef.value,
  };
});
```

### 4. 分离单指拖拽与双指缩放

拖拽手势限制为单指，避免 Android 上双指 pinch 被 `Pan` 同时识别并提交过期 offset。

文件引用：`apps/mobile/features/theme/components/editor-mascot-background.tsx:184`

```tsx
const pan = Gesture.Pan()
  .minDistance(8)
  .maxPointers(1)
  .onStart(() => {
    skipPanCommitRef.value = false;
    startLeftRef.value = leftRef.value;
    startTopRef.value = topRef.value;
  })
  .onChange(event => {
    leftRef.value = startLeftRef.value + event.translationX;
    topRef.value = startTopRef.value + event.translationY;
  });
```

Pinch 在第一帧记录稳定的起始焦点，后续缩放都围绕该焦点计算，避免 Android 松手时 `focalX / focalY` 抖动导致位置漂移。

文件引用：`apps/mobile/features/theme/components/editor-mascot-background.tsx:207`

```tsx
const pinch = Gesture.Pinch()
  .onStart(() => {
    skipPanCommitRef.value = true;
    startScaleRef.value = scaleRef.value;
    startLeftRef.value = leftRef.value;
    startTopRef.value = topRef.value;
    startFocalXRef.value = 0;
    startFocalYRef.value = 0;
    pinchImagePointXRef.value = -1;
    pinchImagePointYRef.value = -1;
  })
  .onChange(event => {
    const nextScale = clampOriginalScale(startScaleRef.value * event.scale);
    const startScaleRatio = startScaleRef.value / 100;
    const nextScaleRatio = nextScale / 100;
    if (pinchImagePointXRef.value < 0 || pinchImagePointYRef.value < 0) {
      startFocalXRef.value = event.focalX;
      startFocalYRef.value = event.focalY;
      pinchImagePointXRef.value = startScaleRatio > 0 ? (startFocalXRef.value - startLeftRef.value) / startScaleRatio : 0;
      pinchImagePointYRef.value = startScaleRatio > 0 ? (startFocalYRef.value - startTopRef.value) / startScaleRatio : 0;
    }
    const nextLeft = startFocalXRef.value - pinchImagePointXRef.value * nextScaleRatio;
    const nextTop = startFocalYRef.value - pinchImagePointYRef.value * nextScaleRatio;
    scaleRef.value = nextScale;
    leftRef.value = nextLeft;
    topRef.value = nextTop;
  });
```

### 5. 提供编辑态控制层与 Web 鼠标缩放

编辑态覆盖层提供当前基准提示，以及「重置」「取消」「完成」三个操作。手势目标使用全屏透明层，控制按钮层级更高，避免手势吞掉按钮点击。

文件引用：`apps/mobile/features/theme/components/editor-mascot-background.tsx:314`

```tsx
{editable ? (
  <View pointerEvents="box-none" style={styles.editUiLayer}>
    <View style={styles.editControls}>
      <View testID="editor-mascot-anchor-badge" style={styles.anchorBadge}>
        <Text style={styles.anchorBadgeText}>基准：{anchorLabel}</Text>
      </View>
      <View style={styles.editButtonRow}>
```

Web 端没有双指手势，编辑态通过鼠标滚轮缩放，并使用当前鼠标位置作为焦点。

文件引用：`apps/mobile/features/theme/components/editor-mascot-background.tsx:145`

```tsx
useEffect(() => {
  if (Platform.OS !== "web" || !editable) return;
  const win = typeof window !== "undefined" ? window : null;
  if (!win) return;
  function handleWheelEvent(event: WheelEvent) {
    event.preventDefault();
    const startScale = scaleRef.value;
    const nextScale = clampOriginalScale(startScale * (1 - event.deltaY * 0.001));
```

### 6. 允许 scale clamp 在 worklet 中复用

Pinch 和 animated style 运行在 UI thread，因此 `clampOriginalScale` 需要声明为 worklet，避免 Reanimated / Worklets 报同步调用非 worklet 函数错误。

文件引用：`apps/mobile/features/theme/editor.ts:128`

```ts
export function clampOriginalScale(value: number): number {
  "worklet";
  if (!Number.isFinite(value)) return 100;
  return Math.min(300, Math.max(5, Math.round(value)));
}
```

## 验证

开发过程中执行过以下验证。

```bash
pnpm -C apps/mobile test features/theme/components/__tests__/editor-mascot-background.test.tsx --no-coverage --watchAll=false
```

结果：通过，`EditorMascotBackground` 组件测试覆盖普通 Portal 渲染和编辑模式控件。

```bash
EXPO_PUBLIC_ENV=development pnpm -C apps/mobile exec expo export --platform android --clear
```

结果：Android bundle export 成功，无编译错误。

```bash
git diff --check
```

结果：通过，无空白错误。

```bash
agent-device metro reload --session mascot-pinch --platform android
```

结果：物理 Android 设备重新加载成功，可进入看板娘编辑模式。

```txt
Chrome DevTools: http://localhost:8081/settings/theme/editor?id=1782827487672
```

结果：Web 编辑页可进入编辑模式，鼠标滚轮缩放路径正常。

Android 真机手动验证：右下基准、图片视觉位于中间时，pinch 缩小过程和松手后均不再漂移。

已知未解决项：`pnpm -C apps/mobile lint` 仍受既有 ESLint 10 / `@typescript-eslint` 兼容问题阻塞；`pnpm -C apps/mobile exec tsc --noEmit` 仍受项目既有类型错误阻塞，未作为本次改动完成条件。

## 提交

```txt
a0fe2d32aa79eb24860d96270d0f9f8f17981890 feat: add direct mascot positioning editor
```
