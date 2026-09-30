import { isWeb, useTheme } from "@tamagui/core";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { ActionMenu, Button, HStack, Icon, SwitchVisual, Text, VStack } from "@bilisound/ui";
import type { ActionMenuItem } from "@bilisound/ui";
import BgCornerClassic from "~/assets/images/bg-corner-classic.png";
import BgCornerRed from "~/assets/images/bg-corner-red.png";
import { AppLayout } from "~/components/app-layout";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { notify, reportError } from "~/components/feedback";
import { SettingsMenuItem, SettingsSectionTitle } from "~/components/settings-menu";
import { exportUserTheme, pickUserTheme } from "~/components/settings-theme-file";
import { generateTailwindScale } from "~/features/theme/color-scale";
import { getYuruCharaAssetId } from "~/features/theme/editor";
import { findUserTheme, getUserThemeSettingId, useThemeRegistry } from "~/features/theme/registry";
import { themeStorage } from "~/features/theme/storage";
import type { UserTheme } from "~/features/theme/types";
import { useAppearanceConfig, useSettingsActions } from "~/features/config";
import log from "~/utils/logger";

type UserThemeAction = "apply" | "edit" | "copy" | "export" | "delete";

export default function ThemeScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  const { showYuruChara, theme } = useAppearanceConfig();
  const { toggle, update } = useSettingsActions();
  const { deleteTheme, loadThemes, loaded, saveTheme, themes } = useThemeRegistry();
  const [actionTheme, setActionTheme] = useState<UserTheme>();
  const [showActions, setShowActions] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserTheme>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!loaded) {
      void loadThemes();
    }
  }, [loadThemes, loaded]);

  async function importTheme() {
    try {
      const imported = await pickUserTheme();
      if (!imported) {
        return;
      }
      await saveTheme(imported);
      notify(`主题导入成功：${imported.name}`);
    } catch (cause) {
      log.error("主题导入失败！错误：" + cause);
      notify("主题导入失败，无法读取选择的主题包", true);
    }
  }

  async function createBlankTheme() {
    try {
      const now = Date.now();
      const id = `${now}`;
      const primaryBase = "#14b8a6";
      const accentBase = "#3b82f6";
      await saveTheme({
        id,
        name: "未命名主题",
        version: 1,
        baseTheme: "classic",
        palette: {
          primary: generateTailwindScale(primaryBase),
          accent: generateTailwindScale(accentBase),
          primaryBase,
          accentBase,
        },
        createdAt: now,
        updatedAt: now,
      });
      router.navigate(`/settings/theme/editor?id=${id}`);
    } catch (cause) {
      log.error("新建主题失败！错误：" + cause);
      notify("新建主题失败，无法创建主题数据", true);
    }
  }

  async function exportTheme(item: UserTheme) {
    try {
      await exportUserTheme(item);
      notify(`主题已导出：${item.name}`);
    } catch (cause) {
      log.error("主题导出失败！错误：" + cause);
      notify("主题导出失败，无法生成主题包", true);
    }
  }

  async function copyTheme(item: UserTheme) {
    try {
      const now = Date.now();
      const id = `${now}`;
      const sourceAsset = await themeStorage.getThemeAsset(item);
      const assetId = getYuruCharaAssetId(id);
      const copiedTheme: UserTheme = {
        ...item,
        id,
        name: `${item.name} 副本`,
        yuruChara: item.yuruChara ? { ...item.yuruChara, imageAssetId: sourceAsset ? assetId : undefined } : undefined,
        createdAt: now,
        updatedAt: now,
      };
      const copiedAsset = sourceAsset
        ? {
            id: assetId,
            fileName: sourceAsset.fileName,
            mimeType: sourceAsset.mimeType,
            uri: sourceAsset.uri,
            blob: sourceAsset.blob,
          }
        : undefined;

      await saveTheme(copiedTheme, copiedAsset);
      notify(`主题已复制：${copiedTheme.name}`);
    } catch (cause) {
      log.error("主题复制失败！错误：" + cause);
      notify("主题复制失败，无法复制主题数据", true);
    }
  }

  async function removeTheme(item: UserTheme) {
    try {
      await deleteTheme(item.id);
      if (findUserTheme([item], theme)) {
        update("theme", "classic");
      }
      notify(`主题已删除：${item.name}`);
    } catch (cause) {
      reportError(cause);
    }
  }

  function applyUserTheme(item: UserTheme) {
    update("theme", getUserThemeSettingId(item.id));
    notify(`主题已应用：${item.name}`);
  }

  function applyBuiltinTheme(themeId: "classic" | "red", name: string) {
    update("theme", themeId);
    notify(`主题已应用：${name}`);
  }

  function handleThemeAction(action: UserThemeAction) {
    const item = actionTheme;
    setShowActions(false);
    if (!item) {
      return;
    }

    switch (action) {
      case "apply":
        applyUserTheme(item);
        break;
      case "edit":
        router.navigate(`/settings/theme/editor?id=${item.id}`);
        break;
      case "copy":
        void copyTheme(item);
        break;
      case "export":
        void exportTheme(item);
        break;
      case "delete":
        setDeleteTarget(item);
        setShowDeleteConfirm(true);
        break;
    }
  }

  const actionMenuItems: ActionMenuItem[] = [
    { action: () => handleThemeAction("apply"), icon: "fa6-solid:check", text: "应用" },
    { action: () => handleThemeAction("edit"), icon: "fa6-solid:pen", text: "编辑" },
    { action: () => handleThemeAction("copy"), icon: "fa6-solid:copy", text: "复制" },
    { action: () => handleThemeAction("export"), icon: "fa6-solid:file-export", text: "导出" },
    { action: () => handleThemeAction("delete"), icon: "fa6-solid:trash", text: "删除" },
  ];

  return (
    <AppLayout back title="外观设置">
      <SettingsMenuItem
        accessibilityRole="switch"
        accessibilityState={{ checked: showYuruChara }}
        description="如果看板娘干扰内容显示，可以关闭此功能"
        icon="fa6-solid:image"
        right={<SwitchVisual checked={showYuruChara} />}
        title="在首页右下角展示看板娘"
        onPress={() => toggle("showYuruChara")}
      />
      <SettingsSectionTitle>默认主题</SettingsSectionTitle>
      <HStack flexDirection={wide ? "row" : "column"} gap="$3" paddingHorizontal="$4">
        <ThemeCard
          art={<Image contentFit="contain" source={BgCornerClassic} style={styles.cardArtImage} />}
          selected={theme === "classic"}
          title="默认主题"
          wide={wide}
          onPress={() => applyBuiltinTheme("classic", "默认主题")}
        />
        <ThemeCard
          art={<Image contentFit="contain" source={BgCornerRed} style={styles.cardArtImage} />}
          selected={theme === "red"}
          title="红色主题"
          wide={wide}
          onPress={() => applyBuiltinTheme("red", "红色主题")}
        />
      </HStack>
      <SettingsSectionTitle>用户主题</SettingsSectionTitle>
      <SettingsMenuItem icon="fa6-solid:plus" title="新建空白主题" onPress={() => void createBlankTheme()} />
      <SettingsMenuItem
        description="支持已打包的 Bilisound 主题"
        icon="fa6-solid:file-import"
        title="导入主题"
        onPress={() => void importTheme()}
      />
      {themes.map(item => (
        <SettingsMenuItem
          key={item.id}
          description={findUserTheme([item], theme) ? "已启用" : undefined}
          icon="fa6-solid:paintbrush"
          right={
            <Button
              aria-label={`打开主题「${item.name}」的操作菜单`}
              color="neutral"
              icon="fa6-solid:ellipsis-vertical"
              shape="rounded"
              size="sm"
              variant="ghost"
              onPress={event => {
                // 防止点击按钮时同时触发整行的「应用主题」
                event?.stopPropagation?.();
                setActionTheme(item);
                setShowActions(true);
              }}
            />
          }
          title={item.name}
          onPress={() => applyUserTheme(item)}
        />
      ))}
      <ActionMenu
        header={
          actionTheme ? (
            <VStack paddingHorizontal="$4" paddingVertical="$2">
              <Text color="$text" semiBold>
                {actionTheme.name}
              </Text>
            </VStack>
          ) : undefined
        }
        menuItems={actionMenuItems}
        open={showActions}
        onOpenChange={setShowActions}
      />
      <ConfirmDialog
        confirmText="删除"
        description={`确定要删除主题「${deleteTarget?.name ?? ""}」吗？此操作无法撤销。`}
        open={showDeleteConfirm}
        title="删除主题确认"
        onClose={confirmed => {
          setShowDeleteConfirm(false);
          if (confirmed && deleteTarget) {
            void removeTheme(deleteTarget);
          }
        }}
      />
    </AppLayout>
  );
}

function ThemeCard({
  art,
  onPress,
  selected,
  title,
  wide,
}: {
  art: ReactNode;
  onPress: () => void;
  selected: boolean;
  title: string;
  wide: boolean;
}) {
  const theme = useTheme();
  const selectedColor = "$primaryOnSolid" as const;

  const handleKeyDown = (event: {
    currentTarget?: unknown;
    key?: string;
    preventDefault?: () => void;
    target?: unknown;
  }) => {
    // The card renders as a div on web, so Enter/Space have to be handled here.
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault?.();
    onPress();
  };

  return (
    <HStack
      role="button"
      aria-label={title}
      // A two-choice card behaves as a toggle button: `aria-pressed` is valid on
      // `role="button"`, while `aria-checked` would fake a radio without its
      // arrow-key conventions. Native keeps the existing selected state.
      {...(isWeb ? ({ "aria-pressed": selected } as object) : { accessibilityState: { selected } })}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      alignItems="center"
      backgroundColor={selected ? "$primarySolid" : "$surfaceMuted"}
      borderRadius="$4"
      flex={wide ? 1 : undefined}
      gap="$3"
      height={96}
      justifyContent="space-between"
      overflow="hidden"
      padding="$5"
      pressStyle={{ opacity: 0.85 }}
      onPress={onPress}
    >
      <VStack flex={1} gap="$2" minWidth={0}>
        <Text color={selected ? selectedColor : "$text"} numberOfLines={1} semiBold size="lg">
          {title}
        </Text>
        {selected ? <Icon color={theme.primaryOnSolid.get()} name="fa6-solid:check" size={18} aria-hidden /> : null}
      </VStack>
      <View pointerEvents="none" style={styles.cardArt}>
        {art}
      </View>
    </HStack>
  );
}

const styles = StyleSheet.create({
  cardArt: {
    height: 256,
    opacity: 0.3,
    position: "absolute",
    right: 0,
    top: -64,
    width: 256,
  },
  cardArtImage: {
    height: "100%",
    width: "100%",
  },
});
