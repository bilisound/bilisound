import { Image } from "expo-image";
import React from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";

import { SettingMenuItem } from "~/components/setting-menu";
import { HStack } from "~/components/ui/hstack";
import { Switch } from "~/components/ui/switch";
import { Text } from "~/components/ui/text";
import { VStack } from "~/components/ui/vstack";
import { useShallow } from "zustand/shallow";
import useSettingsStore from "~/store/settings";
import { Layout } from "~/components/layout";
import { Icon } from "~/components/icon";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { shadow } from "~/constants/styles";
import BgCornerClassic from "~/assets/images/bg-corner-classic.png";
import BgCornerRed from "~/assets/images/bg-corner-red.png";

interface ThemeButtonProps {
  selected?: boolean;
  name: string;
  onPress?: () => void;
  yuruChara?: number;
}

const SM_BREAKPOINT = 640;

function ThemeButton({ selected = false, name, onPress, yuruChara }: ThemeButtonProps) {
  const { colorValue, mode } = useRawThemeValues();
  const { width } = useWindowDimensions();
  const isWide = width >= SM_BREAKPOINT;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.themeButton,
        isWide && styles.themeButtonWide,
        selected
          ? { backgroundColor: colorValue(mode === "dark" ? "--color-primary-200" : "--color-primary-700") }
          : { backgroundColor: colorValue("--color-background-50") },
        { boxShadow: selected ? shadow.md : undefined },
      ]}
    >
      <Text style={[styles.themeName, selected && styles.themeTextSelected]}>{name}</Text>
      {selected && <Text style={[styles.themeStatus, styles.themeTextSelected]}>已启用</Text>}
      {yuruChara != null && <Image source={yuruChara} style={styles.yuruChara} />}
    </Pressable>
  );
}

export default function Page() {
  const { colorValue } = useRawThemeValues();
  const { width } = useWindowDimensions();
  const isWide = width >= SM_BREAKPOINT;
  const { theme, update, showYuruChara, toggle } = useSettingsStore(
    useShallow(state => ({
      theme: state.theme,
      update: state.update,
      showYuruChara: state.showYuruChara,
      toggle: state.toggle,
    })),
  );

  return (
    <Layout title="外观设置" leftAccessories="BACK_BUTTON">
      <ScrollView>
        <VStack space="xl" style={styles.section}>
          <HStack space="md" style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Icon name={"fa6-solid:paintbrush"} size={20} color={colorValue("--color-typography-700")} />
            </View>
            <Text style={styles.sectionTitle}>App 界面主题</Text>
          </HStack>
          <VStack space="lg" style={[styles.themeRow, isWide && styles.themeRowWide]}>
            <ThemeButton
              name="默认主题"
              yuruChara={BgCornerClassic}
              onPress={() => update("theme", "classic")}
              selected={theme === "classic"}
            />
            <ThemeButton
              name="红色主题"
              yuruChara={BgCornerRed}
              onPress={() => update("theme", "red")}
              selected={theme === "red"}
            />
          </VStack>
        </VStack>
        <SettingMenuItem
          icon={"fa6-solid:image"}
          title="在首页右下角展示看板娘"
          subTitle="如果看板娘干扰内容显示，可以关闭此功能"
          rightAccessories={
            <Switch
              value={showYuruChara}
              onChange={() => {
                toggle("showYuruChara");
              }}
            />
          }
          onPress={() => toggle("showYuruChara")}
        />
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
  },
  sectionHeader: {
    alignItems: "center",
  },
  sectionIcon: {
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  themeRow: {
    flexDirection: "column",
  },
  themeRowWide: {
    flexDirection: "row",
  },
  themeButton: {
    flex: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    height: 96,
    justifyContent: "space-between",
    borderRadius: 8,
    overflow: "hidden",
  },
  themeButtonWide: {
    flex: 1,
  },
  themeName: {
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 28,
  },
  themeStatus: {
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 20,
  },
  themeTextSelected: {
    color: "#ffffff",
  },
  yuruChara: {
    position: "absolute",
    right: 0,
    top: -64,
    width: 256,
    height: 256,
    opacity: 0.3,
  },
});
