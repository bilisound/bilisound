import { Image } from "expo-image";
import { router } from "expo-router";
import { Platform, StyleSheet } from "react-native";

import { Text, VStack } from "@bilisound/ui";
import { AppLayout } from "~/components/app-layout";
import { SettingsMenuItem } from "~/components/settings-menu";
import { BRAND } from "~/constants/branding";
import { RELEASE_CHANNEL, VERSION } from "~/constants/releasing";
import type { ReleaseChannel } from "~/constants/releasing";

const releaseChannelDict: Record<ReleaseChannel, string> = {
  unknown: "未知",
  android_github: "安卓 GitHub 正式版",
  android_github_beta: "安卓 GitHub 测试版",
  android_github_stg: "安卓 GitHub Staging 版",
  web: "Web 正式版",
  web_beta: "Web 测试版",
};

export default function AboutScreen() {
  return (
    <AppLayout back title="关于">
      <VStack alignItems="center" gap="$1" padding="$6">
        <Image source={require("../../assets/images/icon-dev.png")} style={styles.icon} />
        <Text color="$text" semiBold size="xl">
          {BRAND}
        </Text>
        <Text color="$textMuted" size="sm" textAlign="center">
          {`版本 ${VERSION} ・ ${releaseChannelDict[RELEASE_CHANNEL ?? "unknown"]}`}
        </Text>
      </VStack>
      <SettingsMenuItem
        icon="fa6-solid:award"
        title="开源软件许可证"
        onPress={() => router.navigate("/settings/license")}
      />
      <SettingsMenuItem
        icon="fa6-solid:face-kiss-wink-heart"
        title="致谢"
        onPress={() => router.navigate("/settings/credit")}
      />
      <VStack backgroundColor="$surfaceMuted" borderRadius="$4" gap="$2" marginHorizontal="$4" padding="$4">
        <Text color="$text" semiBold size="sm">
          Bilisound Next 开发版
        </Text>
        <Text color="$textMuted" size="sm">
          这是基于 v3 架构重写的开发中版本，设置与数据功能正在逐步迁移。本版本不会检查或安装 v2 正式版的 APK 更新，
          {Platform.OS === "web"
            ? "数据仅保存在当前浏览器中。"
            : "如需正式版本请从官方渠道获取。后续接入更新通道后，这里会出现检查更新入口。"}
        </Text>
      </VStack>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  icon: {
    borderRadius: 12,
    height: 72,
    width: 72,
  },
});
