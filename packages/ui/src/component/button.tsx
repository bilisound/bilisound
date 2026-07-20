import type { ReactNode, Ref } from "react";
import type { View } from "react-native";
import type { ButtonProps as TamaguiButtonProps } from "@tamagui/button";

import { ButtonFrame, ButtonLabel } from "../recipe";

export type ButtonVariant = "primary" | "secondary";
export type ControlSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<TamaguiButtonProps, "children" | "ref" | "size" | "unstyled" | "variant"> {
  children: ReactNode;
  ref?: Ref<View>;
  size?: ControlSize;
  variant?: ButtonVariant;
}

export function Button({ children, disabled, ref, size = "md", variant = "primary", ...props }: ButtonProps) {
  return (
    <ButtonFrame
      ref={ref}
      unstyled
      tone={variant}
      controlSize={size}
      visuallyDisabled={disabled}
      disabled={disabled}
      {...props}
    >
      <ButtonLabel unstyled tone={variant} controlSize={size}>
        {children}
      </ButtonLabel>
    </ButtonFrame>
  );
}
