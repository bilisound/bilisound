import { idb, initDatabase } from "~/storage/sqlite/init-web";

import { ThemeAsset, UserTheme } from "./types";

export const themeStorage = {
  async listThemes(): Promise<UserTheme[]> {
    const db = await getDatabase();
    return db.getAll("themeProfile");
  },

  async getTheme(id: string): Promise<UserTheme | null> {
    const db = await getDatabase();
    return (await db.get("themeProfile", id)) ?? null;
  },

  async saveTheme(theme: UserTheme, asset?: Omit<ThemeAsset, "themeId">): Promise<void> {
    const savedTheme = asset ? withSavedAssetId(theme, await themeStorage.saveThemeAsset(theme.id, asset)) : theme;
    const db = await getDatabase();
    await db.put("themeProfile", savedTheme);
  },

  async deleteTheme(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete("themeProfile", id);
    await themeStorage.deleteThemeAsset(id);
  },

  async deleteThemeAsset(themeId: string): Promise<void> {
    const db = await getDatabase();
    await deleteThemeAssetsFromDatabase(db, themeId);
  },

  async saveThemeAsset(themeId: string, asset: Omit<ThemeAsset, "themeId">): Promise<ThemeAsset> {
    if (!asset.blob) {
      throw new Error("Web theme assets require a blob");
    }
    const stored = {
      id: asset.id,
      themeId,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      blob: asset.blob,
    };
    const db = await getDatabase();
    const tx = db.transaction("themeAsset", "readwrite");
    await tx.store.put(stored);
    const index = tx.store.index("by-themeId");
    let cursor = await index.openCursor(themeId);
    while (cursor) {
      if (cursor.value.id !== stored.id) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
    await tx.done;
    return stored;
  },

  async getThemeAsset(themeOrId: UserTheme | string): Promise<ThemeAsset | null> {
    const theme = typeof themeOrId === "string" ? await themeStorage.getTheme(themeOrId) : themeOrId;
    if (!theme) return null;
    const assetId = theme.yuruChara?.imageAssetId;
    if (!assetId) return null;
    const db = await getDatabase();
    return (await db.get("themeAsset", assetId)) ?? null;
  },
};

async function getDatabase() {
  return idb ?? initDatabase();
}

async function deleteThemeAssetsFromDatabase(db: Awaited<ReturnType<typeof getDatabase>>, themeId: string) {
  const tx = db.transaction("themeAsset", "readwrite");
  const index = tx.store.index("by-themeId");
  let cursor = await index.openCursor(themeId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

function withSavedAssetId(theme: UserTheme, asset: ThemeAsset): UserTheme {
  return theme.yuruChara ? { ...theme, yuruChara: { ...theme.yuruChara, imageAssetId: asset.id } } : theme;
}
