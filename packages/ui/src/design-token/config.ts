import { createAnimations } from "@tamagui/animations-react-native";
import { createTamagui } from "@tamagui/core";

import { classicPalette } from "./palettes";
import { createThemes } from "./themes";
import { bodyFont, tokens } from "./tokens";
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
  userPalette?: ThemePalette;
}

export function createBilisoundConfig({ userPalette = classicPalette }: CreateBilisoundConfigOptions = {}) {
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
