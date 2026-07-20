import { createTamagui } from "@tamagui/core";

import { classicPalette } from "./palettes";
import { createThemes } from "./themes";
import { bodyFont, tokens } from "./tokens";
import type { ThemePalette } from "./types";

export interface CreateBilisoundConfigOptions {
  userPalette?: ThemePalette;
}

export function createBilisoundConfig({ userPalette = classicPalette }: CreateBilisoundConfigOptions = {}) {
  return createTamagui({
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
