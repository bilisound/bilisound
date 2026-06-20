import { Ref, useState } from "react";
import { StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from "react-native";

import { useUiNextColors } from "~/components/ui-next/theme/colors";

type TextareaFieldSize = "sm" | "md" | "lg" | "xl";

export interface TextareaFieldProps extends Omit<TextInputProps, "style" | "editable" | "multiline"> {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  invalid?: boolean;
  ref?: Ref<TextInput>;
  size?: TextareaFieldSize;
}

const inputSizeStyles = StyleSheet.create({
  sm: {
    fontSize: 14,
    lineHeight: 20,
  },
  md: {
    fontSize: 16,
    lineHeight: 24,
  },
  lg: {
    fontSize: 18,
    lineHeight: 28,
  },
  xl: {
    fontSize: 20,
    lineHeight: 28,
  },
});

export function TextareaField({
  containerStyle,
  inputStyle,
  disabled = false,
  invalid = false,
  ref,
  size = "md",
  onBlur,
  onFocus,
  placeholderTextColor,
  textAlignVertical = "top",
  ...props
}: TextareaFieldProps) {
  const [focused, setFocused] = useState(false);
  const { colorValue } = useUiNextColors();
  const borderColor = invalid
    ? colorValue("--color-error-700")
    : focused
      ? colorValue("--color-primary-700")
      : colorValue("--color-background-300");

  return (
    <View
      style={[
        styles.container,
        {
          borderColor,
          backgroundColor: disabled ? colorValue("--color-background-50") : "transparent",
          opacity: disabled ? 0.4 : 1,
        },
        containerStyle,
      ]}
    >
      <TextInput
        ref={ref}
        editable={!disabled}
        multiline
        placeholderTextColor={placeholderTextColor ?? colorValue("--color-typography-500")}
        selectionColor={colorValue("--color-primary-500")}
        textAlignVertical={textAlignVertical}
        {...props}
        onBlur={event => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={event => {
          setFocused(true);
          onFocus?.(event);
        }}
        style={[
          styles.input,
          inputSizeStyles[size],
          {
            color: disabled ? colorValue("--color-typography-400") : colorValue("--color-typography-900"),
          },
          inputStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 100,
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    padding: 8,
  },
});
