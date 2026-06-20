import { ReactNode, Ref, useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { useUiNextColors } from "~/components/ui-next/theme/colors";

type TextFieldSize = "sm" | "md" | "lg" | "xl";

export interface TextFieldProps extends Omit<TextInputProps, "style" | "editable"> {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  left?: ReactNode;
  right?: ReactNode;
  disabled?: boolean;
  invalid?: boolean;
  ref?: Ref<TextInput>;
  size?: TextFieldSize;
}

export interface TextFieldActionProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
  children?: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  textColor?: string;
}

const sizeStyles = StyleSheet.create({
  sm: {
    minHeight: 36,
  },
  md: {
    minHeight: 40,
  },
  lg: {
    minHeight: 44,
  },
  xl: {
    minHeight: 48,
  },
});

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

export function TextField({
  containerStyle,
  inputStyle,
  left,
  right,
  disabled = false,
  invalid = false,
  ref,
  size = "md",
  onBlur,
  onFocus,
  placeholderTextColor,
  ...props
}: TextFieldProps) {
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
        sizeStyles[size],
        {
          borderColor,
          backgroundColor: disabled ? colorValue("--color-background-50") : "transparent",
          opacity: disabled ? 0.4 : 1,
        },
        containerStyle,
      ]}
    >
      {left ? <View style={styles.leftSlot}>{left}</View> : null}
      <TextInput
        ref={ref}
        editable={!disabled}
        placeholderTextColor={placeholderTextColor ?? colorValue("--color-typography-500")}
        selectionColor={colorValue("--color-primary-500")}
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
      {right ? <View style={styles.rightSlot}>{right}</View> : null}
    </View>
  );
}

export function TextFieldAction({
  accessibilityLabel,
  accessibilityHint,
  children,
  disabled,
  onPress,
  textColor,
}: TextFieldActionProps) {
  const { colorValue } = useUiNextColors();

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        pressed && !disabled ? { backgroundColor: colorValue("--color-background-100") } : null,
        disabled ? styles.disabledAction : null,
      ]}
    >
      {typeof children === "string" ? (
        <Text style={[styles.actionText, { color: textColor ?? colorValue("--color-primary-500") }]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  leftSlot: {
    flexShrink: 0,
    paddingLeft: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSlot: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  action: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledAction: {
    opacity: 0.4,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
});
