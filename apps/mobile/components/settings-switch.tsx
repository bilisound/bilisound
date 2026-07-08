import { useEffect, useRef } from "react";
import { useRawThemeValues } from "./ui/gluestack-ui-provider/theme";
import { Animated, Easing, StyleSheet } from "react-native";
import { shadow } from "~/constants/styles";

export function SettingSwitch({ value }: { value: boolean }) {
  const { colorValue, mode } = useRawThemeValues();
  const dark = mode === "dark";
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      colorValue(dark ? "--color-primary-50" : "--color-primary-200"),
      colorValue(dark ? "--color-primary-400" : "--color-primary-500"),
    ],
  });
  const thumbTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });
  const thumbColor = colorValue(dark ? "--color-primary-700" : "--color-primary-50");

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 150,
      easing: Easing.cubic,
      useNativeDriver: false,
    }).start();
  }, [progress, value]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.settingSwitchTrack, { backgroundColor: trackColor }]}
    >
      <Animated.View
        style={[
          styles.settingSwitchThumb,
          { backgroundColor: thumbColor, transform: [{ translateX: thumbTranslateX }] },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  settingSwitchTrack: {
    width: 46,
    height: 28,
    borderRadius: 9999,
    padding: 3,
    justifyContent: "center",
  },
  settingSwitchThumb: {
    width: 22,
    height: 22,
    borderRadius: 9999,
    boxShadow: shadow.md,
  },
});
