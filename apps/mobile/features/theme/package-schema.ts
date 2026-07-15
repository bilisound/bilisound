import Color from "colorjs.io";
import { z } from "zod";

import { TAILWIND_SHADES, type ThemePackageManifest } from "./types";

const colorValueSchema = z.string().transform(value => hexFromCssColor(value));

const tailwindScaleSchema = z.object(
  Object.fromEntries(TAILWIND_SHADES.map(shade => [shade, colorValueSchema])) as Record<
    (typeof TAILWIND_SHADES)[number],
    typeof colorValueSchema
  >,
);

export const themePackageManifestSchema = z.object({
  kind: z.literal("moe.bilisound.app.theme"),
  version: z.literal(1),
  name: z.string().trim().min(1).max(80),
  baseTheme: z.literal("classic"),
  palette: z.object({
    primary: tailwindScaleSchema,
    accent: tailwindScaleSchema,
    primaryBase: colorValueSchema.optional(),
    accentBase: colorValueSchema.optional(),
  }),
  yuruChara: z
    .object({
      image: z.string().regex(/^[-_a-zA-Z0-9.]+\.(jpg|jpeg|png|webp)$/),
      imageWidth: z.number().int().positive(),
      imageHeight: z.number().int().positive(),
      align: z.enum(["left", "center", "right"]),
      verticalAlign: z.enum(["top", "center", "bottom"]),
      originalScale: z.number().finite().positive().max(300),
      opacity: z.number().finite().min(0).max(1),
      offsetX: z.number().finite(),
      offsetY: z.number().finite(),
      extractedColors: z.array(colorValueSchema).max(24).optional(),
    })
    .optional(),
});

export function normalizeThemeManifest(input: unknown): ThemePackageManifest {
  return themePackageManifestSchema.parse(input);
}

export function hexFromCssColor(value: string) {
  const color = new Color(value).to("srgb");
  const [r, g, b] = color.coords.map(channel => Math.max(0, Math.min(255, Math.round((channel ?? 0) * 255))));
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function rgbStringFromCssColor(value: string) {
  const hex = hexFromCssColor(value);
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}
