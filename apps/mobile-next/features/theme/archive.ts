import * as FileSystem from "expo-file-system/legacy";
import path from "path-browserify";
import { unzip, zip } from "react-native-zip-archive";

import { normalizeThemeManifest } from "./package-schema";
import type { ImportedThemePackage, ThemeAsset, UserTheme } from "./types";

export interface NativeThemeArchiveInput {
  uri: string;
}

export interface NativeThemeArchiveOutput {
  uri: string;
  mimeType: "application/zip";
  fileName: string;
}

export async function importThemePackage(input: NativeThemeArchiveInput): Promise<ImportedThemePackage> {
  const workDir = `${FileSystem.cacheDirectory}theme-import-${Date.now()}`;
  await FileSystem.makeDirectoryAsync(workDir, { intermediates: true });
  const extractedDir = toFileUri(await unzip(input.uri, workDir));
  const manifestUri = `${extractedDir}/theme.json`;
  const manifest = normalizeThemeManifest(
    JSON.parse(await FileSystem.readAsStringAsync(manifestUri, { encoding: "utf8" })),
  );
  const image = manifest.yuruChara?.image;
  if (!image) return { manifest };
  const imageUri = `${extractedDir}/${image}`;
  const info = await FileSystem.getInfoAsync(imageUri);
  if (!info.exists) {
    throw new Error("Theme package image is missing");
  }
  const mimeType = mimeTypeFromFileName(image);
  if (!mimeType) {
    throw new Error("Theme package image type is unsupported");
  }
  return {
    manifest,
    asset: {
      fileName: image,
      mimeType,
      uri: imageUri,
    },
  };
}

export async function exportThemePackage(theme: UserTheme, asset?: ThemeAsset): Promise<NativeThemeArchiveOutput> {
  const workDir = `${FileSystem.cacheDirectory}theme-export-${Date.now()}`;
  await FileSystem.makeDirectoryAsync(workDir, { intermediates: true });
  const manifest = normalizeThemeManifest({
    kind: "moe.bilisound.app.theme",
    version: 1,
    name: theme.name,
    baseTheme: "classic",
    palette: theme.palette,
    yuruChara:
      theme.yuruChara && asset ? { ...theme.yuruChara, image: asset.fileName, imageAssetId: undefined } : undefined,
  });
  await FileSystem.writeAsStringAsync(`${workDir}/theme.json`, JSON.stringify(manifest, null, 2));
  if (asset?.uri) {
    await FileSystem.copyAsync({ from: asset.uri, to: `${workDir}/${asset.fileName}` });
  }
  const outputUri = `${FileSystem.cacheDirectory}${theme.id}.zip`;
  await zip(workDir, outputUri);
  return { uri: outputUri, mimeType: "application/zip", fileName: `${manifest.name}.zip` };
}

function toFileUri(uri: string) {
  return uri.startsWith("/") ? `file://${uri}` : uri;
}

function mimeTypeFromFileName(fileName: string): ThemeAsset["mimeType"] | null {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return null;
}
