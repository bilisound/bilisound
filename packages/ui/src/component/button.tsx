import type { ReactNode, Ref } from "react";
import type { View } from "react-native";
import type { ButtonProps as TamaguiButtonProps } from "@tamagui/button";
import { isWeb } from "@tamagui/core";

import {
  ButtonFrame,
  ButtonLabel,
  buttonIconSize,
  getButtonColorScheme,
  getButtonFrameStyles,
  getButtonLabelStyles,
  useButtonIconColor,
} from "../recipe";
import type { ButtonColor, ButtonVariant } from "../recipe";
import { Icon } from "./icon";
import type { IconName } from "./icon";

export type { ButtonColor, ButtonVariant } from "../recipe";

export type ButtonIconPosition = "start" | "end";
export type ButtonShape = "default" | "rounded";
export type ControlSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<
  TamaguiButtonProps,
  "children" | "color" | "icon" | "iconAfter" | "ref" | "shape" | "size" | "unstyled" | "variant"
> {
  children?: ReactNode;
  color?: ButtonColor;
  icon?: IconName;
  iconPosition?: ButtonIconPosition;
  numberOfLines?: number;
  ref?: Ref<View>;
  shape?: ButtonShape;
  size?: ControlSize;
  variant?: ButtonVariant;
}

export function Button({
  "aria-label": ariaLabel,
  accessibilityLabel,
  accessibilityState,
  children,
  color = "primary",
  disabled,
  icon,
  iconPosition = "start",
  numberOfLines,
  ref,
  shape = "default",
  size = "md",
  variant = "solid",
  ...props
}: ButtonProps) {
  const isIconOnly = children == null;
  const resolvedAccessibilityLabel = ariaLabel ?? accessibilityLabel;
  const isLink = variant === "link";
  const scheme = getButtonColorScheme(color);
  const frameStyles = getButtonFrameStyles(variant, scheme);
  const labelStyles = getButtonLabelStyles(variant, scheme);
  const iconColor = useButtonIconColor(color, variant);
  const buttonIcon = icon ? <Icon aria-hidden color={iconColor} name={icon} size={buttonIconSize[size]} /> : null;

  return (
    <ButtonFrame
      ref={ref}
      unstyled
      {...frameStyles}
      {...(isWeb
        ? { "aria-label": resolvedAccessibilityLabel, accessibilityState }
        : {
            accessibilityLabel: resolvedAccessibilityLabel,
            // The native view keeps its "disabled" state until an update carries the key
            // again (RN Android BaseViewManager.setViewState only resets View.isEnabled when
            // accessibilityState has a "disabled" boolean), while Tamagui's disabled variant
            // only emits aria-disabled when true. So send the resolved boolean every render,
            // which also covers true -> undefined (prop removed).
            accessibilityState: { ...accessibilityState, disabled: disabled === true },
          })}
      controlSize={isLink && !isIconOnly ? undefined : size}
      hasIconAndLabel={Boolean(icon && !isIconOnly)}
      iconOnly={isIconOnly}
      shape={shape}
      visuallyDisabled={disabled}
      disabled={disabled}
      {...props}
    >
      {iconPosition === "start" && buttonIcon}
      {!isIconOnly && (
        <ButtonLabel
          unstyled
          {...labelStyles}
          controlSize={isLink ? "md" : size}
          numberOfLines={numberOfLines}
          flexShrink={1}
          minWidth={0}
        >
          {children}
        </ButtonLabel>
      )}
      {iconPosition === "end" && buttonIcon}
    </ButtonFrame>
  );
}
