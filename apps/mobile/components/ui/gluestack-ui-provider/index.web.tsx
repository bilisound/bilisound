"use client";
import { setFlushStyles } from "@gluestack-ui/utils/nativewind-utils";
import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import React, { useEffect } from "react";

import { ThemeValueProvider } from "./theme";

import { findUserTheme, resolveThemeConfig, useThemeRegistry } from "~/features/theme/registry";
import useSettingsStore from "~/store/settings";

export function GluestackUIProvider({ mode = "light", ...props }: { mode?: "light" | "dark"; children?: any }) {
  const theme = useSettingsStore(state => state.theme);
  const { themes, loaded, loadThemes } = useThemeRegistry();

  useEffect(() => {
    if (!loaded) {
      loadThemes();
    }
  }, [loadThemes, loaded]);

  const userTheme = findUserTheme(themes, theme);
  const themeConfig = resolveThemeConfig(theme, mode, userTheme);
  const stringcssvars = Object.keys(themeConfig).reduce((acc, cur) => {
    acc += `${cur}:${themeConfig[cur as keyof typeof themeConfig]};`;
    return acc;
  }, "");

  useEffect(() => {
    const styles = `:root {${stringcssvars}} `;
    setFlushStyles(styles);

    if (typeof document !== "undefined") {
      const element = document.documentElement;
      if (element) {
        const head = element.querySelector("head");
        let style = document.getElementById("nativewind-style") as HTMLStyleElement | null;
        if (!style) {
          style = document.createElement("style");
          style.id = "nativewind-style";
        }
        style.innerHTML = styles;
        if (head) head.appendChild(style);
      }
    }
  }, [stringcssvars]);

  return (
    <ThemeValueProvider.Provider
      value={{
        theme: themeConfig,
        mode,
      }}
    >
      <OverlayProvider>{props.children}</OverlayProvider>
    </ThemeValueProvider.Provider>
  );
}
