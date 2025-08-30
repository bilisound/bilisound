import React from "react";
import { config, ConfigName, parsedConfig } from "./config";
import { View } from "react-native";
import { OverlayProvider } from "@gluestack-ui/overlay";
import useSettingsStore from "~/store/settings";
import { ThemeValueProvider } from "~/components/ui/gluestack-ui-provider/theme";

export function GluestackUIProvider({ mode = "light", ...props }: { mode?: "light" | "dark"; children?: any }) {
  const { theme } = useSettingsStore(state => ({
    theme: state.theme,
  }));

  return (
    <ThemeValueProvider.Provider
      value={{
        theme: config[(theme + "_" + mode) as ConfigName],
        mode,
      }}
    >
      <View
        style={[
          parsedConfig[theme + "_" + mode],
          { flex: 1, height: "100%", width: "100%" },
          // @ts-ignore
          props.style,
        ]}
      >
        <OverlayProvider>{props.children}</OverlayProvider>
      </View>
    </ThemeValueProvider.Provider>
  );
}
