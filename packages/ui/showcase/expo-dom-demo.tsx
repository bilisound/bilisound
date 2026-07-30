import { ScrollView, StyleSheet } from "react-native";
import { Text, View } from "@tamagui/core";

import DomProviderExample from "./dom-provider-example";
import { useShowcaseTheme } from "./showcase-theme";

export default function ExpoDomDemo() {
  const { appearance, theme, userPalette } = useShowcaseTheme();

  return (
    <View flex={1} backgroundColor="$canvas">
      <ScrollView contentContainerStyle={styles.content}>
        <View gap="$2">
          <Text color="$text" fontFamily="$heading" fontSize="$3xl" fontWeight="700">
            Expo DOM demo
          </Text>
          <Text color="$textMuted" fontFamily="$body" fontSize="$base" lineHeight="$base">
            A separate DOM root using BilisoundDomProvider and the active showcase theme.
          </Text>
        </View>

        <DomProviderExample
          dom={{ matchContents: true, scrollEnabled: false }}
          theme={{
            appearance,
            theme,
            userPalette: theme === "user" ? userPalette : undefined,
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 32,
    paddingHorizontal: 20,
    paddingBottom: 96,
    paddingTop: 32,
  },
});
