import { createFont, createTokens, isWeb } from "@tamagui/core";

import { classicPalette, neutralPalette, redPalette } from "./palettes";
import { TAILWIND_SHADES } from "./types";
import type { TailwindScale, TailwindShade } from "./types";

export const spaceTokens = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  true: 16,
} as const;

export const sizeTokens = {
  ...spaceTokens,
  true: 36,
} as const;

export const radiusTokens = {
  0: 0,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  full: 9999,
  true: 6,
} as const;

export const colorTokens = {
  white: "#ffffff",
  black: "#000000",
  ...prefixPalette("neutral", neutralPalette),
  ...prefixPalette("classicPrimary", classicPalette.primary),
  ...prefixPalette("classicAccent", classicPalette.accent),
  ...prefixPalette("redPrimary", redPalette.primary),
  ...prefixPalette("redAccent", redPalette.accent),
} as const;

export const tokens = createTokens({
  color: colorTokens,
  space: spaceTokens,
  size: sizeTokens,
  radius: radiusTokens,
  zIndex: {
    0: 0,
    1: 10,
    2: 100,
    3: 1000,
  },
});

export const DEFAULT_WEB_FONT_FAMILY =
  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
export const DEFAULT_NATIVE_FONT_FAMILY = "System";

/**
 * Body/heading font.
 *
 * `family` is parameterized for DOM components: a webview has its own JavaScript
 * context where `isWeb` is always true and natively loaded fonts (expo-font) do
 * not exist, so the host must pass an explicit CSS family instead.
 */
export function createBodyFont(family: string = isWeb ? DEFAULT_WEB_FONT_FAMILY : DEFAULT_NATIVE_FONT_FAMILY) {
  return createFont({
    family,
    size: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      "2xl": 24,
      "3xl": 30,
      true: 16,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      base: 24,
      lg: 28,
      xl: 28,
      "2xl": 32,
      "3xl": 36,
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
      xs: 0.2,
      sm: 0.1,
      base: 0,
      lg: -0.1,
      xl: -0.2,
      "2xl": -0.4,
      "3xl": -0.6,
      true: 0,
    },
  });
}

export const bodyFont = createBodyFont();

function prefixPalette<const Name extends string>(name: Name, scale: TailwindScale) {
  return Object.fromEntries(TAILWIND_SHADES.map(shade => [`${name}${shade}`, scale[shade]])) as Record<
    `${Name}${TailwindShade}`,
    string
  >;
}
