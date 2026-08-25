import { Linking, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Layout } from "~/components/layout";
import { RELEASE_CHANNEL, ReleaseChannel, VERSION } from "~/constants/releasing";
import React, { useState } from "react";

import { Text } from "~/components/ui/text";
import { Image } from "expo-image";
import { SettingMenuItem } from "~/components/setting-menu";
import Toast from "react-native-toast-message";
import log from "~/utils/logger";
import { checkLatestVersion, type CheckLatestVersionReturns, downloadApk } from "~/features/config";
import CheckUpdateDialog from "~/components/check-update-dialog";
import { router } from "expo-router";
import { BRAND } from "~/constants/branding";

const releaseChannelDict: Record<ReleaseChannel, string> = {
  unknown: "未知",
  android_github: "安卓 GitHub 正式版",
  android_github_beta: "安卓 GitHub 测试版",
  android_github_stg: "安卓 GitHub Staging 版",
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
        <View style={styles.hero}>
          <Image style={styles.icon} source={require("../../assets/images/icon.png")} />
          <Text style={styles.brand}>{BRAND}</Text>
          <Text style={styles.version}>{`版本 ${VERSION} ・ ${releaseChannelDict[RELEASE_CHANNEL ?? "unknown"]}`}</Text>
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
        <SettingMenuItem
          icon={"fa6-solid:face-kiss-wink-heart"}
          title="致谢"
          onPress={() => router.navigate("/settings/credit")}
        />
      </ScrollView>
      {checkInfo ? <CheckUpdateDialog open={modalVisible} onClose={handleClose} result={checkInfo} /> : null}
    </Layout>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    padding: 24,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  brand: {
    fontSize: 24,
    lineHeight: 36,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.5,
    textAlign: "center",
  },
});
