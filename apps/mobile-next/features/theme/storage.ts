import { eq, sql } from "drizzle-orm";
import * as FileSystem from "expo-file-system/legacy";
import path from "path-browserify";

import { BILISOUND_THEME_URI } from "~/constants/file";
import { db } from "~/storage/sqlite/main";
import { themeProfile } from "~/storage/sqlite/schema";

import { ThemeAsset, UserTheme } from "./types";

export const themeStorage = {
  async listThemes(): Promise<UserTheme[]> {
    await ensureThemeProfileTable();
    const rows = await db.select().from(themeProfile);
    return rows.map(rowToTheme);
  },

  async getTheme(id: string): Promise<UserTheme | null> {
    await ensureThemeProfileTable();
    const rows = await db.select().from(themeProfile).where(eq(themeProfile.id, id));
    return rows[0] ? rowToTheme(rows[0]) : null;
  },

  async saveTheme(theme: UserTheme, asset?: Omit<ThemeAsset, "themeId">): Promise<void> {
    await ensureThemeProfileTable();
    const savedTheme = asset ? withSavedAssetId(theme, await themeStorage.saveThemeAsset(theme.id, asset)) : theme;
    const row = themeToRow(savedTheme);
    await db.insert(themeProfile).values(row).onConflictDoUpdate({ target: themeProfile.id, set: row });
  },

  async deleteTheme(id: string): Promise<void> {
    await ensureThemeProfileTable();
    await db.delete(themeProfile).where(eq(themeProfile.id, id));
    await FileSystem.deleteAsync(`${BILISOUND_THEME_URI}/${id}`, { idempotent: true });
  },

  async deleteThemeAsset(themeId: string): Promise<void> {
    await FileSystem.deleteAsync(`${BILISOUND_THEME_URI}/${themeId}`, { idempotent: true });
  },

  async saveThemeAsset(themeId: string, asset: Omit<ThemeAsset, "themeId">): Promise<ThemeAsset> {
    if (!asset.uri) {
      throw new Error("Native theme assets require a source uri");
    }
    const extension = path.extname(asset.fileName) || extensionFromMimeType(asset.mimeType);
    const id = asset.id;
    const dir = `${BILISOUND_THEME_URI}/${themeId}`;
    const targetUri = `${dir}/${id}${extension}`;
    const targetFileName = `${id}${extension}`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const existingFiles = await FileSystem.readDirectoryAsync(dir).catch(() => []);
    await FileSystem.copyAsync({ from: asset.uri, to: targetUri });
    await Promise.all(
      existingFiles
        .filter((file: string) => file !== targetFileName)
        .map((file: string) => FileSystem.deleteAsync(`${dir}/${file}`, { idempotent: true })),
    );
    return { ...asset, id, themeId, uri: targetUri };
  },

  async getThemeAsset(themeOrId: UserTheme | string): Promise<ThemeAsset | null> {
    const theme = typeof themeOrId === "string" ? await themeStorage.getTheme(themeOrId) : themeOrId;
    if (!theme) return null;
    const assetId = theme.yuruChara?.imageAssetId;
    if (!assetId) return null;
    const dir = `${BILISOUND_THEME_URI}/${theme.id}`;
    const files = await FileSystem.readDirectoryAsync(dir).catch(() => []);
    const fileName = files.find((file: string) => path.parse(file).name === assetId);
    if (!fileName) return null;
    const mimeType = mimeTypeFromFileName(fileName);
    if (!mimeType) return null;
    return { id: assetId, themeId: theme.id, fileName, mimeType, uri: `${dir}/${fileName}` };
  },
};

async function ensureThemeProfileTable() {
  await db.transaction(tx => {
    tx.run(sql`
      CREATE TABLE IF NOT EXISTS "theme_profile" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "palette_json" text NOT NULL,
        "yuru_chara_json" text,
        "image_asset_id" text
      );
    `);
  });
}

function rowToTheme(row: typeof themeProfile.$inferSelect): UserTheme {
  return {
    id: row.id,
    name: row.name,
    version: 1,
    baseTheme: "classic",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    palette: JSON.parse(row.paletteJson),
    yuruChara: row.yuruCharaJson ? JSON.parse(row.yuruCharaJson) : undefined,
  };
}

function themeToRow(theme: UserTheme): typeof themeProfile.$inferInsert {
  return {
    id: theme.id,
    name: theme.name,
    createdAt: theme.createdAt,
    updatedAt: theme.updatedAt,
    paletteJson: JSON.stringify(theme.palette),
    yuruCharaJson: theme.yuruChara ? JSON.stringify(theme.yuruChara) : null,
    imageAssetId: theme.yuruChara?.imageAssetId ?? null,
  };
}

function withSavedAssetId(theme: UserTheme, asset: ThemeAsset): UserTheme {
  return theme.yuruChara ? { ...theme, yuruChara: { ...theme.yuruChara, imageAssetId: asset.id } } : theme;
}

function extensionFromMimeType(mimeType: ThemeAsset["mimeType"]) {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  return ".webp";
}

function mimeTypeFromFileName(fileName: string): ThemeAsset["mimeType"] | null {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return null;
}
