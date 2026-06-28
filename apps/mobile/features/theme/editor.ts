import { generateTailwindScale } from "./color-scale";
import type { ThemeAsset, UserTheme, YuruCharaLayout } from "./types";

export interface YuruCharaRenderMetrics {
  width: number;
  height: number;
  contentFit: "cover" | "contain" | "fill";
  usesFullscreenFrame: boolean;
}

export function buildSavedUserTheme(
  theme: UserTheme,
  input: { name: string; primaryBase: string; accentBase: string; updatedAt: number },
): UserTheme {
  const name = normalizeThemeName(input.name);

  return {
    ...theme,
    name,
    palette: {
      primary: generateTailwindScale(input.primaryBase),
      accent: generateTailwindScale(input.accentBase),
    },
    updatedAt: input.updatedAt,
  };
}

export function getYuruCharaAssetId(themeId: string): string {
  return `${themeId}-yuru-chara`;
}

export function createYuruCharaRemovalDraft(theme: UserTheme): UserTheme {
  return {
    ...theme,
    yuruChara: undefined,
  };
}

export function createYuruCharaUploadDraft(
  theme: UserTheme,
  input: {
    assetId: string;
    imageSize: { width: number; height: number };
    extractedColors: string[];
  },
): UserTheme {
  return {
    ...theme,
    yuruChara: withYuruCharaDefaults(theme, {
      imageAssetId: input.assetId,
      imageWidth: input.imageSize.width,
      imageHeight: input.imageSize.height,
      originalScale: 100,
      extractedColors: input.extractedColors,
    }),
  };
}

export function removeYuruCharaFromTheme(theme: UserTheme, updatedAt: number): UserTheme {
  return {
    ...theme,
    yuruChara: undefined,
    updatedAt,
  };
}

function normalizeThemeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Theme name is required");
  }
  if (trimmed.length > 80) {
    throw new Error("Theme name must be at most 80 characters");
  }
  return trimmed;
}

export function withYuruCharaDefaults(theme: UserTheme, patch: Partial<YuruCharaLayout> = {}): YuruCharaLayout {
  return {
    imageAssetId: theme.yuruChara?.imageAssetId,
    extractedColors: theme.yuruChara?.extractedColors,
    imageWidth: theme.yuruChara?.imageWidth ?? 0,
    imageHeight: theme.yuruChara?.imageHeight ?? 0,
    align: theme.yuruChara?.align ?? "right",
    verticalAlign: theme.yuruChara?.verticalAlign ?? "bottom",
    originalScale: theme.yuruChara?.originalScale ?? 100,
    opacity: theme.yuruChara?.opacity ?? 0.4,
    offsetX: theme.yuruChara?.offsetX ?? 0,
    offsetY: theme.yuruChara?.offsetY ?? 0,
    ...patch,
  };
}

export function getYuruCharaRenderMetrics(
  layout: YuruCharaLayout,
  _frame: { width: number; height: number },
  fallbackImageSize?: { width: number; height: number } | null,
): YuruCharaRenderMetrics {
  const imageWidth = layout.imageWidth > 0 ? layout.imageWidth : (fallbackImageSize?.width ?? 0);
  const imageHeight = layout.imageHeight > 0 ? layout.imageHeight : (fallbackImageSize?.height ?? 0);
  const scale = clampOriginalScale(layout.originalScale, getMinOriginalScaleForOnePixel(imageWidth, imageHeight)) / 100;

  return {
    width: Math.round(Math.max(1, imageWidth * scale)),
    height: Math.round(Math.max(1, imageHeight * scale)),
    contentFit: "fill",
    usesFullscreenFrame: false,
  };
}

export function clampOriginalScale(value: number, minScale = 5): number {
  "worklet";
  if (!Number.isFinite(value)) return 100;
  return Math.min(300, Math.max(minScale, value));
}

export function getMinOriginalScaleForOnePixel(imageWidth: number, imageHeight: number): number {
  "worklet";
  const maxDimension = Math.max(imageWidth, imageHeight);
  if (!Number.isFinite(maxDimension) || maxDimension <= 0) return 0.001;
  return 100 / maxDimension;
}

export function clampYuruCharaOpacity(value: number): number {
  if (!Number.isFinite(value)) return 0.4;
  return Math.min(1, Math.max(0, Math.round(value / 0.005) * 0.005));
}

export function createThemeAssetPreview(
  asset: Pick<ThemeAsset, "uri" | "blob"> | null | undefined,
  createObjectURL?: (blob: Blob) => string,
  revokeObjectURL?: (url: string) => void,
): { uri: string | null; dispose: () => void } {
  if (asset?.uri) {
    return { uri: asset.uri, dispose: () => undefined };
  }
  if (!asset?.blob) {
    return { uri: null, dispose: () => undefined };
  }
  const createPreviewUrl = createObjectURL ?? globalThis.URL?.createObjectURL?.bind(globalThis.URL);
  const revokePreviewUrl = revokeObjectURL ?? globalThis.URL?.revokeObjectURL?.bind(globalThis.URL);
  if (!createPreviewUrl || !revokePreviewUrl) {
    throw new Error("Blob preview URLs are not supported in this runtime");
  }
  const uri = createPreviewUrl(asset.blob);
  return { uri, dispose: () => revokePreviewUrl(uri) };
}
