export const TAILWIND_SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const;

export type TailwindShade = (typeof TAILWIND_SHADES)[number];
export type TailwindScale = Readonly<Record<TailwindShade, string>>;

export interface ThemePalette {
  readonly primary: TailwindScale;
  readonly accent: TailwindScale;
}

export type Appearance = "light" | "dark";
export type ThemeName = "classic" | "red" | "user";
export type BilisoundThemeName = `${Appearance}_${ThemeName}`;
