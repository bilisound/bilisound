import type { ComponentProps, Ref } from "react";
import type { TextInput as ReactNativeTextInput } from "react-native";
import { useTheme } from "@tamagui/core";
import type { InputProps as TamaguiInputProps } from "@tamagui/input";

import { TextInputFrame } from "../recipe";
import type { ControlSize } from "./button";

export interface TextInputProps extends Omit<TamaguiInputProps, "ref" | "size" | "unstyled"> {
  invalid?: boolean;
  ref?: Ref<ReactNativeTextInput>;
  size?: ControlSize;
}

export function TextInput({ disabled, invalid = false, ref, size = "md", ...props }: TextInputProps) {
  const theme = useTheme();
  const inputProps = props as ComponentProps<typeof TextInputFrame>;

  return (
    <TextInputFrame
      {...inputProps}
      ref={ref}
      unstyled
      // A resolved value makes Tamagui's native Input update when the provider theme changes.
      backgroundColor={theme.surface.get()}
      fieldSize={size}
      validation={invalid ? "invalid" : undefined}
      visuallyDisabled={disabled}
      disabled={disabled}
      placeholderTextColor="$placeholder"
      selectionColor="$selection"
      aria-invalid={invalid || undefined}
    />
  );
}
