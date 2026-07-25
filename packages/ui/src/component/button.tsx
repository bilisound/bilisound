import type { ReactNode, Ref } from "react";
import type { View } from "react-native";
import type { ButtonProps as TamaguiButtonProps } from "@tamagui/button";

import { ButtonFrame, ButtonLabel, buttonIconSize, useButtonIconColor } from "../recipe";
import { Icon } from "./icon";
import type { IconName } from "./icon";

export type ButtonIconPosition = "start" | "end";
export type ButtonShape = "default" | "rounded";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ControlSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<
  TamaguiButtonProps,
  "children" | "icon" | "iconAfter" | "ref" | "shape" | "size" | "unstyled" | "variant"
> {
  children?: ReactNode;
  icon?: IconName;
  iconPosition?: ButtonIconPosition;
  ref?: Ref<View>;
  shape?: ButtonShape;
  size?: ControlSize;
  variant?: ButtonVariant;
}

export function Button({
  "aria-label": ariaLabel,
  accessibilityLabel,
  children,
  disabled,
  icon,
  iconPosition = "start",
  ref,
  shape = "default",
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  const isIconOnly = children == null;
  const isLink = variant === "link";
  const iconColor = useButtonIconColor(variant);
  const buttonIcon = icon ? <Icon aria-hidden color={iconColor} name={icon} size={buttonIconSize[size]} /> : null;

  return (
    <ButtonFrame
      ref={ref}
      unstyled
      tone={variant}
      aria-label={ariaLabel ?? accessibilityLabel}
      accessibilityLabel={accessibilityLabel ?? ariaLabel}
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
        <ButtonLabel unstyled tone={variant} controlSize={isLink ? "md" : size}>
          {children}
        </ButtonLabel>
      )}
      {iconPosition === "end" && buttonIcon}
    </ButtonFrame>
  );
}
