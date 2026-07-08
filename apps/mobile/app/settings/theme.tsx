import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Platform, ScrollView, StyleSheet, useWindowDimensions, View, Pressable } from "react-native";
import type { ImageSourcePropType } from "react-native";
import Toast from "react-native-toast-message";
import { useShallow } from "zustand/shallow";

import { ActionMenu } from "~/components/action-menu";
import type { ActionMenuItem } from "~/components/action-menu";
import BgCornerClassic from "~/assets/images/bg-corner-classic.png";
import BgCornerRed from "~/assets/images/bg-corner-red.png";
import { Icon } from "~/components/icon";
import { Layout } from "~/components/layout";
import { SettingMenuItem } from "~/components/setting-menu";
import { YuruChara } from "~/components/yuru-chara";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "~/components/ui/actionsheet";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "~/components/ui/alert-dialog";
import { Button, ButtonOuter, ButtonText } from "~/components/ui/button";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { Heading } from "~/components/ui/heading";
import { Switch } from "~/components/ui/switch";
import { Text } from "~/components/ui/text";
import { shadow } from "~/constants/styles";
import { exportThemePackage, importThemePackage } from "~/features/theme/archive";
import { generateTailwindScale } from "~/features/theme/color-scale";
import { getYuruCharaAssetId } from "~/features/theme/editor";
import { findUserTheme, getUserThemeSettingId, useThemeRegistry } from "~/features/theme/registry";
import { themeStorage } from "~/features/theme/storage";
import type { UserTheme } from "~/features/theme/types";
import useSettingsStore from "~/store/settings";
import { saveBinaryFile } from "~/utils/file";
import { SettingSwitch } from "~/components/settings-switch";

type ThemeArchiveOutput =
  | Awaited<ReturnType<typeof exportThemePackage>>
  | {
      blob: Blob;
      mimeType: "application/zip";
      fileName: string;
    };

type UserThemeAction = "apply" | "edit" | "export" | "delete" | "close";

export default function Page() {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;
  const [actionTheme, setActionTheme] = useState<UserTheme>();
  const [showThemeActions, setShowThemeActions] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserTheme>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { theme, update, showYuruChara, toggle } = useSettingsStore(
    useShallow(state => ({
      theme: state.theme,
      update: state.update,
      showYuruChara: state.showYuruChara,
      toggle: state.toggle,
    })),
  );
  const { themes, loaded, loadThemes, saveTheme, deleteTheme } = useThemeRegistry();

  useEffect(() => {
    if (!loaded) loadThemes();
  }, [loadThemes, loaded]);

  async function importTheme() {
    const pickResult = await DocumentPicker.getDocumentAsync({
      type: ["application/zip", "application/x-zip-compressed"],
    });
    const picked = pickResult.assets?.[0];
    if (!picked) return;

    try {
      const imported = await importThemePackage(
        (Platform.OS === "web" && picked.file ? { file: picked.file } : { uri: picked.uri }) as never,
      );
      const now = Date.now();
      const id = `${now}`;
      const storedAsset = imported.asset
        ? await themeStorage.saveThemeAsset(id, { ...imported.asset, id: getYuruCharaAssetId(id) })
        : undefined;
      const userTheme: UserTheme = {
        id,
        name: imported.manifest.name,
        version: 1,
        baseTheme: "classic",
        palette: imported.manifest.palette,
        yuruChara: imported.manifest.yuruChara
          ? { ...imported.manifest.yuruChara, imageAssetId: storedAsset?.id }
          : undefined,
        createdAt: now,
        updatedAt: now,
      };
      await saveTheme(userTheme);
      Toast.show({ type: "success", text1: "主题导入成功", text2: imported.manifest.name });
    } catch {
      Toast.show({ type: "error", text1: "主题导入失败", text2: "无法读取选择的主题包" });
    }
  }

  async function createBlankTheme() {
    const now = Date.now();
    const id = `${now}`;
    await saveTheme({
      id,
      name: "未命名主题",
      version: 1,
      baseTheme: "classic",
      palette: {
        primary: generateTailwindScale("#14b8a6"),
        accent: generateTailwindScale("#3b82f6"),
      },
      createdAt: now,
      updatedAt: now,
    });
    router.navigate(`/settings/theme/editor?id=${id}`);
  }

  async function exportTheme(item: UserTheme) {
    try {
      const asset = await themeStorage.getThemeAsset(item);
      const output = (await exportThemePackage(item, asset ?? undefined)) as ThemeArchiveOutput;
      if ("uri" in output) {
        await saveBinaryFile(output.uri, output.mimeType, output.fileName);
      } else if (Platform.OS === "web") {
        const url = URL.createObjectURL(output.blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = output.fileName;
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        throw new Error("Theme export did not return a native file uri");
      }
      Toast.show({ type: "success", text1: "主题已导出", text2: item.name });
    } catch {
      Toast.show({ type: "error", text1: "主题导出失败", text2: "无法生成主题包" });
    }
  }

  async function removeTheme(item: UserTheme) {
    await deleteTheme(item.id);
    if (findUserTheme([item], theme)) {
      update("theme", "classic");
    }
    Toast.show({ type: "success", text1: "主题已删除", text2: item.name });
  }

  function applyUserTheme(item: UserTheme) {
    update("theme", getUserThemeSettingId(item.id));
    Toast.show({ type: "success", text1: "主题已应用", text2: item.name });
  }

  function applyBuiltinTheme(themeId: "classic" | "red", name: string) {
    update("theme", themeId);
    Toast.show({ type: "success", text1: "主题已应用", text2: name });
  }

  function handleThemeAction(action: UserThemeAction) {
    const item = actionTheme;
    setShowThemeActions(false);

    if (!item) return;

    switch (action) {
      case "apply":
        applyUserTheme(item);
        break;
      case "edit":
        router.navigate(`/settings/theme/editor?id=${item.id}`);
        break;
      case "export":
        void exportTheme(item);
        break;
      case "delete":
        setDeleteTarget(item);
        setShowDeleteConfirm(true);
        break;
      case "close":
        break;
    }
  }

  return (
    <Layout title="外观设置" leftAccessories="BACK_BUTTON">
      <ScrollView>
        <SettingMenuItem
          icon="fa6-solid:image"
          title="在首页右下角展示看板娘"
          subTitle="如果看板娘干扰内容显示，可以关闭此功能"
          rightAccessories={<SettingSwitch value={showYuruChara} />}
          onPress={() => toggle("showYuruChara")}
        />

        <SectionTitle title="默认主题" />
        <View className={`px-4 gap-3 ${isWide ? "flex-row" : ""}`}>
          <ThemeCard
            title="默认主题"
            selected={theme === "classic"}
            yuruChara={BgCornerClassic}
            wide={isWide}
            onPress={() => applyBuiltinTheme("classic", "默认主题")}
          />
          <ThemeCard
            title="红色主题"
            selected={theme === "red"}
            yuruChara={BgCornerRed}
            wide={isWide}
            onPress={() => applyBuiltinTheme("red", "红色主题")}
          />
        </View>

        <SectionTitle title="用户主题" />
        <SettingMenuItem icon="fa6-solid:plus" title="新建空白主题" onPress={createBlankTheme} />
        <SettingMenuItem
          icon="fa6-solid:file-import"
          title="导入主题"
          subTitle="支持已打包的 Bilisound 主题"
          onPress={importTheme}
        />
        {themes.map(item => (
          <SettingMenuItem
            key={item.id}
            icon="fa6-solid:paintbrush"
            title={item.name}
            subTitle={findUserTheme([item], theme) ? "已启用" : ""}
            onPress={() => applyUserTheme(item)}
            onLongPress={() => {
              setActionTheme(item);
              setShowThemeActions(true);
            }}
          />
        ))}
        <UserThemeActions
          item={actionTheme}
          onAction={handleThemeAction}
          onClose={() => setShowThemeActions(false)}
          show={showThemeActions}
        />
      </ScrollView>
      {showYuruChara && <YuruChara style={Platform.OS === "web" ? styles.pageYuruChara : undefined} />}
      <DeleteThemeDialog
        item={deleteTarget}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          const item = deleteTarget;
          setShowDeleteConfirm(false);
          if (item) {
            void removeTheme(item);
          }
        }}
        show={showDeleteConfirm}
      />
    </Layout>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text className="px-4 pt-6 pb-4 text-[15px] font-bold">{title}</Text>;
}

function ThemeCard({
  title,
  selected,
  yuruChara,
  wide,
  onPress,
}: {
  title: string;
  selected: boolean;
  yuruChara: ImageSourcePropType;
  wide: boolean;
  onPress: () => void;
}) {
  const { colorValue, mode } = useRawThemeValues();
  const selectedBackgroundColor = colorValue(mode === "dark" ? "--color-primary-200" : "--color-primary-700");

  return (
    <Pressable
      onPress={onPress}
      style={[
        { backgroundColor: selected ? selectedBackgroundColor : "rgba(128, 128, 128, 0.12)" },
        selected ? styles.themeCardSelected : undefined,
      ]}
      className={`h-24 rounded-xl px-5 py-5 justify-between overflow-hidden ${wide ? "flex-1" : ""}`}
    >
      <Text className={`text-[18px] font-bold ${selected ? "text-white" : ""}`}>{title}</Text>
      {selected ? <Icon name="fa6-solid:check" size={18} color="#ffffff" /> : null}
      <View pointerEvents="none" style={styles.yuruCharaContainer}>
        <Image source={yuruChara} resizeMode="contain" style={styles.yuruChara} />
      </View>
    </Pressable>
  );
}

function UserThemeActions({
  item,
  show,
  onAction,
  onClose,
}: {
  item?: UserTheme;
  show: boolean;
  onAction: (action: UserThemeAction) => void;
  onClose: () => void;
}) {
  const menuItems: ActionMenuItem[] = [
    {
      show: true,
      icon: "fa6-solid:check",
      text: "应用",
      action: () => onAction("apply"),
    },
    {
      show: true,
      icon: "fa6-solid:pen",
      text: "编辑",
      action: () => onAction("edit"),
    },
    {
      show: true,
      icon: "fa6-solid:file-export",
      text: "导出",
      action: () => onAction("export"),
    },
    {
      show: true,
      icon: "fa6-solid:trash",
      text: "删除",
      action: () => onAction("delete"),
    },
    {
      show: true,
      icon: "fa6-solid:xmark",
      iconSize: 20,
      text: "取消",
      action: () => onAction("close"),
    },
  ];

  return (
    <Actionsheet isOpen={show} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="z-50">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        {!!item && (
          <View className="w-full px-3 py-2">
            <Text className="text-[15px] font-bold">{item.name}</Text>
          </View>
        )}
        <ActionMenu menuItems={menuItems} />
      </ActionsheetContent>
    </Actionsheet>
  );
}

function DeleteThemeDialog({
  item,
  show,
  onCancel,
  onConfirm,
}: {
  item?: UserTheme;
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog isOpen={show} onClose={onCancel} size="md">
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Heading className="text-typography-950 font-semibold" size="md">
            删除主题确认
          </Heading>
        </AlertDialogHeader>
        <AlertDialogBody>
          <Text size="sm" className="leading-normal">
            确定要删除主题「{item?.name ?? ""}」吗？此操作无法撤销。
          </Text>
        </AlertDialogBody>
        <AlertDialogFooter>
          <ButtonOuter>
            <Button variant="ghost" onPress={onCancel}>
              <ButtonText>取消</ButtonText>
            </Button>
          </ButtonOuter>
          <ButtonOuter>
            <Button onPress={onConfirm}>
              <ButtonText>删除</ButtonText>
            </Button>
          </ButtonOuter>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const styles = StyleSheet.create({
  pageYuruChara: {
    position: "fixed" as "absolute",
  },
  themeCardSelected: {
    boxShadow: shadow.md,
  },
  yuruCharaContainer: {
    position: "absolute",
    right: 0,
    top: -64,
    width: 256,
    height: 256,
    opacity: 0.3,
  },
  yuruChara: {
    width: "100%",
    height: "100%",
  },
});
