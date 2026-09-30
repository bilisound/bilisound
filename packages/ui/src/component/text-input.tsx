import type { ComponentProps, Ref } from "react";
import type { TextInput as ReactNativeTextInput } from "react-native";
import { useTheme } from "@tamagui/core";
import type { TamaguiElement } from "@tamagui/core";
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
  // Tamagui types styled refs as the over-wide `TamaguiElement`, while the node behind an
  // Input is the platform text input: RN's TextInput on native and an HTMLInputElement with
  // the Tamagui element methods on web (Tamagui's own `InputRef`). The prop keeps the RN
  // surface, so bind it to the frame slot explicitly instead of widening the public API.
  const frameRef = ref as Ref<TamaguiElement> | undefined;

  return (
    <TextInputFrame
      {...inputProps}
      ref={frameRef}
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
