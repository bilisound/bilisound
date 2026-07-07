import React from "react";
import { ActivityIndicator, GestureResponderEvent, StyleSheet, View } from "react-native";
import type { AccessibilityRole, AccessibilityState } from "react-native";

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
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
}

export function SettingMenuItem({
  title,
  subTitle,
  icon,
  iconSize,
  rightAccessories,
  onPress,
  onLongPress,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
}: SettingMenuItemProps) {
  const { colorValue } = useRawThemeValues();
  const itemLabel =
    accessibilityLabel ?? [title, typeof subTitle === "string" ? subTitle : undefined].filter(Boolean).join("，");
  const itemRole = accessibilityRole ?? (onPress ? "button" : undefined);
  const itemState = disabled ? { ...accessibilityState, disabled: true } : accessibilityState;

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
    return (
      <View
        accessible={Boolean(itemLabel || itemRole)}
        accessibilityHint={accessibilityHint}
        accessibilityLabel={itemLabel || undefined}
        accessibilityRole={itemRole}
        accessibilityState={itemState}
      >
        {inner}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={itemLabel || undefined}
      accessibilityRole={itemRole}
      accessibilityState={itemState}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {inner}
    </Pressable>
  );
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
