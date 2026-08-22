import { createAnimations } from "@tamagui/animations-react-native";
import { createTamagui } from "@tamagui/core";

import { classicPalette } from "./palettes";
import { createThemes } from "./themes";
import { createBodyFont, tokens } from "./tokens";
import type { ThemePalette } from "./types";

const animations = createAnimations({
  dialog: {
    type: "timing",
    duration: 250,
  },
  fade: {
    type: "timing",
    duration: 180,
  },
  quick: {
    damping: 26,
    mass: 1,
    stiffness: 250,
  },
});

export interface CreateBilisoundConfigOptions {
  /**
   * Explicit CSS/native font family for the body & heading fonts.
   *
   * DOM components run in a separate JavaScript context where fonts loaded by
   * `expo-font` on the native side do not exist, so a webview host must pass the
   * family it actually declares via `@font-face`.
   */
  fontFamily?: string;
  userPalette?: ThemePalette;
}

export function createBilisoundConfig({ fontFamily, userPalette = classicPalette }: CreateBilisoundConfigOptions = {}) {
  const bodyFont = createBodyFont(fontFamily);

  return createTamagui({
    animations,
    tokens,
    themes: createThemes(userPalette),
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
}

export const bilisoundConfig = createBilisoundConfig();
export type BilisoundConfig = typeof bilisoundConfig;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends BilisoundConfig {}
}
