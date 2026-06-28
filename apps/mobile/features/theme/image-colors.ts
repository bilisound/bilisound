import ImageColors from "react-native-image-colors";

export interface ExtractThemeBaseColorsInput {
  uri: string;
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

const nativeDebugColorLabels = [
  "vibrant",
  "lightVibrant",
  "dominant",
  "average",
  "primary",
  "secondary",
  "background",
  "detail",
] as const;

export async function extractThemeBaseColors(input: ExtractThemeBaseColorsInput): Promise<ExtractedThemeBaseColors> {
  const result = await ImageColors.getColors(input.uri, {
    fallback: "#14b8a6",
    cache: false,
    key: input.uri,
  });

  if (result.platform === "android") {
    const primaryBase = result.vibrant ?? result.dominant ?? "#14b8a6";
    const accentBase = result.lightVibrant ?? result.average ?? result.vibrant ?? "#3b82f6";
    return {
      primaryBase,
      accentBase,
      debugColors: getNativeDebugColors(result, primaryBase, accentBase),
    };
  }

  if (result.platform === "ios") {
    const primaryBase = result.primary ?? result.background ?? "#14b8a6";
    const accentBase = result.secondary ?? result.detail ?? result.primary ?? "#3b82f6";
    return {
      primaryBase,
      accentBase,
      debugColors: getNativeDebugColors(result, primaryBase, accentBase),
    };
  }

  return {
    primaryBase: "#14b8a6",
    accentBase: "#3b82f6",
  };
}

function getNativeDebugColors(result: object, primaryBase: string, accentBase: string): ExtractedThemeDebugColor[] {
  return nativeDebugColorLabels.flatMap(label => {
    const color = (result as Partial<Record<(typeof nativeDebugColorLabels)[number], string>>)[label];
    if (!color) return [];
    const selectedAs = color === primaryBase ? "primary" : color === accentBase ? "accent" : undefined;
    return [{ label, color, ...(selectedAs ? { selectedAs } : {}) }];
  });
}
