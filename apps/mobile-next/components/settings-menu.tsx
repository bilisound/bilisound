import type { ReactNode } from "react";
import { ActivityIndicator } from "react-native";
import type { AccessibilityState } from "react-native";
import { isWeb, useTheme } from "@tamagui/core";

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
  /**
   * RN-named props kept for callers. Only `accessibilityState.checked` (switch
   * rows) and `disabled` are consumed; they are rendered as cross-platform
   * `role`/`aria-*` so Tamagui web keeps them instead of leaking unknown props
   * into the DOM. Other `AccessibilityState` fields have no valid equivalent on
   * both platforms here (an `aria-selected` on a button/switch role is invalid).
   */
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "switch";
  accessibilityState?: AccessibilityState;
}

type ActivationEvent = {
  currentTarget?: unknown;
  key?: string;
  preventDefault?: () => void;
  target?: unknown;
};

type EventNode = {
  matches?: (selector: string) => boolean;
  parentElement?: EventNode | null;
};

/** Nested interactive elements (trailing action buttons) own their own events. */
const NESTED_CONTROL_SELECTOR =
  'button, a[href], input, select, textarea, [role="button"], [role="link"], [role="switch"], [role="checkbox"]';

/**
 * Web-only: true when the event came from a nested control instead of the row.
 * Tamagui maps `onPress` to `onClick`, so without this guard a click on the
 * trailing action button would also run the row's own action.
 */
function isNestedControlEvent(event?: ActivationEvent) {
  if (!isWeb || !event || !event.target || event.target === event.currentTarget) {
    return false;
  }

  let node = event.target as EventNode | null;
  const row = event.currentTarget as EventNode;
  while (node && node !== row) {
    if (typeof node.matches === "function" && node.matches(NESTED_CONTROL_SELECTOR)) {
      return true;
    }
    node = node.parentElement ?? null;
  }
  return false;
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
  const isSwitch = accessibilityRole === "switch";
  const checked = isSwitch ? Boolean(accessibilityState?.checked) : undefined;
  const label =
    accessibilityLabel ?? [title, typeof description === "string" ? description : undefined].filter(Boolean).join("，");

  const handlePress = (event?: ActivationEvent) => {
    if (isNestedControlEvent(event)) {
      return;
    }
    onPress?.();
  };

  const handleKeyDown = (event: ActivationEvent) => {
    // Key events bubble out of a focused nested control; only the row's own
    // keyboard focus activates it. (Tamagui drops onKeyDown on native.)
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault?.();
    onPress?.();
  };

  return (
    <HStack
      alignItems="center"
      gap="$3"
      opacity={disabled ? 0.6 : 1}
      paddingHorizontal="$4"
      paddingVertical="$3"
      pressStyle={interactive ? { opacity: 0.6 } : undefined}
      role={accessibilityRole}
      aria-label={label}
      // `aria-checked` is only valid on switch rows; a dangling value on button
      // rows would misreport selection state to screen readers.
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={interactive ? handleKeyDown : undefined}
      onPress={interactive ? handlePress : undefined}
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
