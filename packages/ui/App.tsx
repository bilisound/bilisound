import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "@tamagui/core";

import {
  BilisoundProvider,
  Button,
  Checkbox,
  Label,
  Slider,
  Switch,
  SwitchVisual,
  TextArea,
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [comment, setComment] = useState("");
  const [notify, setNotify] = useState(true);
  const [autoplay, setAutoplay] = useState(true);

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

          <View gap="$4">
            <Text color="$text" fontFamily="$heading" fontSize="$xl" fontWeight="600">
              Guestbook form
            </Text>

            <View flexDirection="row" flexWrap="wrap" gap="$4">
              <View flex={1} minWidth={180} gap="$0">
                <Label htmlFor="guest-name" required>
                  昵称
                </Label>
                <TextInput id="guest-name" value={name} onChangeText={setName} placeholder="怎么称呼你" />
              </View>
              <View flex={1} minWidth={180} gap="$0">
                <Label htmlFor="guest-email" required>
                  邮箱
                </Label>
                <TextInput
                  id="guest-email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  autoCapitalize="none"
                />
              </View>
              <View flex={1} minWidth={180} gap="$0">
                <Label htmlFor="guest-website">网站</Label>
                <TextInput
                  id="guest-website"
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="https://"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View>
              <Label htmlFor="guest-comment" required>
                评论
              </Label>
              <TextArea
                id="guest-comment"
                value={comment}
                onChangeText={setComment}
                placeholder="不适合发到其它博文的留言，可以发到这里"
                rows={3}
              />
            </View>

            <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$5">
              <Button onPress={() => undefined}>发布评论</Button>
              <Checkbox checked={notify} onCheckedChange={setNotify} label="接收邮件通知" />
            </View>
          </View>

          <View gap="$4">
            <Text color="$text" fontFamily="$heading" fontSize="$xl" fontWeight="600">
              Text input
            </Text>
            <TextInput value={query} onChangeText={setQuery} placeholder="Paste a Bilibili URL" />
            <TextInput invalid placeholder="Invalid input preview" />
          </View>

          <View gap="$4">
            <Text color="$text" fontFamily="$heading" fontSize="$xl" fontWeight="600">
              Button variants
            </Text>
            <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$2">
              <Button onPress={() => undefined}>Primary</Button>
              <Button variant="secondary" onPress={() => undefined}>
                Secondary
              </Button>
              <Button variant="ghost" onPress={() => undefined}>
                Ghost
              </Button>
              <Button disabled onPress={() => undefined}>
                Disabled
              </Button>
            </View>
            <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$2">
              <Button variant="link" onPress={() => undefined}>
                Link
              </Button>
            </View>
          </View>

          <View gap="$4">
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

          <View gap="$4">
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
          <View gap="$4">
            <Text color="$text" fontFamily="$heading" fontSize="$xl" fontWeight="600">
              Switch
            </Text>
            <View flexDirection="row" alignItems="center" justifyContent="space-between" gap="$4">
              <Text color="$text" fontFamily="$body" fontSize="$base">
                Semantic control
              </Text>
              <Switch accessibilityLabel="Autoplay next item" checked={autoplay} onCheckedChange={setAutoplay} />
            </View>
            <View
              accessibilityLabel="Autoplay inside settings button"
              accessibilityRole="switch"
              accessibilityState={{ checked: autoplay }}
              render="button"
              role="switch"
              aria-checked={autoplay}
              aria-label="Autoplay inside settings button"
              tabIndex={0}
              onPress={() => setAutoplay(value => !value)}
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              gap="$4"
              padding="$4"
              borderWidth={1}
              borderColor="$border"
              borderRadius={10}
              backgroundColor="$surface"
            >
              <Text color="$text" fontFamily="$body" fontSize="$base" fontWeight="600">
                Parent-owned semantics
              </Text>
              <SwitchVisual checked={autoplay} />
            </View>
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
