# ActionMenu 组件重构记录

## 背景

为了统一应用中的操作菜单样式和行为，我们对 `playlist.tsx` 中的 `LongPressActions` 组件进行了重构，使其使用与 `player-control-menu.tsx` 相同的 `ActionMenu` 组件。

## 重构前

重构前，`playlist.tsx` 中的 `LongPressActions` 组件使用了多个独立的 `ActionsheetItem` 组件来构建菜单：

```tsx
function LongPressActions({ showActionSheet, displayTrack, onAction, onClose }: LongPressActionsProps) {
  const { colorValue } = useRawThemeValues();
  const showEditCover = !displayTrack?.source;

  return (
    <Actionsheet isOpen={showActionSheet} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="z-50">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        {!!displayTrack && (
          <ActionSheetCurrent
            line1={displayTrack.title}
            line2={`${displayTrack.amount} 首歌曲`}
            image={getImageProxyUrl(displayTrack.imgUrl!)}
          />
        )}
        <ActionsheetItem onPress={() => onAction("edit")}>
          <View className={"size-6 items-center justify-center"}>
            <Monicon name={"fa6-solid:pen"} size={18} color={colorValue("--color-typography-700")} />
          </View>
          <ActionsheetItemText>修改信息</ActionsheetItemText>
        </ActionsheetItem>
        {showEditCover && (displayTrack?.amount ?? 0) > 0 ? (
          <ActionsheetItem onPress={() => onAction("editCover")}>
            <View className={"size-6 items-center justify-center"}>
              <Monicon name={"fa6-solid:images"} size={18} color={colorValue("--color-typography-700")} />
            </View>
            <ActionsheetItemText>修改封面</ActionsheetItemText>
          </ActionsheetItem>
        ) : null}
        <ActionsheetItem onPress={() => onAction("delete")}>
          <View className={"size-6 items-center justify-center"}>
            <Monicon name={"fa6-solid:trash"} size={18} color={colorValue("--color-typography-700")} />
          </View>
          <ActionsheetItemText>删除</ActionsheetItemText>
        </ActionsheetItem>
        <ActionsheetItem
          onPress={() => {
            onAction("export");
          }}
        >
          <View className={"size-6 items-center justify-center"}>
            <Monicon name={"fa6-solid:file-export"} size={18} color={colorValue("--color-typography-700")} />
          </View>
          <ActionsheetItemText>导出</ActionsheetItemText>
        </ActionsheetItem>
        <ActionsheetItem onPress={() => onAction("close")}>
          <View className={"size-6 items-center justify-center"}>
            <Monicon name={"fa6-solid:xmark"} size={20} color={colorValue("--color-typography-700")} />
          </View>
          <ActionsheetItemText>取消</ActionsheetItemText>
        </ActionsheetItem>
      </ActionsheetContent>
    </Actionsheet>
  );
}
```

## 重构后

重构后，我们使用了 `ActionMenu` 组件和 `ActionMenuItem` 接口来统一菜单项的定义和渲染：

```tsx
function LongPressActions({ showActionSheet, displayTrack, onAction, onClose }: LongPressActionsProps) {
  const { colorValue } = useRawThemeValues();
  const showEditCover = !displayTrack?.source;

  const menuItems: ActionMenuItem[] = [
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:pen",
      iconSize: 18,
      text: "修改信息",
      action: () => onAction("edit"),
    },
    {
      show: showEditCover && (displayTrack?.amount ?? 0) > 0,
      disabled: false,
      icon: "fa6-solid:images",
      iconSize: 18,
      text: "修改封面",
      action: () => onAction("editCover"),
    },
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:trash",
      iconSize: 18,
      text: "删除",
      action: () => onAction("delete"),
    },
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:file-export",
      iconSize: 18,
      text: "导出",
      action: () => onAction("export"),
    },
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:xmark",
      iconSize: 20,
      text: "取消",
      action: () => onAction("close"),
    },
  ];

  return (
    <Actionsheet isOpen={showActionSheet} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="z-50">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        {!!displayTrack && (
          <ActionSheetCurrent
            line1={displayTrack.title}
            line2={`${displayTrack.amount} 首歌曲`}
            image={getImageProxyUrl(displayTrack.imgUrl!)}
          />
        )}
        <ActionMenu menuItems={menuItems} />
      </ActionsheetContent>
    </Actionsheet>
  );
}
```

## 重构步骤

1. 添加 `ActionMenu` 和 `ActionMenuItem` 组件的导入：

   ```tsx
   import { ActionMenu, ActionMenuItem } from "~/components/action-menu";
   ```

2. 创建 `menuItems` 数组，定义所有菜单项：
   - 每个菜单项都包含 `show`、`disabled`、`icon`、`iconSize`、`text` 和 `action` 属性
   - 对于条件渲染的菜单项（如"修改封面"），使用 `show` 属性控制显示逻辑

3. 替换多个 `ActionsheetItem` 组件为单个 `ActionMenu` 组件：
   ```tsx
   <ActionMenu menuItems={menuItems} />
   ```

## 优势

1. **代码一致性**：与 `player-control-menu.tsx` 中的菜单实现保持一致
2. **可维护性**：菜单项定义集中在一个数组中，便于添加、修改和删除
3. **响应式布局**：`ActionMenu` 组件内部处理了不同屏幕尺寸下的布局逻辑
4. **代码简洁**：减少了重复的 JSX 结构，使组件更加简洁
5. **类型安全**：使用 `ActionMenuItem` 接口确保菜单项结构的一致性

## 注意事项

- 确保 `ActionMenu` 组件的导入路径正确（`~/components/action-menu`）
- 保持菜单项的 `show` 属性逻辑与原有条件渲染逻辑一致
- 对于有特殊条件的菜单项，在 `menuItems` 数组中使用适当的条件表达式
