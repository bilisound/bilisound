import type { ReactNode } from "react";
import { TamaguiProvider, Theme } from "@tamagui/core";
import { updateTheme } from "@tamagui/theme";

import { bilisoundConfig } from "./design-token/config";
import type { BilisoundConfig } from "./design-token/config";
import { createSemanticTheme } from "./design-token/themes";
import type { Appearance, BilisoundThemeName, ThemeName, ThemePalette } from "./design-token/types";

export interface BilisoundProviderProps {
  appearance: Appearance;
  children: ReactNode;
  config?: BilisoundConfig;
  disableInjectCSS?: boolean;
  insets?: Record<"top" | "right" | "bottom" | "left", number>;
  theme?: ThemeName;
}

export function BilisoundProvider({
  appearance,
  children,
  config = bilisoundConfig,
  disableInjectCSS,
  insets,
  theme = "classic",
}: BilisoundProviderProps) {
  const themeName: BilisoundThemeName = `${appearance}_${theme}`;

  return (
    <TamaguiProvider config={config} defaultTheme={appearance} disableInjectCSS={disableInjectCSS} insets={insets}>
      <Theme name={themeName}>{children}</Theme>
    </TamaguiProvider>
  );
}

export function updateUserTheme(palette: ThemePalette) {
  updateTheme({ name: "light_user", theme: createSemanticTheme(palette, "light") });
  updateTheme({ name: "dark_user", theme: createSemanticTheme(palette, "dark") });
}
