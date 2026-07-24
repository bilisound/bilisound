import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "@tamagui/core";

import {
  BilisoundProvider,
  Button,
  Slider,
  TextInput,
  classicPalette,
  redPalette,
  updateUserTheme,
} from "@bilisound/ui";
import type { Appearance, ThemeName } from "@bilisound/ui";

const previewUserPalette = {
  primary: redPalette.primary,
  accent: classicPalette.accent,
};

export default function App() {
  const [appearance, setAppearance] = useState<Appearance>("light");
  const [theme, setTheme] = useState<ThemeName>("classic");
  const [query, setQuery] = useState("");
  const [volume, setVolume] = useState([64]);

  const showUserTheme = () => {
    updateUserTheme(previewUserPalette);
    setTheme("user");
  };

  return (
    <BilisoundProvider appearance={appearance} theme={theme}>
      <StatusBar style={appearance === "dark" ? "light" : "dark"} />
      <View flex={1} backgroundColor="$canvas">
        <ScrollView contentContainerStyle={styles.content}>
          <View gap="$2">
            <Text color="$text" fontFamily="$heading" fontSize="$3xl" fontWeight="700">
              Bilisound UI
            </Text>
            <Text color="$textMuted" fontFamily="$body" fontSize="$base" lineHeight="$base">
              Headless Tamagui components backed by Bilisound design tokens.
            </Text>
          </View>

          <View flexDirection="row" flexWrap="wrap" gap="$2">
            <Button onPress={() => setAppearance(current => (current === "light" ? "dark" : "light"))}>
              {appearance === "light" ? "Use dark" : "Use light"}
            </Button>
            <Button variant="secondary" onPress={() => setTheme("classic")}>
              Classic
            </Button>
            <Button variant="secondary" onPress={() => setTheme("red")}>
              Red
            </Button>
            <Button variant="secondary" onPress={showUserTheme}>
              User theme
            </Button>
          </View>

          <View gap="$3">
            <Text color="$text" fontFamily="$heading" fontSize="$xl" fontWeight="600">
              Text input
            </Text>
            <TextInput value={query} onChangeText={setQuery} placeholder="Paste a Bilibili URL" />
            <TextInput invalid placeholder="Invalid input preview" />
          </View>

          <View gap="$3">
            <Text color="$text" fontFamily="$heading" fontSize="$xl" fontWeight="600">
              Button variants
            </Text>
            <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$2">
              <Button onPress={() => undefined}>Primary</Button>
              <Button variant="secondary" onPress={() => undefined}>
                Secondary
              </Button>
              <Button disabled onPress={() => undefined}>
                Disabled
              </Button>
            </View>
          </View>

          <View gap="$3">
            <Text color="$text" fontFamily="$heading" fontSize="$xl" fontWeight="600">
              Button sizes
            </Text>
            <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$2">
              <Button size="sm" onPress={() => undefined}>
                Small
              </Button>
              <Button size="md" onPress={() => undefined}>
                Medium
              </Button>
              <Button size="lg" onPress={() => undefined}>
                Large
              </Button>
            </View>
          </View>

          <View gap="$3">
            <View flexDirection="row" justifyContent="space-between">
              <Text color="$text" fontFamily="$heading" fontSize="$xl" fontWeight="600">
                Slider
              </Text>
              <Text color="$textMuted" fontFamily="$body" fontSize="$sm">
                {volume[0]}%
              </Text>
            </View>
            <Slider accessibilityLabel="Volume" value={volume} onValueChange={setVolume} />
          </View>
        </ScrollView>
      </View>
    </BilisoundProvider>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 32,
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 64,
  },
});
