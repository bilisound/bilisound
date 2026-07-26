import type { ComponentProps, CSSProperties, Ref } from "react";
import type { StyleProp, TextInput as ReactNativeTextInput, TextStyle } from "react-native";
import { isWeb } from "@tamagui/core";
import type { InputProps as TamaguiInputProps } from "@tamagui/input";

import { TextAreaFrame } from "../recipe";
import type { ControlSize } from "./button";

export interface TextAreaProps extends Omit<TamaguiInputProps, "ref" | "size" | "unstyled" | "multiline"> {
  invalid?: boolean;
  ref?: Ref<ReactNativeTextInput>;
  rows?: number;
  size?: ControlSize;
}

export function TextArea({ disabled, invalid = false, ref, rows = 3, size = "md", style, ...props }: TextAreaProps) {
  const inputProps = props as ComponentProps<typeof TextAreaFrame>;
  const mergedStyle = (
    isWeb ? ({ ...(style as CSSProperties | undefined), resize: "none" } satisfies CSSProperties) : style
  ) as StyleProp<TextStyle>;

  return (
    <TextAreaFrame
      {...inputProps}
      ref={ref}
      unstyled
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
