import { Image } from "expo-image";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { SettingMenuItem } from "~/components/setting-menu";
import { HStack } from "~/components/ui/hstack";
import { Switch } from "~/components/ui/switch";
import { Text } from "~/components/ui/text";
import { VStack } from "~/components/ui/vstack";
import useSettingsStore from "~/store/settings";
import { Layout } from "~/components/layout";
import { Monicon } from "@monicon/native";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { shadow } from "~/constants/styles";

interface ThemeButtonProps {
  selected?: boolean;
  name: string;
  onPress?: () => void;
  yuruChara?: any;
}

function ThemeButton({ selected = false, name, onPress, yuruChara }: ThemeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={twMerge(
        "sm:flex-1 flex px-5 py-5 h-24 justify-between rounded-lg cursor-pointer overflow-hidden focus:ring-0.125rem focus:ring-primary-500 dark:focus:ring-primary-900",
        selected ? "bg-primary-700 dark:bg-primary-200" : "bg-background-50",
      )}
      style={{ boxShadow: selected ? shadow.md : undefined }}
    >
      <Text className={`font-semibold text-lg ${selected ? "text-white" : ""}`}>{name}</Text>
      {selected && <Text className={`font-semibold text-sm ${selected ? "text-white" : ""}`}>已启用</Text>}
      <Image source={yuruChara} className="absolute right-0 -top-16 w-64 h-64 opacity-30" />
    </Pressable>
  );
}

export default function Page() {
  const { colorValue } = useRawThemeValues();
  const { theme, update, showYuruChara, toggle } = useSettingsStore(state => ({
    theme: state.theme,
    update: state.update,
    showYuruChara: state.showYuruChara,
    toggle: state.toggle,
  }));

  return (
    <Layout title="外观设置" leftAccessories="BACK_BUTTON">
      <ScrollView>
        <VStack space="xl" className="p-4">
          <HStack space="md" className="items-center">
            <View className="justify-center items-center size-[1.5rem]">
              <Monicon name={"fa6-solid:paintbrush"} size={20} color={colorValue("--color-typography-700")} />
            </View>
            <Text className="text-[0.9375rem] font-semibold">App 界面主题</Text>
          </HStack>
          <VStack space="lg" className="sm:flex-row">
            <ThemeButton
              name="默认主题"
              yuruChara={require("../../assets/images/bg-corner-classic.svg")}
              onPress={() => update("theme", "classic")}
              selected={theme === "classic"}
            />
            <ThemeButton
              name="红色主题"
              yuruChara={require("../../assets/images/bg-corner-red.webp")}
              onPress={() => update("theme", "red")}
              selected={theme === "red"}
            />
          </VStack>
        </VStack>
        <SettingMenuItem
          icon={"fa6-solid:image"}
          title="在首页右下角展示看板娘"
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
