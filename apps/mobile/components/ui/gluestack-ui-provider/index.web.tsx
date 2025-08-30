"use client";
import { setFlushStyles } from "@gluestack-ui/nativewind-utils/flush";
import { OverlayProvider } from "@gluestack-ui/overlay";
import React from "react";

import { config, ConfigName, parsedConfig } from "./config";
import { ThemeValueProvider } from "./theme";

import useSettingsStore from "~/store/settings";

export function GluestackUIProvider({ mode = "light", ...props }: { mode?: "light" | "dark"; children?: any }) {
  const { theme } = useSettingsStore(state => ({
    theme: state.theme,
  }));

  const themeName = theme + "_" + mode;

  const stringcssvars = Object.keys(parsedConfig[themeName]).reduce((acc, cur) => {
    acc += `${cur}:${parsedConfig[themeName][cur]};`;
    return acc;
  }, "");
  setFlushStyles(`:root {${stringcssvars}} `);

  if (parsedConfig[themeName] && typeof document !== "undefined") {
    const element = document.documentElement;
    if (element) {
      const head = element.querySelector("head");
      let style = document.getElementById("nativewind-style") as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement("style");
        style.id = "nativewind-style";
      }
      style.innerHTML = `:root {${stringcssvars}} `;
      if (head) head.appendChild(style);
    }
  }

  return (
    <ThemeValueProvider.Provider
      value={{
        theme: config[(theme + "_" + mode) as ConfigName],
        mode,
      }}
    >
      <OverlayProvider>{props.children}</OverlayProvider>
    </ThemeValueProvider.Provider>
  );
}
