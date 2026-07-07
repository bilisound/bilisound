import React, { useEffect } from "react";
import { getParsedBuiltInConfig } from "./config";
import { StyleProp, View, ViewStyle } from "react-native";
import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import useSettingsStore from "~/store/settings";
import { ThemeValueProvider } from "~/components/ui/gluestack-ui-provider/theme";
import {
  createRuntimeVars,
  findUserTheme,
  getUserThemeId,
  resolveThemeConfig,
  useThemeRegistry,
} from "~/features/theme/registry";

type GluestackUIProviderProps = {
  mode?: "light" | "dark";
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GluestackUIProvider({ mode = "light", ...props }: GluestackUIProviderProps) {
  const theme = useSettingsStore(state => state.theme);
  const { themes, loaded, loadThemes } = useThemeRegistry();

  useEffect(() => {
    if (!loaded) {
      loadThemes();
    }
  }, [loadThemes, loaded]);

  const userThemeId = getUserThemeId(theme);
  const userTheme = findUserTheme(themes, theme);
  const themeConfig = resolveThemeConfig(theme, mode, userTheme);
  const runtimeVars = createRuntimeVars(themeConfig);
  const builtInParsedConfig = getParsedBuiltInConfig(
    userThemeId ? "classic" : theme === "red" ? "red" : "classic",
    mode,
  );

  return (
    <ThemeValueProvider.Provider
      value={{
        theme: themeConfig,
        mode,
      }}
    >
      <View style={[builtInParsedConfig, runtimeVars, { flex: 1, height: "100%", width: "100%" }, props.style]}>
        <OverlayProvider>{props.children}</OverlayProvider>
      </View>
    </ThemeValueProvider.Provider>
  );
}
