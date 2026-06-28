import type { CSSProperties } from "react";
import { StyleSheet } from "react-native";
import type { StyleProp, TextStyle } from "react-native";

export function normalizeWebTextStyle(style: CSSProperties | StyleProp<TextStyle> | undefined): CSSProperties | undefined {
  const flattened = StyleSheet.flatten(style as StyleProp<TextStyle>);

  if (!flattened) {
    return flattened;
  }

  if (typeof flattened.lineHeight !== "number") {
    return flattened as CSSProperties;
  }

  return {
    ...(flattened as CSSProperties),
    lineHeight: `${flattened.lineHeight}px`,
  };
}
