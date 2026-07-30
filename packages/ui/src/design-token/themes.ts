import { classicPalette, negativePalette, neutralPalette, positivePalette, redPalette } from "./palettes";
import { colorTokens } from "./tokens";
import type { Appearance, TailwindScale, ThemePalette } from "./types";

const fixedThemeTokens = {
  white: colorTokens.white,
  black: colorTokens.black,
} as const;

/**
 * Button color slots, resolved per button color (primary/accent/neutral).
 *
 * - solid*: filled background ramp + readable foreground
 * - text: colored label on plain surfaces (outline/ghost)
 * - outline*: border ramp for the outline variant
 * - tint*: subtle hover/press fill for outline & ghost
 */
interface ButtonColorSchemeTokens {
  solid: string;
  solidHover: string;
  solidPress: string;
  onSolid: string;
  text: string;
  outline: string;
  outlineHover: string;
  tintHover: string;
  tintPress: string;
}

function createChromaticButtonScheme(scale: TailwindScale, appearance: Appearance): ButtonColorSchemeTokens {
  if (appearance === "dark") {
    return {
      solid: scale[400],
      solidHover: scale[300],
      solidPress: scale[500],
      onSolid: getReadableForeground(scale[400]),
      text: scale[300],
      outline: scale[700],
      outlineHover: scale[500],
      tintHover: scale[950],
      tintPress: scale[900],
    };
  }

  return {
    solid: scale[600],
    solidHover: scale[500],
    solidPress: scale[700],
    onSolid: fixedThemeTokens.white,
    text: scale[700],
    outline: scale[300],
    outlineHover: scale[500],
    tintHover: scale[50],
    tintPress: scale[100],
  };
}

function createNeutralButtonScheme(appearance: Appearance): ButtonColorSchemeTokens {
  if (appearance === "dark") {
    return {
      solid: neutralPalette[400],
      solidHover: neutralPalette[300],
      solidPress: neutralPalette[500],
      onSolid: getReadableForeground(neutralPalette[400]),
      text: neutralPalette[50],
      outline: neutralPalette[700],
      outlineHover: neutralPalette[600],
      tintHover: neutralPalette[800],
      tintPress: neutralPalette[800],
    };
  }

  return {
    solid: neutralPalette[600],
    solidHover: neutralPalette[500],
    solidPress: neutralPalette[700],
    onSolid: fixedThemeTokens.white,
    text: neutralPalette[950],
    outline: neutralPalette[300],
    outlineHover: neutralPalette[400],
    tintHover: neutralPalette[100],
    tintPress: neutralPalette[100],
  };
}

function prefixButtonScheme<Color extends string>(color: Color, scheme: ButtonColorSchemeTokens) {
  return Object.fromEntries(
    Object.entries(scheme).map(([key, value]) => [`${color}${key[0].toUpperCase()}${key.slice(1)}`, value]),
  ) as Record<`${Color}${Capitalize<keyof ButtonColorSchemeTokens>}`, string>;
}

export function createSemanticTheme(palette: ThemePalette, appearance: Appearance) {
  const { primary, accent } = palette;
  const buttonColorSchemes = {
    ...prefixButtonScheme("primary", createChromaticButtonScheme(primary, appearance)),
    ...prefixButtonScheme("accent", createChromaticButtonScheme(accent, appearance)),
    ...prefixButtonScheme("neutral", createNeutralButtonScheme(appearance)),
    ...prefixButtonScheme("positive", createChromaticButtonScheme(positivePalette, appearance)),
    ...prefixButtonScheme("negative", createChromaticButtonScheme(negativePalette, appearance)),
  };

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
      primaryBorder: primary[300],
      primaryBorderHover: primary[200],
      ...buttonColorSchemes,
      danger: negativePalette[300],
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
    primaryBorder: primary[600],
    primaryBorderHover: primary[500],
    ...buttonColorSchemes,
    danger: negativePalette[600],
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
