import { vars } from "nativewind";
import { create } from "zustand";

import { ColorSchemeName, ConfigDetail, getBuiltInConfig } from "~/components/ui/gluestack-ui-provider/config";

import { reverseTailwindScale } from "./color-scale";
import { rgbStringFromCssColor } from "./package-schema";
import { themeStorage } from "./storage";
import { TAILWIND_SHADES } from "./types";
import type { BuiltInThemeId, ThemeAsset, ThemeId, UserTheme } from "./types";

interface ThemeRegistryState {
  themes: UserTheme[];
  loaded: boolean;
  loadThemes: () => Promise<void>;
  saveTheme: (theme: UserTheme, asset?: Omit<ThemeAsset, "themeId">) => Promise<void>;
  deleteTheme: (id: string) => Promise<void>;
}

export const useThemeRegistry = create<ThemeRegistryState>((set, get) => ({
  themes: [],
  loaded: false,
  loadThemes: async () => {
    const themes = await themeStorage.listThemes();
    set({ themes, loaded: true });
  },
  saveTheme: async (theme, asset) => {
    await themeStorage.saveTheme(theme, asset);
    const themes = get()
      .themes.filter(item => item.id !== theme.id)
      .concat(theme);
    set({ themes });
  },
  deleteTheme: async id => {
    await themeStorage.deleteTheme(id);
    set({ themes: get().themes.filter(item => item.id !== id) });
  },
}));

export function getUserThemeId(themeId: ThemeId | string): string | null {
  if (!themeId.startsWith("user:")) return null;
  return stripUserThemePrefix(themeId);
}

export function getUserThemeSettingId(themeId: string): string {
  return `user:${stripUserThemePrefix(themeId)}`;
}

export function findUserTheme(themes: UserTheme[], themeId: ThemeId | string): UserTheme | null {
  if (themeId === "classic" || themeId === "red") {
    return null;
  }

  const userThemeId = stripUserThemePrefix(themeId);
  return themes.find(item => stripUserThemePrefix(item.id) === userThemeId) ?? null;
}

function stripUserThemePrefix(themeId: string): string {
  let id = themeId;
  while (id.startsWith("user:")) {
    id = id.slice("user:".length);
  }
  return id;
}

export function resolveThemeConfig(
  themeId: ThemeId | string,
  mode: ColorSchemeName,
  userTheme?: UserTheme | null,
): ConfigDetail {
  if (themeId === "red" || themeId === "classic") {
    return getBuiltInConfig(themeId as BuiltInThemeId, mode);
  }

  const fallback = { ...getBuiltInConfig("classic", mode) };
  if (!userTheme) {
    return fallback;
  }

  const primaryPalette = mode === "dark" ? reverseTailwindScale(userTheme.palette.primary) : userTheme.palette.primary;
  const accentPalette = mode === "dark" ? reverseTailwindScale(userTheme.palette.accent) : userTheme.palette.accent;

  for (const shade of TAILWIND_SHADES) {
    fallback[`--color-primary-${shade}`] = rgbStringFromCssColor(primaryPalette[shade]);
    fallback[`--color-accent-${shade}`] = rgbStringFromCssColor(accentPalette[shade]);
  }
  return fallback;
}

export function createRuntimeVars(config: ConfigDetail) {
  return vars(config);
}
