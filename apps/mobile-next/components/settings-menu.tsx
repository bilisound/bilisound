import type { ReactNode } from "react";
import { ActivityIndicator } from "react-native";
import type { AccessibilityState } from "react-native";
import { useTheme } from "@tamagui/core";

import { HStack, Icon, Text, VStack } from "@bilisound/ui";
import type { IconName } from "@bilisound/ui";

export interface SettingsMenuItemProps {
  /** Icon rendered in the leading 24x24 slot. */
  icon: IconName;
  /** Swaps the leading icon for a spinner (e.g. while an update check runs). */
  loading?: boolean;
  title: string;
  /** Plain text renders as the muted subtitle; nodes render as-is. */
  description?: ReactNode;
  /** Trailing accessory, usually `<SwitchVisual checked={...} />` or an icon button. */
  right?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "switch";
  accessibilityState?: AccessibilityState;
}

/**
 * Settings list row ported from the v2 `SettingMenuItem`. The whole row is the
 * interactive element; trailing accessories are presentational so the row keeps
 * a single, large touch target.
 */
export function SettingsMenuItem({
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
  description,
  disabled = false,
  icon,
  loading = false,
  onPress,
  right,
  title,
}: SettingsMenuItemProps) {
  const theme = useTheme();
  const interactive = Boolean(onPress) && !disabled;
  const label =
    accessibilityLabel ?? [title, typeof description === "string" ? description : undefined].filter(Boolean).join("，");

  return (
    <HStack
      alignItems="center"
      focusable={interactive}
      gap="$3"
      opacity={disabled ? 0.6 : 1}
      paddingHorizontal="$4"
      paddingVertical="$3"
      pressStyle={interactive ? { opacity: 0.6 } : undefined}
      role={interactive ? "button" : undefined}
      accessibilityLabel={label}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ ...accessibilityState, disabled }}
      onPress={interactive ? onPress : undefined}
    >
      <VStack alignItems="center" height={24} justifyContent="center" width={24}>
        {loading ? (
          <ActivityIndicator color={theme.textMuted.get()} size={20} />
        ) : (
          <Icon color={theme.textMuted.get()} name={icon} size={20} aria-hidden />
        )}
      </VStack>
      <VStack flex={1} gap="$1" minWidth={0}>
        <Text color="$text" numberOfLines={1} semiBold>
          {title}
        </Text>
        {typeof description === "string" ? (
          <Text color="$textMuted" numberOfLines={3} size="sm">
            {description}
          </Text>
        ) : (
          description
        )}
      </VStack>
      {right ? (
        <HStack alignItems="center" flexShrink={1} gap="$2">
          {right}
        </HStack>
      ) : null}
    </HStack>
  );
}

/** Section caption used between groups of {@link SettingsMenuItem}. */
export function SettingsSectionTitle({ children }: { children: ReactNode }) {
  return (
    <VStack paddingBottom="$2" paddingHorizontal="$4" paddingTop="$6">
      <Text color="$textMuted" semiBold size="sm">
        {children}
      </Text>
    </VStack>
  );
}
