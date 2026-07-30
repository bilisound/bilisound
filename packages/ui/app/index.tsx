import { Link } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { Text, View } from "@tamagui/core";

import { Button } from "@bilisound/ui";

export default function IndexRoute() {
  return (
    <View flex={1} backgroundColor="$canvas">
      <ScrollView contentContainerStyle={styles.content}>
        <View gap="$2">
          <Text color="$text" fontFamily="$heading" fontSize="$3xl" fontWeight="700">
            Bilisound UI
          </Text>
          <Text color="$textMuted" fontFamily="$body" fontSize="$base" lineHeight="$base">
            Choose a focused showcase to inspect the native component library or its Expo DOM provider boundary.
          </Text>
        </View>

        <View gap="$3">
          <Link href="/components" asChild>
            <Button icon="tabler:arrows-right" iconPosition="end">
              Component demo
            </Button>
          </Link>
          <Link href="/expo-dom" asChild>
            <Button color="accent" icon="tabler:arrows-right" iconPosition="end">
              Expo DOM demo
            </Button>
          </Link>
        </View>
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
    paddingBottom: 48,
    paddingTop: 32,
  },
});
