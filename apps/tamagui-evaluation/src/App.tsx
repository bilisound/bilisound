import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { TamaguiProvider, Text, Theme } from "@tamagui/core";
import { updateTheme } from "@tamagui/theme";

import { generateTailwindScale, TAILWIND_SHADES, type TailwindScale } from "./color-scale";
import { BilisoundButton, Body, Card, Eyebrow, Heading, ScrollView, Title, XStack, YStack } from "./design-system";
import {
  createSemanticTheme,
  getReadableForeground,
  paletteScales,
  tamaguiConfig,
  type AppThemeName,
  type SemanticTheme,
  type UserThemeName,
} from "./tamagui.config";

const themeOrder: UserThemeName[] = ["bilisound", "tailwindRose", "tailwindSky"];
const randomThemeSeeds = ["#14b8a6", "#ec4899", "#0ea5e9", "#a855f7", "#f97316", "#22c55e", "#eab308", "#6366f1"];
const semanticRoles: Array<keyof SemanticTheme> = ["buttonBackground", "buttonBorder", "buttonText"];

export default function App() {
  const colorScheme = useColorScheme();
  const [activeTheme, setActiveTheme] = useState<UserThemeName | "user">("bilisound");
  const [userPalette, setUserPalette] = useState<TailwindScale>(paletteScales.bilisound);
  const [dynamicAccent, setDynamicAccent] = useState("#14b8a6");
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const palette = activeTheme === "user" ? userPalette : paletteScales[activeTheme];
  const themeName = `${scheme}_${activeTheme}` as AppThemeName;
  const activeSemanticTheme = createSemanticTheme(palette, scheme);
  const lightPreview = createSemanticTheme(palette, "light");
  const darkPreview = createSemanticTheme(palette, "dark");

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(activeSemanticTheme.canvas);
  }, [activeSemanticTheme.canvas]);

  function cycleBuiltInTheme() {
    const currentIndex = activeTheme === "user" ? -1 : themeOrder.indexOf(activeTheme);
    setActiveTheme(themeOrder[(currentIndex + 1) % themeOrder.length]);
  }

  function randomizeDynamicTheme() {
    const nextColor = randomThemeSeeds[Math.floor(Math.random() * randomThemeSeeds.length)];
    const generatedPalette = generateTailwindScale(nextColor);

    setDynamicAccent(nextColor);
    setUserPalette(generatedPalette);
    setActiveTheme("user");
    updateTheme({ name: "light_user", theme: createSemanticTheme(generatedPalette, "light") });
    updateTheme({ name: "dark_user", theme: createSemanticTheme(generatedPalette, "dark") });
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={themeName}>
      <Theme name={themeName}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <ScrollView
          role="main"
          backgroundColor="$canvas"
          minHeight="100%"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <YStack
            width="100%"
            maxWidth={920}
            alignSelf="center"
            gap="$7"
            padding="$6"
            paddingVertical="$8"
            $sm={{ padding: "$4" }}
          >
            <YStack gap="$4" maxWidth={760}>
              <Eyebrow>Bilisound / system study 02</Eyebrow>
              <Title>One palette.{"\n"}Two intentions.</Title>
              <Body color="$textMuted" fontSize="$4" lineHeight="$4" maxWidth={680}>
                标准 Tailwind 色阶只负责提供原始颜色。Bilisound 分别为 light 和 dark 声明
                surface、文字、线条和按钮语义， 不再反转 palette，也不继承 Tamagui UI 的默认视觉。
              </Body>
              <XStack flexWrap="wrap" gap="$3" paddingTop="$2">
                <BilisoundButton onPress={cycleBuiltInTheme}>
                  Palette: {activeTheme === "user" ? "user" : activeTheme}
                </BilisoundButton>
                <BilisoundButton variant="secondary" onPress={randomizeDynamicTheme}>
                  Generate user theme
                </BilisoundButton>
              </XStack>
            </YStack>

            <Card>
              <XStack justifyContent="space-between" alignItems="center" gap="$3" flexWrap="wrap">
                <YStack gap="$1">
                  <Eyebrow>Primitive layer</Eyebrow>
                  <Heading>Tailwind 50–950</Heading>
                </YStack>
                <Text color="$textMuted" fontFamily="$body" fontSize="$2">
                  {activeTheme === "user" ? `Generated from ${dynamicAccent}` : "Canonical Tailwind CSS values"}
                </Text>
              </XStack>
              <XStack gap="$2" flexWrap="wrap">
                {TAILWIND_SHADES.map(shade => (
                  <YStack key={`${activeTheme}-${shade}`} gap="$1" alignItems="center">
                    <YStack
                      width={58}
                      height={58}
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="$3"
                      backgroundColor={palette[shade]}
                      borderColor="$border"
                      borderWidth={1}
                    >
                      <Text
                        color={getReadableForeground(palette[shade])}
                        fontFamily="$body"
                        fontSize="$1"
                        fontWeight="700"
                      >
                        {shade}
                      </Text>
                    </YStack>
                  </YStack>
                ))}
              </XStack>
            </Card>

            <YStack gap="$4">
              <YStack gap="$1">
                <Eyebrow>Semantic layer</Eyebrow>
                <Heading>Same scale, independently authored</Heading>
              </YStack>
              <XStack gap="$4" alignItems="stretch" $sm={{ flexDirection: "column" }}>
                <ThemePreview label="Light" theme={lightPreview} />
                <ThemePreview label="Dark" theme={darkPreview} />
              </XStack>
            </YStack>

            <Card>
              <Eyebrow>Runtime theme</Eyebrow>
              <Heading>User themes remain first-class</Heading>
              <Body color="$textMuted">
                用户色仍生成一份标准 50–950 scale；运行时分别生成 light_user 与 dark_user 的语义映射。两套主题共享色阶，
                但不会互相反转。
              </Body>
              <XStack gap="$3" flexWrap="wrap">
                <BilisoundButton onPress={randomizeDynamicTheme}>Randomize {dynamicAccent}</BilisoundButton>
                <BilisoundButton variant="secondary" onPress={() => setActiveTheme("bilisound")}>
                  Reset to Bilisound
                </BilisoundButton>
              </XStack>
            </Card>
          </YStack>
        </ScrollView>
      </Theme>
    </TamaguiProvider>
  );
}

function ThemePreview({ label, theme }: { label: string; theme: SemanticTheme }) {
  return (
    <YStack
      flex={1}
      minWidth={0}
      gap="$4"
      padding="$5"
      borderRadius="$4"
      borderWidth={1}
      borderColor={theme.border}
      backgroundColor={theme.canvas}
    >
      <Text color={theme.textMuted} fontFamily="$body" fontSize="$1" fontWeight="700" letterSpacing={1.4}>
        {label.toUpperCase()}
      </Text>
      <YStack gap="$1">
        <Text color={theme.text} fontFamily="$heading" fontSize="$5" fontWeight="700">
          Listen without noise.
        </Text>
        <Text color={theme.textMuted} fontFamily="$body" fontSize="$2" lineHeight="$2">
          Semantic roles preserve hierarchy without assuming a reversible scale.
        </Text>
      </YStack>
      <YStack
        gap="$2"
        padding="$4"
        borderRadius="$3"
        backgroundColor={theme.surface}
        borderColor={theme.border}
        borderWidth={1}
      >
        {semanticRoles.map(role => (
          <XStack key={role} alignItems="center" justifyContent="space-between" gap="$3">
            <Text color={theme.textMuted} fontFamily="$body" fontSize="$1">
              {role}
            </Text>
            <XStack alignItems="center" gap="$2">
              <Text color={theme.text} fontFamily="$body" fontSize="$1">
                {theme[role]}
              </Text>
              <YStack
                width={18}
                height={18}
                borderRadius="$1"
                backgroundColor={theme[role]}
                borderColor={theme.border}
                borderWidth={1}
              />
            </XStack>
          </XStack>
        ))}
      </YStack>
      <XStack
        alignSelf="flex-start"
        paddingHorizontal="$4"
        minHeight="$5"
        alignItems="center"
        borderRadius="$3"
        borderWidth={1}
        borderColor={theme.buttonBorder}
        backgroundColor={theme.buttonBackground}
      >
        <Text color={theme.buttonText} fontFamily="$body" fontSize="$2" fontWeight="700">
          Play collection
        </Text>
      </XStack>
    </YStack>
  );
}
