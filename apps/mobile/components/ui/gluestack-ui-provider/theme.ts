import { createContext, useContext } from "react";

import { ColorSchemeName, config, ConfigDetail, ConfigName } from "./config";

interface ThemeValue {
  theme: (typeof config)[ConfigName];
  mode: ColorSchemeName;
}

export const ThemeValueProvider = createContext<ThemeValue | null>(null);

export interface ColorValueModeOptions {
  light: { color: keyof ConfigDetail; opacity?: number };
  dark: { color: keyof ConfigDetail; opacity?: number };
}

export function useRawThemeValues() {
  const values = useContext(ThemeValueProvider);
  if (!values) {
    throw new Error("useRawThemeValues must be used within ThemeValueProvider");
  }

  const colorValue = (color: keyof ConfigDetail, opacity = 1) => {
    return `rgba(${values.theme[color]} / ${opacity})`;
  };

  const colorValueMode = (options: ColorValueModeOptions) => {
    if (values.mode === "dark") {
      return `rgba(${values.theme[options.dark.color]} / ${options.dark.opacity ?? 1})`;
    }
    return `rgba(${values.theme[options.light.color]} / ${options.light.opacity ?? 1})`;
  };

  return { values: values.theme, mode: values.mode, colorValue, colorValueMode };
}
