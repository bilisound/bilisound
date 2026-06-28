import { hexFromCssColor } from "./package-schema";

export interface ExtractThemeBaseColorsInput {
  file: File | Blob;
}

export interface ExtractedThemeBaseColors {
  primaryBase: string;
  accentBase: string;
  debugColors?: ExtractedThemeDebugColor[];
}

export interface ExtractedThemeDebugColor {
  label: string;
  color: string;
  weight?: number;
  count?: number;
  selectedAs?: "primary" | "accent";
}

export async function extractThemeBaseColors(input: ExtractThemeBaseColorsInput): Promise<ExtractedThemeBaseColors> {
  const image = await loadImage(input.file);
  const canvas = document.createElement("canvas");
  const size = 48;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return { primaryBase: "#14b8a6", accentBase: "#3b82f6" };
  }
  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    if (brightness < 24 || brightness > 236) continue;
    const key = `${Math.round(r / 32)}-${Math.round(g / 32)}-${Math.round(b / 32)}`;
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  const sortedBuckets = Array.from(buckets.values()).sort((a, b) => b.count - a.count);
  const colors = sortedBuckets.map(bucket =>
    hexFromCssColor(
      `rgb(${Math.round(bucket.r / bucket.count)} ${Math.round(bucket.g / bucket.count)} ${Math.round(bucket.b / bucket.count)})`,
    ),
  );
  const primaryBase = colors[0] ?? "#14b8a6";
  const accentBase = colors.find(color => color !== colors[0]) ?? colors[0] ?? "#3b82f6";
  const totalCount = sortedBuckets.reduce((sum, bucket) => sum + bucket.count, 0);

  return {
    primaryBase,
    accentBase,
    debugColors: sortedBuckets.slice(0, 12).map((bucket, index) => {
      const color = colors[index];
      const selectedAs = color === primaryBase ? "primary" : color === accentBase ? "accent" : undefined;
      return {
        label: `bucket ${index + 1}`,
        color,
        count: bucket.count,
        weight: totalCount > 0 ? bucket.count / totalCount : undefined,
        ...(selectedAs ? { selectedAs } : {}),
      };
    }),
  };
}

function loadImage(file: File | Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = error => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    image.src = url;
  });
}
