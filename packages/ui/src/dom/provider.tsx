import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { createBilisoundConfig } from "../design-token";
import type { BilisoundConfig } from "../design-token";
import { classicPalette } from "../design-token";
import { BilisoundProvider, updateUserTheme } from "../provider";
import { EMPTY_DOM_THEME_INSETS } from "./theme";
import type { DomTheme } from "./theme";

export interface BilisoundDomProviderProps extends DomTheme {
  children: ReactNode;
}

/**
 * Design-system root for a `"use dom"` component.
 *
 * Use this instead of `BilisoundProvider` inside DOM components. The webview has
 * its own JavaScript context, so it must build its own Tamagui config, inject its
 * own CSS, and receive safe-area insets from the native host as props.
 *
 * ```tsx
 * "use dom";
 *
 * export default function Markdown({ theme, source }: { theme: DomTheme; source: string; dom?: DOMProps }) {
 *   return (
 *     <BilisoundDomProvider {...theme}>
 *       <View backgroundColor="$canvas">...</View>
 *     </BilisoundDomProvider>
 *   );
 * }
 * ```
 */
export function BilisoundDomProvider({
  appearance,
  children,
  fontFamily,
  insets,
  theme = "classic",
  userPalette,
}: BilisoundDomProviderProps) {
  // The initial user palette is baked into the config so
  // `light_user`/`dark_user` are correct on first paint instead of flashing the
  // classic palette. Tamagui's config and font CSS registry are global within a
  // webview, so the config must remain stable for that webview's lifetime.
  const configRef = useRef<BilisoundConfig | null>(null);
  if (!configRef.current) {
    configRef.current = createBilisoundConfig({ fontFamily, userPalette });
  }

  // Props arrive over the bridge as freshly parsed JSON, so compare the palette
  // by value. Recreating the config does not replace Tamagui's injected theme
  // CSS; update the registered user themes through Tamagui's supported mutation
  // path instead.
  const palette = userPalette ?? classicPalette;
  const paletteKey = JSON.stringify(palette);
  const previousPaletteKeyRef = useRef(paletteKey);
  useLayoutEffect(() => {
    if (previousPaletteKeyRef.current === paletteKey) return;
    previousPaletteKeyRef.current = paletteKey;
    updateUserTheme(palette);
  }, [palette, paletteKey]);

  const resolvedInsets = insets ?? EMPTY_DOM_THEME_INSETS;

  return (
    <SafeAreaInsetsContext.Provider value={resolvedInsets}>
      <BilisoundProvider appearance={appearance} config={configRef.current} insets={resolvedInsets} theme={theme}>
        {children}
      </BilisoundProvider>
    </SafeAreaInsetsContext.Provider>
  );
}
