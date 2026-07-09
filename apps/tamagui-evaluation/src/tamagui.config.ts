import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

type SchemeName = "light" | "dark";
export type UserThemeName = "bilisound" | "tailwindRose" | "tailwindSky";

const bilisoundLight = [
  "#f0fdfa",
  "#ccfbf1",
  "#99f6e4",
  "#5eead4",
  "#2dd4bf",
  "#14b8a6",
  "#0d9488",
  "#0f766e",
  "#115e59",
  "#134e4a",
  "#042f2e",
  "#0f172a",
];
const bilisoundDark = [
  "#020617",
  "#0f172a",
  "#134e4a",
  "#115e59",
  "#0f766e",
  "#0d9488",
  "#14b8a6",
  "#2dd4bf",
  "#5eead4",
  "#99f6e4",
  "#ccfbf1",
  "#f0fdfa",
];

const roseLight = [
  "#fff1f2",
  "#ffe4e6",
  "#fecdd3",
  "#fda4af",
  "#fb7185",
  "#f43f5e",
  "#e11d48",
  "#be123c",
  "#9f1239",
  "#881337",
  "#4c0519",
  "#0f172a",
];
const roseDark = [
  "#020617",
  "#4c0519",
  "#881337",
  "#9f1239",
  "#be123c",
  "#e11d48",
  "#f43f5e",
  "#fb7185",
  "#fda4af",
  "#fecdd3",
  "#ffe4e6",
  "#fff1f2",
];

const skyLight = [
  "#f0f9ff",
  "#e0f2fe",
  "#bae6fd",
  "#7dd3fc",
  "#38bdf8",
  "#0ea5e9",
  "#0284c7",
  "#0369a1",
  "#075985",
  "#0c4a6e",
  "#082f49",
  "#0f172a",
];
const skyDark = [
  "#020617",
  "#082f49",
  "#0c4a6e",
  "#075985",
  "#0369a1",
  "#0284c7",
  "#0ea5e9",
  "#38bdf8",
  "#7dd3fc",
  "#bae6fd",
  "#e0f2fe",
  "#f0f9ff",
];

export const paletteScales: Record<UserThemeName, Record<SchemeName, string[]>> = {
  bilisound: {
    light: bilisoundLight,
    dark: bilisoundDark,
  },
  tailwindRose: {
    light: roseLight,
    dark: roseDark,
  },
  tailwindSky: {
    light: skyLight,
    dark: skyDark,
  },
};

const colorSchemes: Record<UserThemeName, Record<SchemeName, ReturnType<typeof createPaletteTheme>>> = {
  bilisound: {
    light: createPaletteTheme(bilisoundLight, "light"),
    dark: createPaletteTheme(bilisoundDark, "dark"),
  },
  tailwindRose: {
    light: createPaletteTheme(roseLight, "light"),
    dark: createPaletteTheme(roseDark, "dark"),
  },
  tailwindSky: {
    light: createPaletteTheme(skyLight, "light"),
    dark: createPaletteTheme(skyDark, "dark"),
  },
};

const themes = {
  ...defaultConfig.themes,
  light_bilisound: colorSchemes.bilisound.light,
  dark_bilisound: colorSchemes.bilisound.dark,
  light_tailwindRose: colorSchemes.tailwindRose.light,
  dark_tailwindRose: colorSchemes.tailwindRose.dark,
  light_tailwindSky: colorSchemes.tailwindSky.light,
  dark_tailwindSky: colorSchemes.tailwindSky.dark,
  light_user: createPaletteTheme(bilisoundLight, "light"),
  dark_user: createPaletteTheme(bilisoundDark, "dark"),
};

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes,
  settings: {
    ...defaultConfig.settings,
    disableSSR: true,
    onlyAllowShorthands: false,
  },
});

export type TamaguiAppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends TamaguiAppConfig {}
}

export function createPaletteTheme(scale: string[], scheme: SchemeName) {
  const isDark = scheme === "dark";
  const background = scale[0];
  const mutedBackground = scale[1];
  const pressedBackground = scale[2];
  const borderColor = scale[3];
  const focusColor = scale[5];
  const foreground = scale[11];
  const mutedForeground = scale[10];

  return {
    background,
    backgroundHover: mutedBackground,
    backgroundPress: pressedBackground,
    backgroundFocus: pressedBackground,
    backgroundStrong: scale[2],
    backgroundTransparent: isDark ? "rgba(2, 6, 23, 0.72)" : "rgba(255, 255, 255, 0.72)",
    color: foreground,
    colorHover: mutedForeground,
    colorPress: mutedForeground,
    colorFocus: foreground,
    colorTransparent: isDark ? "rgba(240, 253, 250, 0.72)" : "rgba(15, 23, 42, 0.72)",
    borderColor,
    borderColorHover: scale[4],
    borderColorPress: focusColor,
    borderColorFocus: focusColor,
    placeholderColor: scale[8],
    outlineColor: focusColor,
    shadowColor: isDark ? "rgba(0, 0, 0, 0.45)" : "rgba(15, 23, 42, 0.16)",
    color1: scale[0],
    color2: scale[1],
    color3: scale[2],
    color4: scale[3],
    color5: scale[4],
    color6: scale[5],
    color7: scale[6],
    color8: scale[7],
    color9: scale[8],
    color10: scale[9],
    color11: scale[10],
    color12: scale[11],
  };
}
