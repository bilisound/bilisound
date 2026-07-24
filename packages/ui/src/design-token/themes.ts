import { classicPalette, neutralPalette, redPalette } from "./palettes";
import { colorTokens } from "./tokens";
import type { Appearance, ThemePalette } from "./types";

const fixedThemeTokens = {
  white: colorTokens.white,
  black: colorTokens.black,
} as const;

export function createSemanticTheme(palette: ThemePalette, appearance: Appearance) {
  const { primary, accent } = palette;

  if (appearance === "dark") {
    return {
      ...fixedThemeTokens,
      canvas: neutralPalette[950],
      surface: neutralPalette[900],
      surfaceMuted: neutralPalette[800],
      text: neutralPalette[50],
      textMuted: neutralPalette[400],
      textDisabled: neutralPalette[500],
      placeholder: neutralPalette[500],
      border: neutralPalette[700],
      borderHover: neutralPalette[600],
      focusRing: primary[400],
      selection: accent[400],
      primaryBackground: primary[400],
      primaryBackgroundHover: primary[300],
      primaryBackgroundPress: primary[500],
      primaryBorder: primary[300],
      primaryBorderHover: primary[200],
      primaryForeground: getReadableForeground(primary[400]),
      secondaryBackground: "transparent",
      secondaryBackgroundHover: accent[950],
      secondaryBackgroundPress: accent[900],
      secondaryBorder: accent[700],
      secondaryBorderHover: accent[500],
      secondaryForeground: accent[300],
      danger: "#f87171",
      sliderTrack: neutralPalette[700],
      sliderRange: primary[400],
      sliderThumb: neutralPalette[50],
      sliderThumbBorder: primary[300],
      switchTrack: primary[50],
      switchTrackChecked: primary[400],
      switchThumb: primary[700],
    };
  }

  return {
    ...fixedThemeTokens,
    canvas: fixedThemeTokens.white,
    surface: fixedThemeTokens.white,
    surfaceMuted: neutralPalette[100],
    text: neutralPalette[950],
    textMuted: neutralPalette[600],
    textDisabled: neutralPalette[400],
    placeholder: neutralPalette[500],
    border: neutralPalette[300],
    borderHover: neutralPalette[400],
    focusRing: primary[700],
    selection: accent[600],
    primaryBackground: primary[600],
    primaryBackgroundHover: primary[500],
    primaryBackgroundPress: primary[700],
    primaryBorder: primary[600],
    primaryBorderHover: primary[500],
    primaryForeground: fixedThemeTokens.white,
    secondaryBackground: "transparent",
    secondaryBackgroundHover: accent[50],
    secondaryBackgroundPress: accent[100],
    secondaryBorder: accent[300],
    secondaryBorderHover: accent[500],
    secondaryForeground: accent[700],
    danger: "#dc2626",
    sliderTrack: neutralPalette[300],
    sliderRange: primary[600],
    sliderThumb: fixedThemeTokens.white,
    sliderThumbBorder: primary[700],
    switchTrack: primary[200],
    switchTrackChecked: primary[500],
    switchThumb: primary[50],
  };
}

export type SemanticTheme = ReturnType<typeof createSemanticTheme>;

export function createThemes(userPalette: ThemePalette = classicPalette) {
  return {
    light: createSemanticTheme(classicPalette, "light"),
    dark: createSemanticTheme(classicPalette, "dark"),
    light_classic: createSemanticTheme(classicPalette, "light"),
    dark_classic: createSemanticTheme(classicPalette, "dark"),
    light_red: createSemanticTheme(redPalette, "light"),
    dark_red: createSemanticTheme(redPalette, "dark"),
    light_user: createSemanticTheme(userPalette, "light"),
    dark_user: createSemanticTheme(userPalette, "dark"),
  };
}

export function getReadableForeground(background: string) {
  const light = fixedThemeTokens.white;
  const dark = fixedThemeTokens.black;
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
