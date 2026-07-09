import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { Button, H1, H2, Paragraph, ScrollView, Separator, Square, TamaguiProvider, Text, Theme, XStack, YStack } from "tamagui";
import { updateTheme } from "@tamagui/theme";

import { paletteScales, tamaguiConfig, type UserThemeName } from "./tamagui.config";

const themeOrder: UserThemeName[] = ["bilisound", "tailwindRose", "tailwindSky"];

export default function App() {
  const colorScheme = useColorScheme();
  const [accentIndex, setAccentIndex] = useState(0);
  const [dynamicAccent, setDynamicAccent] = useState("#14b8a6");
  const baseTheme = colorScheme === "dark" ? "dark" : "light";
  const accentTheme = themeOrder[accentIndex];
  const palette = paletteScales[accentTheme][baseTheme];

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette[0]);
  }, [palette]);

  function cycleAccentTheme() {
    setAccentIndex((value) => (value + 1) % themeOrder.length);
  }

  function randomizeDynamicTheme() {
    const nextColor = sampleAccentColor();
    setDynamicAccent(nextColor);
    updateTheme({
      name: `${baseTheme}_user`,
      theme: {
        background: nextColor,
        backgroundHover: nextColor,
        backgroundPress: nextColor,
        backgroundFocus: nextColor,
        borderColor: nextColor,
        borderColorHover: nextColor,
        borderColorPress: nextColor,
        borderColorFocus: nextColor,
        color: baseTheme === "dark" ? "#0f172a" : "#ffffff",
      },
    });
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={baseTheme}>
      <Theme name={baseTheme}>
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
                这个隔离项目验证 Tamagui UI、Tailwind 调色板映射、用户主题和运行时换肤，不碰现有 mobile
                业务边界。
              </Paragraph>
            </YStack>

            <YStack gap="$4" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1} borderRadius="$6" padding="$5">
              <H2 color="$color" size="$7">
                Base integration
              </H2>
              <Paragraph color="$color" lineHeight="$4">
                当前根主题跟随系统色彩模式，accent theme 使用 Tamagui sub-theme 组合：{baseTheme}_{accentTheme}。
              </Paragraph>
              <XStack flexWrap="wrap" gap="$3">
                <Button theme={accentTheme} onPress={cycleAccentTheme}>
                  Accent: {accentTheme}
                </Button>
                <Button theme="user" onPress={randomizeDynamicTheme}>
                  Dynamic user color
                </Button>
              </XStack>
            </YStack>

            <Theme name={accentTheme}>
              <YStack gap="$4" backgroundColor="$background" borderColor="$borderColor" borderWidth={1} borderRadius="$6" padding="$5">
                <H2 color="$color" size="$7">
                  Tailwind palette compatibility
                </H2>
                <Paragraph color="$color" lineHeight="$4">
                  Tailwind 50-950 色阶可以规整成 Tamagui 的 12-step palette，再生成 background、color、borderColor
                  等 tamagui/ui 约定键。
                </Paragraph>
                <XStack gap="$2" flexWrap="wrap">
                  {palette.map((color, index) => (
                    <Square key={`${accentTheme}-${color}`} size={36} borderRadius="$3" style={{ backgroundColor: color }}>
                      <Text color={index > 5 ? "#ffffff" : "#0f172a"} fontSize="$1" fontWeight="700">
                        {index + 1}
                      </Text>
                    </Square>
                  ))}
                </XStack>
              </YStack>
            </Theme>

            <Theme name="user">
              <YStack gap="$4" backgroundColor="$background" borderColor="$borderColor" borderWidth={1} borderRadius="$6" padding="$5">
                <H2 color="$color" size="$7">
                  Runtime user theme
                </H2>
                <Paragraph color="$color" lineHeight="$4">
                  updateTheme 可以在客户端替换主题片段，适合用户自定义主题预览；持久化后仍应在启动时生成稳定主题。
                </Paragraph>
                <Separator borderColor="$borderColor" />
                <Text color="$color">Current dynamic color: {dynamicAccent}</Text>
              </YStack>
            </Theme>
          </YStack>
        </ScrollView>
      </Theme>
    </TamaguiProvider>
  );
}

function sampleAccentColor() {
  const colors = ["#14b8a6", "#ec4899", "#0ea5e9", "#a855f7", "#f97316", "#22c55e"];
  return colors[Math.floor(Math.random() * colors.length)];
}
