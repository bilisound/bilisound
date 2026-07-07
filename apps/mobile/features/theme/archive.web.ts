import JSZip from "jszip";

import { normalizeThemeManifest } from "./package-schema";
import type { ImportedThemePackage, ThemeAsset, UserTheme } from "./types";

export interface WebThemeArchiveInput {
  file: File | Blob;
}

export interface WebThemeArchiveOutput {
  blob: Blob;
  mimeType: "application/zip";
  fileName: string;
}

export async function importThemePackage(input: WebThemeArchiveInput): Promise<ImportedThemePackage> {
  const zip = await JSZip.loadAsync(await input.file.arrayBuffer());
  const manifestFile = zip.file("theme.json");
  if (!manifestFile) {
    throw new Error("Theme package is missing theme.json");
  }
  const manifest = normalizeThemeManifest(JSON.parse(await manifestFile.async("text")));
  const image = manifest.yuruChara?.image;
  if (!image) return { manifest };
  const imageFile = zip.file(image);
  if (!imageFile) {
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
      blob: await imageFile.async("blob"),
    },
  };
}

export async function exportThemePackage(theme: UserTheme, asset?: ThemeAsset): Promise<WebThemeArchiveOutput> {
  const zip = new JSZip();
  const manifest = normalizeThemeManifest({
    kind: "moe.bilisound.app.theme",
    version: 1,
    name: theme.name,
    baseTheme: "classic",
    palette: theme.palette,
    yuruChara:
      theme.yuruChara && asset ? { ...theme.yuruChara, image: asset.fileName, imageAssetId: undefined } : undefined,
  });
  zip.file(
    "theme.json",
    JSON.stringify(manifest, null, 2),
  );
  if (asset?.blob) {
    zip.file(asset.fileName, asset.blob);
  }
  return {
    blob: await zip.generateAsync({ type: "blob", mimeType: "application/zip" }),
    mimeType: "application/zip",
    fileName: `${manifest.name}.zip`,
  };
}

function mimeTypeFromFileName(fileName: string): ThemeAsset["mimeType"] | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}
