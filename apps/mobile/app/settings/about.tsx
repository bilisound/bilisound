import { Linking, Platform, ScrollView, View } from "react-native";
import { Layout } from "~/components/layout";
import { RELEASE_CHANNEL, ReleaseChannel, VERSION } from "~/constants/releasing";
import React, { useState } from "react";

import { Text } from "~/components/ui/text";
import { Image } from "expo-image";
import { SettingMenuItem } from "~/components/setting-menu";
import Toast from "react-native-toast-message";
import log from "~/utils/logger";
import { checkLatestVersion, CheckLatestVersionReturns, downloadApk } from "~/business/check-release";
import CheckUpdateDialog from "~/components/check-update-dialog";
import { router } from "expo-router";
import { BRAND } from "~/constants/branding";

const releaseChannelDict: Record<ReleaseChannel, string> = {
  unknown: "未知",
  android_github: "安卓 GitHub 正式版",
  android_github_beta: "安卓 GitHub 测试版",
  web: "Web 正式版",
  web_beta: "Web 测试版",
};

export default function Page() {
  const [checking, setChecking] = useState(false);
  const [checkInfo, setCheckInfo] = useState<CheckLatestVersionReturns | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  async function handleCheck() {
    try {
      setChecking(true);
      const result = await checkLatestVersion(VERSION);
      setCheckInfo(result);

      if (result.isLatest) {
        Toast.show({
          type: "success",
          text1: "您使用的是最新版本！",
          text2: "当前最新版本是 " + result.latestVersion,
        });
        return;
      }

      setModalVisible(true);
      Toast.show({
        type: "info",
        text1: "发现新版本",
        text2: "当前最新版本是 " + result.latestVersion,
      });
    } catch (e) {
      log.error("检查更新失败：" + e);
      Toast.show({
        type: "error",
        text1: "检查更新失败",
        text2: "可能是网络开小差了，稍后再试试",
      });
    } finally {
      setChecking(false);
    }
  }

  function handleClose(positive: boolean) {
    setModalVisible(false);
    if (positive && checkInfo?.downloadUrl) {
      downloadApk(checkInfo.downloadUrl, checkInfo.latestVersion);
      return;
    }
    if (positive && checkInfo?.downloadPage) {
      Linking.openURL(checkInfo.downloadPage);
    }
  }

  return (
    <Layout title={"关于"} leftAccessories={"BACK_BUTTON"}>
      <ScrollView>
        <View className="items-center p-6">
          <Image className="w-[4.5rem] h-[4.5rem] rounded-xl" source={require("../../assets/images/icon.png")} />
          <Text className="text-2xl leading-normal font-semibold mt-2 mb-1">{BRAND}</Text>
          <Text className="text-sm leading-normal opacity-50 text-center">{`版本 ${VERSION} ・ ${releaseChannelDict[RELEASE_CHANNEL ?? "unknown"]}`}</Text>
        </View>
        {Platform.OS !== "web" && (
          <SettingMenuItem
            disabled={checking}
            icon={checking ? "loading" : "fa6-solid:circle-up"}
            title="检查更新"
            onPress={() => handleCheck()}
          />
        )}
        <SettingMenuItem
          icon={"fa6-solid:award"}
          title="开源软件许可证"
          onPress={() => router.navigate("/settings/license")}
        />
      </ScrollView>
      {checkInfo ? <CheckUpdateDialog open={modalVisible} onClose={handleClose} result={checkInfo} /> : null}
    </Layout>
  );
}
