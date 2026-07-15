export type BuiltInThemeId = "classic" | "red";
export type UserThemeId = `user:${string}`;
export type ThemeId = BuiltInThemeId | UserThemeId;

export type TailwindShade = "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "950";
export const TAILWIND_SHADES: TailwindShade[] = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];

export type TailwindScale = Record<TailwindShade, string>;

export type YuruCharaAlign = "left" | "center" | "right";
export type YuruCharaVerticalAlign = "top" | "center" | "bottom";

export interface YuruCharaLayout {
  imageAssetId?: string;
  image?: string;
  extractedColors?: string[];
  imageWidth: number;
  imageHeight: number;
  align: YuruCharaAlign;
  verticalAlign: YuruCharaVerticalAlign;
  originalScale: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
}

export interface UserThemePalette {
  primary: TailwindScale;
  accent: TailwindScale;
  primaryBase?: string;
  accentBase?: string;
}

export interface UserTheme {
  id: string;
  name: string;
  version: 1;
  baseTheme: "classic";
  palette: UserThemePalette;
  yuruChara?: YuruCharaLayout;
  createdAt: number;
  updatedAt: number;
}

export interface ThemePackageManifest {
  kind: "moe.bilisound.app.theme";
  version: 1;
  name: string;
  baseTheme: "classic";
  palette: UserThemePalette;
  yuruChara?: Omit<YuruCharaLayout, "imageAssetId">;
}

export interface ThemeAsset {
  id: string;
  themeId: string;
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  uri?: string;
  blob?: Blob;
}

export interface ImportedThemePackage {
  manifest: ThemePackageManifest;
  asset?: Omit<ThemeAsset, "id" | "themeId">;
}
