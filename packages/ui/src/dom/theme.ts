import type { Appearance, ThemeName, ThemePalette } from "../design-token";

export interface DomThemeInsets {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

/**
 * Everything the design system needs to render correctly inside a DOM component.
 *
 * A DOM component runs in its own webview JavaScript context, so nothing from the
 * native React tree crosses the bridge: no provider, no Tamagui config, no theme
 * registry, no safe-area measurement, no `expo-font` registration. The host must
 * hand this payload over as props instead.
 *
 * Every field is JSON-serializable because DOM component props are marshalled as
 * JSON. Keep it that way: no functions, class instances, or `undefined` holes in
 * arrays.
 */
export interface DomTheme {
  appearance: Appearance;
  /**
   * CSS font stack used for the body & heading fonts.
   *
   * Fonts loaded natively through `expo-font` do not exist inside the webview.
   * Pass a family that actually resolves there, and register a matching
   * `@font-face` inside the DOM component when using a bundled font.
   *
   * Tamagui injects the font variables once. This value is initialization-only
   * for a mounted DOM component; remount the webview to change it.
   */
  fontFamily?: string;
  /**
   * Safe-area insets measured by the native host.
   *
   * The webview viewport has no notch information of its own, so overlay
   * components would otherwise fall back to zero insets.
   */
  insets?: DomThemeInsets;
  theme?: ThemeName;
  /** Required for `theme: "user"`; otherwise the user theme falls back to the classic palette. */
  userPalette?: ThemePalette;
}

export const EMPTY_DOM_THEME_INSETS: DomThemeInsets = { bottom: 0, left: 0, right: 0, top: 0 };
