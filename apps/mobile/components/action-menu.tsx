import { ActionsheetItem, ActionsheetItemText } from "~/components/ui/actionsheet";
import { Platform, View } from "react-native";
import { Monicon } from "@monicon/native";
import React from "react";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { useWindowSize } from "~/hooks/useWindowSize";
import { breakpoints } from "~/constants/styles";

export interface ActionMenuItem {
  show?: boolean;
  disabled?: boolean;
  icon: string;
  iconSize?: number;
  text: string;
  action: () => void;
}

export interface ActionSheetProps {
  menuItems: ActionMenuItem[];
}

export function ActionMenu({ menuItems }: ActionSheetProps) {
  const { colorValue } = useRawThemeValues();
  const { width } = useWindowSize();

  const elArray = menuItems
    .filter(e => e.show)
    .map((item, index) => (
      <ActionsheetItem key={index} onPress={item.action} isDisabled={item.disabled}>
        <View className={"size-6 items-center justify-center"}>
          <Monicon name={item.icon} size={item.iconSize ?? 18} color={colorValue("--color-typography-700")} />
        </View>
        <ActionsheetItemText>{item.text}</ActionsheetItemText>
      </ActionsheetItem>
    ));

  // Web 可以直接用 CSS Grid 实现网格布局，但是 Native 目前还需要用 flex 模拟
  if (Platform.OS === "web") {
    return <View className={"w-full grid grid-cols-1 sm:grid-cols-2"}>{elArray}</View>;
  }

  if (width >= breakpoints.sm) {
    // Group elArray into 2 columns
    const groupedArray = [];
    for (let i = 0; i < elArray.length; i += 2) {
      groupedArray.push(elArray.slice(i, i + 2));
    }

    return (
      <View className="w-full">
        {groupedArray.map((group, index) => (
          <View key={index} className="flex-row">
            {group.map((el, subIndex) => (
              <View key={subIndex} className="flex-1">
                {el}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  return <View className={"w-full"}>{elArray}</View>;
}
