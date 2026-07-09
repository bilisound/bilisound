import Color from "colorjs.io";

export type TailwindShade = "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "950";
export type TailwindScale = Record<TailwindShade, string>;
export type BilisoundShade = TailwindShade | "975";
export type BilisoundScale = Record<BilisoundShade, string>;

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
export const BILISOUND_SHADES: BilisoundShade[] = [...TAILWIND_SHADES, "975"];

const lightEndLightness = 0.97;
const darkEndLightness = 0.18;
const lightEndChromaMultiplier = 0.18;
const darkEndChromaMultiplier = 0.42;

export function generateTailwindScale(baseColor: string): TailwindScale {
  const normalizedBase = hexFromCssColor(baseColor);
  const oklch = new Color(normalizedBase).to("oklch");
  const baseLightness = oklch.coords[0] ?? 0.56;
  const baseChroma = oklch.coords[1] ?? 0;
  const baseHue = Number.isFinite(oklch.coords[2]) ? oklch.coords[2] : 0;

  const sourceShade = getClosestSourceShade(baseLightness);
  const sourceIndex = TAILWIND_SHADES.indexOf(sourceShade);
  const lastIndex = TAILWIND_SHADES.length - 1;
  const lightLightness = Math.max(lightEndLightness, baseLightness);
  const darkLightness = Math.min(darkEndLightness, baseLightness);
  const lightChroma = baseChroma * lightEndChromaMultiplier;
  const darkChroma = baseChroma * darkEndChromaMultiplier;

  return Object.fromEntries(
    TAILWIND_SHADES.map((shade, index) => {
      const beforeSource = index <= sourceIndex;
      const progress = beforeSource
        ? getSegmentProgress(index, 0, sourceIndex)
        : getSegmentProgress(index, sourceIndex, lastIndex);
      const lightness = beforeSource
        ? lerp(lightLightness, baseLightness, progress)
        : lerp(baseLightness, darkLightness, progress);
      const chroma = Math.max(
        0,
        Math.min(beforeSource ? lerp(lightChroma, baseChroma, progress) : lerp(baseChroma, darkChroma, progress), 0.32),
      );
      const color = new Color("oklch", [lightness, chroma, baseHue]).to("srgb" as never);
      return [shade, hexFromSrgbCoords(Array.from(color.coords).map(channel => channel ?? 0))];
    }),
  ) as TailwindScale;
}

export function generateBilisoundScale(baseColor: string): BilisoundScale {
  const tailwindScale = generateTailwindScale(baseColor);
  return {
    ...tailwindScale,
    "975": deriveShade975(tailwindScale),
  };
}

export function reverseTailwindScale(scale: TailwindScale): TailwindScale {
  const reversed = [...TAILWIND_SHADES].reverse();
  return Object.fromEntries(
    TAILWIND_SHADES.map((shade, index) => [shade, scale[reversed[index] as TailwindShade]]),
  ) as TailwindScale;
}

export function bilisoundScaleToTamaguiPalette(scale: BilisoundScale, scheme: "light" | "dark") {
  const values = BILISOUND_SHADES.map(shade => scale[shade]);
  return scheme === "dark" ? [...values].reverse() : values;
}

export function hexFromCssColor(value: string) {
  const color = new Color(value).to("srgb");
  const [r, g, b] = color.coords.map(channel => Math.max(0, Math.min(255, Math.round((channel ?? 0) * 255))));
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, "0")).join("")}`;
}

function getClosestSourceShade(lightness: number): TailwindShade {
  if (lightness >= 0.82) return "300";
  if (lightness >= 0.72) return "400";
  if (lightness >= 0.56) return "500";
  if (lightness >= 0.46) return "600";
  if (lightness >= 0.36) return "700";
  if (lightness >= 0.28) return "800";
  return "900";
}

function deriveShade975(scale: TailwindScale) {
  const color = new Color(scale[950]).to("oklch");
  const lightness = Math.max(0.08, (color.coords[0] ?? 0.18) * 0.72);
  const chroma = Math.max(0, (color.coords[1] ?? 0) * 0.7);
  const hue = Number.isFinite(color.coords[2]) ? color.coords[2] : 0;
  const srgb = new Color("oklch", [lightness, chroma, hue]).to("srgb" as never);
  return hexFromSrgbCoords(Array.from(srgb.coords).map(channel => channel ?? 0));
}

function getSegmentProgress(index: number, startIndex: number, endIndex: number) {
  if (startIndex === endIndex) return 1;
  return (index - startIndex) / (endIndex - startIndex);
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function hexFromSrgbCoords(coords: number[]) {
  return `#${coords
    .map(channel => Math.max(0, Math.min(255, Math.round(channel * 255))))
    .map(channel => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}
