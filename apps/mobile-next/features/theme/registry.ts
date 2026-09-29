import { create } from "zustand";

import { themeStorage } from "./storage";
import type { ThemeAsset, ThemeId, UserTheme } from "./types";

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

// UI palettes are passed unchanged to BilisoundProvider; the shared semantic theme owns dark mode.
