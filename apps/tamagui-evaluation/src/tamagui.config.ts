import { createFont, createTamagui, createTokens, isWeb } from "@tamagui/core";

import type { TailwindScale } from "./color-scale";

type SchemeName = "light" | "dark";
export type UserThemeName = "bilisound" | "tailwindRose" | "tailwindSky";

const slate = {
  "50": "#f8fafc",
  "100": "#f1f5f9",
  "200": "#e2e8f0",
  "300": "#cbd5e1",
  "400": "#94a3b8",
  "500": "#64748b",
  "600": "#475569",
  "700": "#334155",
  "800": "#1e293b",
  "900": "#0f172a",
  "950": "#020617",
} satisfies TailwindScale;

const teal = {
  "50": "#f0fdfa",
  "100": "#ccfbf1",
  "200": "#99f6e4",
  "300": "#5eead4",
  "400": "#2dd4bf",
  "500": "#14b8a6",
  "600": "#0d9488",
  "700": "#0f766e",
  "800": "#115e59",
  "900": "#134e4a",
  "950": "#042f2e",
} satisfies TailwindScale;

const rose = {
  "50": "#fff1f2",
  "100": "#ffe4e6",
  "200": "#fecdd3",
  "300": "#fda4af",
  "400": "#fb7185",
  "500": "#f43f5e",
  "600": "#e11d48",
  "700": "#be123c",
  "800": "#9f1239",
  "900": "#881337",
  "950": "#4c0519",
} satisfies TailwindScale;

const sky = {
  "50": "#f0f9ff",
  "100": "#e0f2fe",
  "200": "#bae6fd",
  "300": "#7dd3fc",
  "400": "#38bdf8",
  "500": "#0ea5e9",
  "600": "#0284c7",
  "700": "#0369a1",
  "800": "#075985",
  "900": "#0c4a6e",
  "950": "#082f49",
} satisfies TailwindScale;

export const tailwindPalettes = { slate, teal, rose, sky };

export const paletteScales: Record<UserThemeName, TailwindScale> = {
  bilisound: teal,
  tailwindRose: rose,
  tailwindSky: sky,
};

export function createSemanticTheme(accent: TailwindScale, scheme: SchemeName) {
  if (scheme === "dark") {
    return {
      canvas: slate[950],
      surface: slate[900],
      surfaceSubtle: slate[800],
      text: slate[50],
      textMuted: slate[400],
      border: slate[700],
      borderStrong: slate[600],
      focusRing: accent[400],
      buttonBackground: accent[400],
      buttonBackgroundHover: accent[300],
      buttonBackgroundPress: accent[500],
      buttonBorder: accent[300],
      buttonBorderHover: accent[200],
      buttonText: getReadableForeground(accent[400]),
      buttonSecondaryBackground: "transparent",
      buttonSecondaryBackgroundHover: accent[950],
      buttonSecondaryBackgroundPress: accent[900],
      buttonSecondaryBorder: accent[700],
      buttonSecondaryBorderHover: accent[500],
      buttonSecondaryText: accent[300],
    };
  }

  return {
    canvas: slate[50],
    surface: "#ffffff",
    surfaceSubtle: slate[100],
    text: slate[950],
    textMuted: slate[600],
    border: slate[200],
    borderStrong: slate[300],
    focusRing: accent[700],
    buttonBackground: accent[600],
    buttonBackgroundHover: accent[700],
    buttonBackgroundPress: accent[800],
    buttonBorder: accent[700],
    buttonBorderHover: accent[800],
    buttonText: getReadableForeground(accent[600]),
    buttonSecondaryBackground: "transparent",
    buttonSecondaryBackgroundHover: accent[50],
    buttonSecondaryBackgroundPress: accent[100],
    buttonSecondaryBorder: accent[300],
    buttonSecondaryBorderHover: accent[500],
    buttonSecondaryText: accent[700],
  };
}

export type SemanticTheme = ReturnType<typeof createSemanticTheme>;

const themes = {
  light: createSemanticTheme(teal, "light"),
  dark: createSemanticTheme(teal, "dark"),
  light_bilisound: createSemanticTheme(teal, "light"),
  dark_bilisound: createSemanticTheme(teal, "dark"),
  light_tailwindRose: createSemanticTheme(rose, "light"),
  dark_tailwindRose: createSemanticTheme(rose, "dark"),
  light_tailwindSky: createSemanticTheme(sky, "light"),
  dark_tailwindSky: createSemanticTheme(sky, "dark"),
  light_user: createSemanticTheme(teal, "light"),
  dark_user: createSemanticTheme(teal, "dark"),
};

export type AppThemeName = Exclude<keyof typeof themes, "light" | "dark">;

const tokens = createTokens({
  color: {
    white: "#ffffff",
    black: "#000000",
    ...prefixPalette("slate", slate),
    ...prefixPalette("teal", teal),
    ...prefixPalette("rose", rose),
    ...prefixPalette("sky", sky),
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 32,
    8: 40,
    true: 16,
  },
  size: {
    0: 0,
    1: 20,
    2: 24,
    3: 32,
    4: 40,
    5: 44,
    6: 48,
    7: 56,
    true: 44,
  },
  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 24,
    true: 12,
  },
  zIndex: {
    0: 0,
    1: 10,
    2: 100,
    3: 1000,
  },
});

const bodyFont = createFont({
  family: isWeb ? "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" : "System",
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 22,
    6: 30,
    7: 42,
    8: 56,
    true: 16,
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 24,
    4: 28,
    5: 30,
    6: 38,
    7: 48,
    8: 60,
    true: 24,
  },
  weight: {
    4: "400",
    5: "500",
    6: "600",
    7: "700",
    true: "400",
  },
  letterSpacing: {
    1: 0.4,
    2: 0.2,
    3: 0,
    4: -0.1,
    5: -0.3,
    6: -0.7,
    7: -1.2,
    8: -1.8,
    true: 0,
  },
});

export const tamaguiConfig = createTamagui({
  tokens,
  themes,
  fonts: {
    body: bodyFont,
    heading: bodyFont,
  },
  media: {
    sm: { maxWidth: 660 },
    gtSm: { minWidth: 661 },
  },
  settings: {
    disableSSR: true,
    onlyAllowShorthands: false,
  },
});

export type TamaguiAppConfig = typeof tamaguiConfig;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends TamaguiAppConfig {}
}

function prefixPalette(name: string, scale: TailwindScale) {
  return Object.fromEntries(Object.entries(scale).map(([shade, value]) => [`${name}${shade}`, value]));
}

export function getReadableForeground(background: string) {
  const light = "#ffffff";
  const dark = slate[950];
  return contrast(background, light) >= contrast(background, dark) ? light : dark;
}

function contrast(first: string, second: string) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map(channel =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}
