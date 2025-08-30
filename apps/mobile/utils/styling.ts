import { Platform } from "react-native";

export function rem2px(value: number) {
  // > React Native's <Text /> renders with a fontSize: 14, while the web's default is 16px.
  // > For consistency, NativeWind uses an rem value of 16 on web and 14 on native.
  if (Platform.OS === "web") {
    return value * 16;
  }
  return value * 14;
}
