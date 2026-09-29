import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaFrame } from "react-native-safe-area-context";

// 不直接使用 useWindowDimensions 的原因：https://github.com/facebook/react-native/issues/41918
export function useWindowSize(): { width: number; height: number } {
  const windowWeb = useWindowDimensions();
  const windowNative = useSafeAreaFrame();

  // 不在 Web 使用 useSafeAreaFrame 的原因：https://github.com/AppAndFlow/react-native-safe-area-context/issues/184
  if (Platform.OS === "web") {
    return windowWeb;
  }
  return windowNative;
}
