import Color from "colorjs.io";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "@tamagui/core";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  ActionMenu,
  AlertDialog,
  AlertDialogAction,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPortal,
  AlertDialogTitle,
  BilisoundProvider,
  Button,
  Checkbox,
  Label,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPortal,
  ModalTitle,
  Slider,
  Switch,
  SwitchVisual,
  TextArea,
  TextInput,
  TAILWIND_SHADES,
  updateUserTheme,
} from "@bilisound/ui";
import type { Appearance, TailwindScale, TailwindShade, ThemeName } from "@bilisound/ui";

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

function pickUserThemeBaseColors() {
  const primaryIndex = Math.floor(Math.random() * userThemeBaseColors.length);
  const accentOffset = 1 + Math.floor(Math.random() * (userThemeBaseColors.length - 1));
  return {
    primaryBase: userThemeBaseColors[primaryIndex],
    accentBase: userThemeBaseColors[(primaryIndex + accentOffset) % userThemeBaseColors.length],
  };
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
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const showUserTheme = () => {
    const { primaryBase, accentBase } = pickUserThemeBaseColors();
    updateUserTheme({
      primary: generateTailwindScale(primaryBase),
      accent: generateTailwindScale(accentBase),
    });
    setTheme("user");
  };

  return (
    <SafeAreaProvider>
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
              <Button variant="outline" color="accent" onPress={() => setTheme("classic")}>
                Classic
              </Button>
              <Button variant="outline" color="accent" onPress={() => setTheme("red")}>
                Red
              </Button>
              <Button variant="outline" color="accent" onPress={showUserTheme}>
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
              {(["solid", "outline", "ghost", "link"] as const).map(variant => (
                <View key={variant} flexDirection="row" flexWrap="wrap" alignItems="center" gap="$2">
                  <Button variant={variant} onPress={() => undefined}>
                    {variant} primary
                  </Button>
                  <Button variant={variant} color="accent" onPress={() => undefined}>
                    {variant} accent
                  </Button>
                  <Button variant={variant} color="neutral" onPress={() => undefined}>
                    {variant} neutral
                  </Button>
                </View>
              ))}
              <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$2">
                <Button disabled onPress={() => undefined}>
                  Disabled
                </Button>
              </View>
            </View>

            <View gap="$4">
              <Text color="$text" fontFamily="$heading" fontSize="$xl" fontWeight="600">
                Action menu
              </Text>
              <View alignItems="flex-start">
                <Button onPress={() => setActionMenuOpen(true)}>Open action menu</Button>
              </View>
              <ActionMenu
                open={actionMenuOpen}
                onOpenChange={setActionMenuOpen}
                menuItems={[
                  {
                    id: "add",
                    text: "添加到歌单",
                    icon: "fa6-solid:plus",
                    iconSize: 16,
                    action: () => setActionMenuOpen(false),
                  },
                  {
                    id: "edit",
                    text: "编辑信息",
                    icon: "fa6-solid:pen",
                    iconSize: 16,
                    action: () => setActionMenuOpen(false),
                  },
                  {
                    id: "download",
                    text: "下载",
                    icon: "fa6-solid:download",
                    action: () => setActionMenuOpen(false),
                  },
                  {
                    id: "delete",
                    text: "删除",
                    icon: "fa6-solid:trash-can",
                    disabled: true,
                    action: () => undefined,
                  },
                  {
                    id: "cancel",
                    text: "取消",
                    icon: "fa6-solid:xmark",
                    iconSize: 20,
                    action: () => setActionMenuOpen(false),
                  },
                ]}
              />
            </View>

            <View gap="$4">
              <Text color="$text" fontFamily="$heading" fontSize="$xl" fontWeight="600">
                Dialogs
              </Text>
              <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$2">
                <Button onPress={() => setModalOpen(true)}>Open modal</Button>
                <Button variant="outline" color="accent" onPress={() => setAlertDialogOpen(true)}>
                  Open alert dialog
                </Button>
              </View>

              <Modal open={modalOpen} onOpenChange={setModalOpen}>
                <ModalPortal>
                  <ModalBackdrop />
                  <ModalContent>
                    <ModalHeader>
                      <ModalTitle>播放设置</ModalTitle>
                    </ModalHeader>
                    <ModalBody marginTop="$3" marginBottom="$5">
                      <ModalDescription>这是使用 Tamagui headless Dialog primitive 构建的普通模态框。</ModalDescription>
                    </ModalBody>
                    <ModalFooter>
                      <ModalClose aria-label="取消" asChild>
                        <Button variant="ghost" color="neutral">
                          取消
                        </Button>
                      </ModalClose>
                      <ModalClose aria-label="完成" asChild>
                        <Button>完成</Button>
                      </ModalClose>
                    </ModalFooter>
                  </ModalContent>
                </ModalPortal>
              </Modal>

              <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
                <AlertDialogPortal>
                  <AlertDialogBackdrop />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>清空播放队列？</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                      <AlertDialogDescription>
                        此操作无法撤销，当前队列中的全部音视频都会被移除。
                      </AlertDialogDescription>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                      <AlertDialogCancel aria-label="取消" asChild>
                        <Button variant="ghost" color="neutral">
                          取消
                        </Button>
                      </AlertDialogCancel>
                      <AlertDialogAction aria-label="确认清空" asChild>
                        <Button>确认清空</Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialogPortal>
              </AlertDialog>
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
              <Text color="$text" fontFamily="$heading" fontSize="$xl" fontWeight="600">
                Button icons and shapes
              </Text>
              <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$2">
                <Button icon="fa6-solid:play" onPress={() => undefined}>
                  Play
                </Button>
                <Button icon="fa6-solid:arrow-up-from-bracket" iconPosition="end" onPress={() => undefined}>
                  Share
                </Button>
                <Button accessibilityLabel="Pause" icon="fa6-solid:pause" onPress={() => undefined} />
                <Button accessibilityLabel="Add" icon="fa6-solid:plus" shape="rounded" onPress={() => undefined} />
                <Button icon="fa6-solid:play" shape="rounded" onPress={() => undefined}>
                  Rounded
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
    </SafeAreaProvider>
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
