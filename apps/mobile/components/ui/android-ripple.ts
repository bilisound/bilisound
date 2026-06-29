import type { PressableProps } from "react-native";

import type { ConfigDetail } from "~/components/ui/gluestack-ui-provider/config";
import { IS_ANDROID_RIPPLE_ENABLED } from "~/constants/platform";

type ColorValue = (color: keyof ConfigDetail, opacity?: number) => string;
type ButtonAction = "primary" | "secondary" | "positive" | "negative" | "default";
type ButtonVariant = "solid" | "outline" | "ghost" | "link";

const defaultRippleColor = "--color-background-100" satisfies keyof ConfigDetail;

const solidRippleColors = {
  primary: "--color-primary-700",
  secondary: "--color-secondary-700",
  positive: "--color-success-700",
  negative: "--color-error-700",
  default: defaultRippleColor,
} satisfies Record<ButtonAction, keyof ConfigDetail>;

const surfaceRippleColors = {
  primary: "--color-primary-100",
  secondary: "--color-secondary-100",
  positive: "--color-success-100",
  negative: "--color-error-100",
  default: defaultRippleColor,
} satisfies Record<ButtonAction, keyof ConfigDetail>;

export function createAndroidRipple(
  colorValue: ColorValue,
  color: keyof ConfigDetail = defaultRippleColor,
): PressableProps["android_ripple"] | undefined {
  if (!IS_ANDROID_RIPPLE_ENABLED) {
    return undefined;
  }

  return { color: colorValue(color) };
}

export function getButtonAndroidRippleColor(variant: ButtonVariant, action: ButtonAction): keyof ConfigDetail {
  if (variant === "solid") {
    return solidRippleColors[action];
  }

  if (variant === "outline" || variant === "ghost") {
    return surfaceRippleColors[action];
  }

  return defaultRippleColor;
}
