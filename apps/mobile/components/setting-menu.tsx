import React from "react";
import { ActivityIndicator, GestureResponderEvent, StyleSheet, View } from "react-native";

import { Text } from "~/components/ui/text";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { Pressable } from "~/components/ui/pressable";
import { Icon } from "~/components/icon";

export interface SettingMenuItemProps {
  title: string;
  subTitle?: string | React.ReactNode;
  icon: string;
  iconSize?: number;
  rightAccessories?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

export function SettingMenuItem({
  title,
  subTitle,
  icon,
  iconSize,
  rightAccessories,
  onPress,
  disabled,
}: SettingMenuItemProps) {
  const { colorValue } = useRawThemeValues();

  const inner = (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrapper}>
            {icon === "loading" ? (
              <ActivityIndicator size={iconSize ?? 20} color={colorValue("--color-typography-700")} />
            ) : (
              <Icon name={icon} size={iconSize ?? 20} color={colorValue("--color-typography-700")} />
            )}
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        {(() => {
          if (typeof subTitle === "string") {
            return <Text style={styles.subTitle}>{subTitle}</Text>;
          }
          return subTitle;
        })()}
      </View>
      {rightAccessories ? <View style={styles.rightAccessories}>{rightAccessories}</View> : null}
    </View>
  );

  if (!onPress || disabled) {
    return inner;
  }

  return <Pressable onPress={onPress}>{inner}</Pressable>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "600",
    fontSize: 15,
  },
  subTitle: {
    marginTop: 4,
    marginLeft: 36,
    opacity: 0.6,
    fontSize: 15,
    lineHeight: 22.5,
  },
  rightAccessories: {
    flexGrow: 0,
    flexBasis: "auto",
    flexShrink: 1,
  },
});
