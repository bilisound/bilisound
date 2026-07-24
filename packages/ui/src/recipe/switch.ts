import { getVariableValue, styled, useTheme, View } from "@tamagui/core";
import { StyleSheet } from "react-native";

export const SwitchControl = styled(View, {
  name: "BilisoundSwitchControl",
  width: 46,
  height: 28,
  flexShrink: 0,
  borderWidth: 0,
  borderRadius: "$full",
  backgroundColor: "transparent",
  cursor: "pointer",
  focusVisibleStyle: {
    outlineColor: "$focusRing",
    outlineStyle: "solid",
    outlineWidth: 2,
    outlineOffset: 2,
  },
  variants: {
    visuallyDisabled: {
      true: {
        cursor: "not-allowed",
      },
    },
  } as const,
});

export function useSwitchColors() {
  const theme = useTheme();
  return {
    track: String(getVariableValue(theme.switchTrack)),
    trackChecked: String(getVariableValue(theme.switchTrackChecked)),
    thumb: String(getVariableValue(theme.switchThumb)),
  };
}

export const switchStyles = StyleSheet.create({
  track: {
    width: 46,
    height: 28,
    flexShrink: 0,
    justifyContent: "center",
    padding: 3,
    overflow: "hidden",
    borderRadius: 9999,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 9999,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  },
  disabled: {
    opacity: 0.45,
  },
});

export const switchAnimationDuration = 150;
export const switchThumbTravel = 18;
