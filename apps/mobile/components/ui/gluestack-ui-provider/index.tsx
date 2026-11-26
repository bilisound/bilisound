import React, { useEffect, useMemo } from "react";
import { toCssVariables } from "./config";
import { StyleProp, View, ViewStyle } from "react-native";
import { VariableContextProvider } from "nativewind";
import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import { ThemeValueProvider } from "~/components/ui/gluestack-ui-provider/theme";
import { useAppearanceConfig } from "~/features/config";
import { findUserTheme, resolveThemeConfig, useThemeRegistry } from "~/features/theme/registry";

type GluestackUIProviderProps = {
  mode?: "light" | "dark";
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GluestackUIProvider({ mode = "light", ...props }: GluestackUIProviderProps) {
  const { theme } = useAppearanceConfig();
  const { themes, loaded, loadThemes } = useThemeRegistry();

  useEffect(() => {
    if (!loaded) {
      loadThemes();
    }
  }, [loadThemes, loaded]);

  const userTheme = findUserTheme(themes, theme);
  const themeConfig = useMemo(() => resolveThemeConfig(theme, mode, userTheme), [theme, mode, userTheme]);
  const cssVariables = useMemo(() => toCssVariables(themeConfig), [themeConfig]);

  return (
    <ThemeValueProvider.Provider
      value={{
        theme: themeConfig,
        mode,
      }}
    >
      <VariableContextProvider value={cssVariables}>
        <View style={[{ flex: 1, height: "100%", width: "100%" }, props.style]}>
          <OverlayProvider>{props.children}</OverlayProvider>
        </View>
      </VariableContextProvider>
    </ThemeValueProvider.Provider>
  );
}
