import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import {
  Button,
  H1,
  H2,
  Paragraph,
  ScrollView,
  Separator,
  Square,
  TamaguiProvider,
  Text,
  Theme,
  XStack,
  YStack,
} from "tamagui";
import { updateTheme } from "@tamagui/theme";

import { bilisoundScaleToTamaguiPalette, generateBilisoundScale, hexFromCssColor } from "./color-scale";
import { createPaletteTheme, paletteScales, tamaguiConfig, type UserThemeName } from "./tamagui.config";

const themeOrder: UserThemeName[] = ["bilisound", "tailwindRose", "tailwindSky"];
const randomThemeSeeds = ["#14b8a6", "#ec4899", "#0ea5e9", "#a855f7", "#f97316", "#22c55e", "#eab308", "#6366f1"];

export default function App() {
  const colorScheme = useColorScheme();
  const [accentIndex, setAccentIndex] = useState(0);
  const [activeTheme, setActiveTheme] = useState<UserThemeName | "user">("bilisound");
  const [userPalette, setUserPalette] = useState<Record<"light" | "dark", string[]>>({
    light: paletteScales.bilisound.light,
    dark: paletteScales.bilisound.dark,
  });
  const [dynamicAccent, setDynamicAccent] = useState("#14b8a6");
  const baseTheme = colorScheme === "dark" ? "dark" : "light";
  const accentTheme = themeOrder[accentIndex];
  const palette = activeTheme === "user" ? userPalette[baseTheme] : paletteScales[activeTheme][baseTheme];

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette[0]);
  }, [palette]);

  function cycleAccentTheme() {
    setAccentIndex(value => {
      const nextIndex = (value + 1) % themeOrder.length;
      setActiveTheme(themeOrder[nextIndex]);
      return nextIndex;
    });
  }

  function randomizeDynamicTheme() {
    const nextColor = hexFromCssColor(sampleAccentColor());
    const generatedScale = generateBilisoundScale(nextColor);
    const lightPalette = bilisoundScaleToTamaguiPalette(generatedScale, "light");
    const darkPalette = bilisoundScaleToTamaguiPalette(generatedScale, "dark");

    setDynamicAccent(nextColor);
    setUserPalette({ light: lightPalette, dark: darkPalette });
    setActiveTheme("user");
    updateTheme({
      name: "light_user",
      theme: createPaletteTheme(lightPalette, "light"),
    });
    updateTheme({
      name: "dark_user",
      theme: createPaletteTheme(darkPalette, "dark"),
    });
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={baseTheme}>
      <Theme name={baseTheme}>
        <Theme name={activeTheme}>
          <StatusBar style={baseTheme === "dark" ? "light" : "dark"} />
          <ScrollView backgroundColor="$background" minHeight="100%">
            <YStack flex={1} gap="$5" padding="$5" paddingTop="$8" maxWidth={760} width="100%" alignSelf="center">
              <YStack gap="$3">
                <Text color="$placeholderColor" fontSize="$3" fontWeight="700" textTransform="uppercase">
                  Bilisound v3 UI spike
                </Text>
                <H1 color="$color" size="$10">
                  Tamagui evaluation
                </H1>
                <Paragraph color="$color" size="$5" lineHeight="$5">
                  这个隔离项目验证 Tamagui UI、Tailwind 调色板映射、用户主题和运行时换肤，不碰现有 mobile 业务边界。
                </Paragraph>
              </YStack>

              <YStack
                gap="$4"
                backgroundColor="$backgroundHover"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius="$6"
                padding="$5"
              >
                <H2 color="$color" size="$7">
                  Base integration
                </H2>
                <Paragraph color="$color" lineHeight="$4">
                  当前根主题跟随系统色彩模式，active theme 使用 Tamagui sub-theme 组合：{baseTheme}_{activeTheme}。
                </Paragraph>
                <XStack flexWrap="wrap" gap="$3">
                  <Button onPress={cycleAccentTheme}>Built-in theme: {accentTheme}</Button>
                  <Button onPress={randomizeDynamicTheme}>Random full theme</Button>
                </XStack>
              </YStack>

              <YStack
                gap="$4"
                backgroundColor="$background"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius="$6"
                padding="$5"
              >
                <H2 color="$color" size="$7">
                  Tailwind palette compatibility
                </H2>
                <Paragraph color="$color" lineHeight="$4">
                  Tailwind 50-950 色阶可以通过 Bilisound 975 迁移成 12-step palette，再生成
                  background、color、borderColor 等 tamagui/ui 约定键。
                </Paragraph>
                <XStack gap="$2" flexWrap="wrap">
                  {palette.map((color, index) => (
                    <Square
                      key={`${accentTheme}-${color}`}
                      size={36}
                      borderRadius="$3"
                      style={{ backgroundColor: color }}
                    >
                      <Text color={index > 5 ? "#ffffff" : "#0f172a"} fontSize="$1" fontWeight="700">
                        {index + 1}
                      </Text>
                    </Square>
                  ))}
                </XStack>
              </YStack>

              <YStack
                gap="$4"
                backgroundColor="$background"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius="$6"
                padding="$5"
              >
                <H2 color="$color" size="$7">
                  Runtime user theme
                </H2>
                <Paragraph color="$color" lineHeight="$4">
                  updateTheme 可以在客户端替换主题片段，适合用户自定义主题预览；持久化后仍应在启动时生成稳定主题。
                </Paragraph>
                <Separator borderColor="$borderColor" />
                <Text color="$color">Current dynamic seed: {dynamicAccent}</Text>
              </YStack>
            </YStack>
          </ScrollView>
        </Theme>
      </Theme>
    </TamaguiProvider>
  );
}

function sampleAccentColor() {
  return randomThemeSeeds[Math.floor(Math.random() * randomThemeSeeds.length)];
}
