import { useColorScheme } from "react-native";

import { findUserTheme, resolveThemeConfig, useThemeRegistry } from "~/features/theme/registry";
import { useAppearanceConfig } from "~/features/config";

type UiNextColorKey =
  | "--color-accent-500"
  | "--color-error-500"
  | "--color-error-700"
  | "--color-primary-500"
  | "--color-primary-700"
  | "--color-warning-500"
  | "--color-success-500"
  | "--color-typography-0"
  | "--color-typography-50"
  | "--color-typography-100"
  | "--color-typography-200"
  | "--color-typography-300"
  | "--color-typography-400"
  | "--color-typography-500"
  | "--color-typography-600"
  | "--color-typography-700"
  | "--color-typography-800"
  | "--color-typography-900"
  | "--color-typography-950"
  | "--color-outline-400"
  | "--color-background-0"
  | "--color-background-50"
  | "--color-background-100"
  | "--color-background-200"
  | "--color-background-300"
  | "--color-background-400"
  | "--color-background-500"
  | "--color-background-600"
  | "--color-background-700"
  | "--color-background-800"
  | "--color-background-900"
  | "--color-background-950";

function rgba(rgb: string, opacity = 1) {
  return `rgba(${rgb} / ${opacity})`;
}

export function useUiNextColors() {
  const { theme: themeSetting } = useAppearanceConfig();
  const themes = useThemeRegistry(state => state.themes);
  let colorScheme = useColorScheme() ?? "light";
  if (colorScheme === "unspecified") {
    colorScheme = "light";
  }

  const userTheme = findUserTheme(themes, themeSetting);
  const config = resolveThemeConfig(themeSetting, colorScheme, userTheme);

  return {
    colorValue: (color: UiNextColorKey, opacity = 1) => rgba(config[color], opacity),
  };
}
