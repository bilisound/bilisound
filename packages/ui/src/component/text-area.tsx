import type { ComponentProps, CSSProperties, Ref } from "react";
import type { TextInput as ReactNativeTextInput } from "react-native";
import { isWeb, useTheme } from "@tamagui/core";
import type { TamaguiElement } from "@tamagui/core";
import type { InputProps as TamaguiInputProps } from "@tamagui/input";

import { TextAreaFrame } from "../recipe";
import type { ControlSize } from "./button";

export interface TextAreaProps extends Omit<TamaguiInputProps, "ref" | "size" | "unstyled" | "multiline"> {
  invalid?: boolean;
  ref?: Ref<ReactNativeTextInput>;
  rows?: number;
  size?: ControlSize;
}

type TextAreaFrameStyle = ComponentProps<typeof TextAreaFrame>["style"];

export function TextArea({ disabled, invalid = false, ref, rows = 3, size = "md", style, ...props }: TextAreaProps) {
  const theme = useTheme();
  const inputProps = props as ComponentProps<typeof TextAreaFrame>;
  // Tamagui types styled refs as the over-wide `TamaguiElement`, while the node behind an
  // Input is the platform text input: RN's TextInput on native and an HTMLInputElement with
  // the Tamagui element methods on web (Tamagui's own `InputRef`). The prop keeps the RN
  // surface, so bind it to the frame slot explicitly instead of widening the public API.
  const frameRef = ref as Ref<TamaguiElement> | undefined;
  const mergedStyle = (
    isWeb ? ({ ...(style as CSSProperties | undefined), resize: "none" } satisfies CSSProperties) : style
  ) as TextAreaFrameStyle;

  return (
    <TextAreaFrame
      {...inputProps}
      ref={frameRef}
      unstyled
      // A resolved value makes Tamagui's native Input update when the provider theme changes.
      backgroundColor={theme.surface.get()}
      multiline
      numberOfLines={rows}
      fieldSize={size}
      validation={invalid ? "invalid" : undefined}
      visuallyDisabled={disabled}
      disabled={disabled}
      placeholderTextColor="$placeholder"
      selectionColor="$selection"
      aria-invalid={invalid || undefined}
      style={mergedStyle}
    />
  );
}
