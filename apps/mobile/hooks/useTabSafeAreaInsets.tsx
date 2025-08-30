import { createContext, forwardRef, useContext } from "react";
import { EdgeInsets } from "react-native-safe-area-context";
import { View, ViewProps, ViewStyle } from "react-native";

export const TabSafeAreaContext = createContext<EdgeInsets>({ bottom: 0, left: 0, right: 0, top: 0 });

export function useTabSafeAreaInsets(styleValue: true): ViewStyle;
export function useTabSafeAreaInsets(styleValue?: false): EdgeInsets;
export function useTabSafeAreaInsets(styleValue = false) {
  const edgeInsets = useContext(TabSafeAreaContext);
  if (styleValue) {
    return {
      paddingLeft: edgeInsets.left,
      paddingRight: edgeInsets.right,
      paddingTop: edgeInsets.top,
      paddingBottom: edgeInsets.bottom,
    };
  }
  return edgeInsets;
}

export const TabSafeAreaView = forwardRef<View, ViewProps>(({ children, style, ...props }, ref) => {
  const safeAreaStyle = useTabSafeAreaInsets(true);
  return (
    <View ref={ref} style={[safeAreaStyle, style]} {...props}>
      {children}
    </View>
  );
});

TabSafeAreaView.displayName = "TabSafeAreaView";
