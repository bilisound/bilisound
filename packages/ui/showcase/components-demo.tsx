import { useState } from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { Text, View } from "@tamagui/core";

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
  Button,
  Checkbox,
  DropdownSelect,
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
} from "@bilisound/ui";

const audioQualityOptions = [
  { label: "流畅 64K", value: "64k" },
  { label: "标准 132K", value: "132k" },
  { label: "高品质 192K", value: "192k" },
  { disabled: true, label: "无损 FLAC（暂不可用）", value: "flac" },
] as const;

export default function ComponentsDemo() {
  const [query, setQuery] = useState("");
  const [volume, setVolume] = useState([64]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [comment, setComment] = useState("");
  const [notify, setNotify] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [audioQuality, setAudioQuality] = useState("132k");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <View flex={1} backgroundColor="$canvas">
      <ScrollView contentContainerStyle={styles.content}>
        <View gap="$2">
          <Text color="$text" fontFamily="$heading" fontSize="$3xl" fontWeight="700">
            Component demo
          </Text>
          <Text color="$textMuted" fontFamily="$body" fontSize="$base" lineHeight="$base">
            Headless Tamagui components backed by Bilisound design tokens.
          </Text>
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
            Dropdown select
          </Text>
          <DropdownSelect
            value={audioQuality}
            onValueChange={setAudioQuality}
            options={audioQualityOptions}
            placeholder="选择音质"
          />
          <Text color="$textMuted" fontFamily="$body" fontSize="$sm">
            当前选择：{audioQualityOptions.find(option => option.value === audioQuality)?.label}
          </Text>
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
                  <AlertDialogDescription>此操作无法撤销，当前队列中的全部音视频都会被移除。</AlertDialogDescription>
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
            {...(Platform.OS === "web"
              ? {
                  "aria-checked": autoplay,
                  "aria-label": "Autoplay inside settings button",
                  role: "switch" as const,
                  tabIndex: 0,
                }
              : {
                  accessibilityLabel: "Autoplay inside settings button",
                  accessibilityRole: "switch" as const,
                  accessibilityState: { checked: autoplay },
                })}
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
