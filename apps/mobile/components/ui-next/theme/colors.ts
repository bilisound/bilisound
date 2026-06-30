import { useColorScheme } from "react-native";

import useSettingsStore from "~/store/settings";

type ThemeName = "classic" | "red";
type ColorSchemeName = "light" | "dark";
type ThemeKey = `${ThemeName}_${ColorSchemeName}`;

type UiNextColorKey =
  | "--color-accent-500"
  | "--color-error-700"
  | "--color-primary-500"
  | "--color-primary-700"
  | "--color-typography-400"
  | "--color-typography-500"
  | "--color-typography-700"
  | "--color-typography-900"
  | "--color-outline-400"
  | "--color-background-50"
  | "--color-background-100"
  | "--color-background-300";

const textFieldColors: Record<ThemeKey, Record<UiNextColorKey, string>> = {
  classic_light: {
    "--color-accent-500": "59 130 246",
    "--color-error-700": "185 28 28",
    "--color-primary-500": "0 186 157",
    "--color-primary-700": "2 131 115",
    "--color-typography-400": "163 163 163",
    "--color-typography-500": "140 140 140",
    "--color-typography-700": "82 82 82",
    "--color-typography-900": "38 38 39",
    "--color-outline-400": "165 163 163",
    "--color-background-50": "246 246 246",
    "--color-background-100": "242 241 241",
    "--color-background-300": "213 212 212",
  },
  classic_dark: {
    "--color-accent-500": "96 165 250",
    "--color-error-700": "252 165 165",
    "--color-primary-500": "25 232 196",
    "--color-primary-700": "142 255 230",
    "--color-typography-400": "140 140 140",
    "--color-typography-500": "163 163 163",
    "--color-typography-700": "219 219 220",
    "--color-typography-900": "245 245 245",
    "--color-outline-400": "140 141 141",
    "--color-background-50": "39 38 37",
    "--color-background-100": "65 64 64",
    "--color-background-300": "116 116 116",
  },
  red_light: {
    "--color-accent-500": "249 115 22",
    "--color-error-700": "185 28 28",
    "--color-primary-500": "230 79 98",
    "--color-primary-700": "176 32 60",
    "--color-typography-400": "163 163 163",
    "--color-typography-500": "140 140 140",
    "--color-typography-700": "82 82 82",
    "--color-typography-900": "38 38 39",
    "--color-outline-400": "165 163 163",
    "--color-background-50": "246 246 246",
    "--color-background-100": "242 241 241",
    "--color-background-300": "213 212 212",
  },
  red_dark: {
    "--color-accent-500": "251 146 60",
    "--color-error-700": "252 165 165",
    "--color-primary-500": "240 124 136",
    "--color-primary-700": "250 209 212",
    "--color-typography-400": "140 140 140",
    "--color-typography-500": "163 163 163",
    "--color-typography-700": "219 219 220",
    "--color-typography-900": "245 245 245",
    "--color-outline-400": "140 141 141",
    "--color-background-50": "39 38 37",
    "--color-background-100": "65 64 64",
    "--color-background-300": "116 116 116",
  },
};

function rgba(rgb: string, opacity = 1) {
  return `rgba(${rgb} / ${opacity})`;
}

export function useUiNextColors() {
  const themeSetting = useSettingsStore(state => state.theme);
  let colorScheme = useColorScheme() ?? "light";
  if (colorScheme === "unspecified") {
    colorScheme = "light";
  }
  const theme = themeSetting === "red" ? "red" : "classic";
  const palette = textFieldColors[`${theme}_${colorScheme}`];

  return {
    colorValue: (color: UiNextColorKey, opacity = 1) => rgba(palette[color], opacity),
  };
}
