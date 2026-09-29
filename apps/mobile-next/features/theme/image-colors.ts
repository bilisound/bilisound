import ImageColors from "react-native-image-colors";

export interface ExtractThemeBaseColorsInput {
  uri: string;
}

export interface ExtractedThemeBaseColors {
  primaryBase: string;
  accentBase: string;
  debugColors?: string[];
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
      debugColors: getNativeDebugColors(result),
    };
  }

  if (result.platform === "ios") {
    const primaryBase = result.primary ?? result.background ?? "#14b8a6";
    const accentBase = result.secondary ?? result.detail ?? result.primary ?? "#3b82f6";
    return {
      primaryBase,
      accentBase,
      debugColors: getNativeDebugColors(result),
    };
  }

  return {
    primaryBase: "#14b8a6",
    accentBase: "#3b82f6",
  };
}

function getNativeDebugColors(result: object): string[] {
  return nativeDebugColorLabels.flatMap(label => {
    const color = (result as Partial<Record<(typeof nativeDebugColorLabels)[number], string>>)[label];
    return color ? [color] : [];
  });
}
