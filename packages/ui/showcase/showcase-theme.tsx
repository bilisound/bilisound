import Color from "colorjs.io";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "@tamagui/core";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BilisoundProvider, Button, TAILWIND_SHADES, updateUserTheme } from "@bilisound/ui";
import type { Appearance, TailwindScale, TailwindShade, ThemeName, ThemePalette } from "@bilisound/ui";

interface ShowcaseThemeContextValue {
  appearance: Appearance;
  theme: ThemeName;
  userPalette?: ThemePalette;
}

const ShowcaseThemeContext = createContext<ShowcaseThemeContextValue | null>(null);

const userThemeBaseColors = [
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
] as const;

const lightEndLightness = 0.97;
const darkEndLightness = 0.18;
const lightEndChromaMultiplier = 0.18;
const darkEndChromaMultiplier = 0.42;

export function ShowcaseThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>("light");
  const [theme, setTheme] = useState<ThemeName>("classic");
  const [userPalette, setUserPalette] = useState<ThemePalette>();

  const showUserTheme = () => {
    const primaryIndex = Math.floor(Math.random() * userThemeBaseColors.length);
    const accentOffset = 1 + Math.floor(Math.random() * (userThemeBaseColors.length - 1));
    const palette = {
      primary: generateTailwindScale(userThemeBaseColors[primaryIndex]),
      accent: generateTailwindScale(userThemeBaseColors[(primaryIndex + accentOffset) % userThemeBaseColors.length]),
    };
    updateUserTheme(palette);
    setUserPalette(palette);
    setTheme("user");
  };

  return (
    <SafeAreaProvider>
      <BilisoundProvider appearance={appearance} theme={theme}>
        <StatusBar style={appearance === "dark" ? "light" : "dark"} />
        <ShowcaseThemeContext.Provider value={{ appearance, theme, userPalette }}>
          <View flex={1} backgroundColor="$canvas">
            {children}
          </View>
          <View
            position="absolute"
            right="$4"
            bottom="$4"
            flexDirection="row"
            flexWrap="wrap"
            justifyContent="flex-end"
            gap="$2"
            pointerEvents="box-none"
          >
            <Button size="sm" onPress={() => setAppearance(current => (current === "light" ? "dark" : "light"))}>
              {appearance === "light" ? "Dark" : "Light"}
            </Button>
            <Button size="sm" variant="outline" color="accent" onPress={() => setTheme("classic")}>
              Classic
            </Button>
            <Button size="sm" variant="outline" color="accent" onPress={() => setTheme("red")}>
              Red
            </Button>
            <Button size="sm" variant="outline" color="accent" onPress={showUserTheme}>
              User
            </Button>
          </View>
        </ShowcaseThemeContext.Provider>
      </BilisoundProvider>
    </SafeAreaProvider>
  );
}

export function useShowcaseTheme() {
  const context = useContext(ShowcaseThemeContext);
  if (!context) {
    throw new Error("useShowcaseTheme must be used inside ShowcaseThemeProvider");
  }
  return context;
}

function generateTailwindScale(baseColor: string): TailwindScale {
  const oklch = new Color(baseColor).to("oklch");
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
      if (shade === sourceShade) return [shade, baseColor];

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

function getClosestSourceShade(lightness: number): TailwindShade {
  if (lightness >= 0.82) return "300";
  if (lightness >= 0.72) return "400";
  if (lightness >= 0.56) return "500";
  if (lightness >= 0.46) return "600";
  if (lightness >= 0.36) return "700";
  if (lightness >= 0.28) return "800";
  return "900";
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
