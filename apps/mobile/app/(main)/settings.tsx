import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, View } from "react-native";

import { SettingMenuItem } from "~/components/setting-menu";
import { Switch } from "~/components/ui/switch";
import { VERSION } from "~/constants/releasing";
import useSettingsStore from "~/store/settings";
import log from "~/utils/logger";
import { Layout } from "~/components/layout";
import { useTabSafeAreaInsets } from "~/hooks/useTabSafeAreaInsets";
import { FEATURE_DOWNLOAD_MANAGER } from "~/constants/feature";
import useDownloadStore, { DownloadItem } from "~/store/download";
import { Text } from "~/components/ui/text";
import { BRAND } from "~/constants/branding";

function DownloadDescription() {
  const { downloadList } = useDownloadStore();
  const builtList: DownloadItem[] = Array.from(downloadList.values()).sort((a, b) => a.startTime - b.startTime);
  const displayList = builtList.filter(e => e.status === 1 || e.status === 0);

  return (
    <Text className="mt-1 ml-9 opacity-60 text-[15px] leading-normal">
      {displayList.length > 0 ? `${displayList.length} 个任务进行中` : "尚无任务正在进行"}
    </Text>
  );
}

export default function Page() {
  const edgeInsets = useTabSafeAreaInsets();
  const { useLegacyID, downloadNextTrack, filterResourceURL, debugMode, toggle } = useSettingsStore(state => ({
    useLegacyID: state.useLegacyID,
    downloadNextTrack: state.downloadNextTrack,
    filterResourceURL: state.filterResourceURL,
    debugMode: state.debugMode,
    // update: state.update,
    toggle: state.toggle,
  }));

  const developerOptions = (
    <>
      {process.env.NODE_ENV !== "production" ? (
        <SettingMenuItem
          key="settings_20010"
          icon={"fa6-solid:code"}
          title="组件测试页面"
          onPress={() => {
            router.navigate("/test");
          }}
        />
      ) : null}
      {/*<SettingMenuItem
                key="settings_20020"
                icon={LabIcon}
                title="实验性功能"
                onPress={() => {
                    router.navigate("/settings/lab");
                }}
            />*/}
      {Platform.OS === "web" ? null : (
        <>
          <SettingMenuItem
            key="settings_20030"
            icon={"fa6-solid:cloud"}
            title="只从云服务商 CDN 节点获取音频"
            subTitle="开启后可能会显著改善连接速度"
            rightAccessories={
              <Switch
                value={filterResourceURL}
                onChange={() => {
                  toggle("filterResourceURL");
                }}
              />
            }
            onPress={() => toggle("filterResourceURL")}
          />
          <SettingMenuItem
            key="settings_20040"
            icon={"fa6-solid:bug"}
            title="导出日志"
            subTitle="对开发者真的太有用了"
            onPress={async () => {
              router.navigate("/settings/logs");
            }}
          />
        </>
      )}
    </>
  );

  return (
    <Layout title="设置" edgeInsets={{ ...edgeInsets, bottom: 0 }}>
      <ScrollView className={"flex-1 web:max-h-[calc(100dvh-192px)] md:web:max-h-[calc(100dvh-64px)]"}>
        <SettingMenuItem
          key="settings_10010"
          icon={"fa6-solid:link"}
          title="使用 av 号而非 bv 号"
          subTitle="开启该选项后，在保存的音频文件中，文件名前缀将以 av 号开头"
          rightAccessories={
            <Switch
              value={useLegacyID}
              onChange={() => {
                toggle("useLegacyID");
              }}
            />
          }
          onPress={() => toggle("useLegacyID")}
        />
        {Platform.OS === "web" ? null : (
          <SettingMenuItem
            key="settings_10020"
            icon={"fa6-solid:cloud-arrow-down"}
            title="自动缓存队列中的曲目"
            subTitle="可以显著改善持续听歌的体验"
            rightAccessories={
              <Switch
                value={downloadNextTrack}
                onChange={() => {
                  toggle("downloadNextTrack");
                }}
              />
            }
            onPress={() => toggle("downloadNextTrack")}
          />
        )}
        <SettingMenuItem
          key="settings_10030"
          icon={"fa6-solid:paintbrush"}
          title="外观设置"
          subTitle="切换应用主题和看板娘显示"
          onPress={async () => {
            router.navigate("/settings/theme");
          }}
        />
        <SettingMenuItem
          key="settings_10040"
          icon={"fa6-solid:database"}
          title="数据管理"
          subTitle={Platform.OS === "web" ? "管理数据备份" : "管理离线缓存和数据备份"}
          onPress={async () => {
            router.navigate("/settings/data");
          }}
        />
        {FEATURE_DOWNLOAD_MANAGER && Platform.OS !== "web" ? (
          <SettingMenuItem
            key="settings_10041"
            icon={"fa6-solid:download"}
            title="下载管理"
            subTitle={<DownloadDescription />}
            onPress={async () => {
              router.navigate("/download");
            }}
          />
        ) : null}
        <SettingMenuItem
          key="settings_10050"
          icon={"fa6-solid:circle-info"}
          title={`关于 ${BRAND}`}
          subTitle={`版本 ${VERSION}`}
          onPress={async () => {
            router.navigate("/settings/about");
          }}
        />
        <SettingMenuItem
          key="settings_10060"
          icon={"fa6-solid:code"}
          title="开发者模式"
          subTitle="开启后可显示高级选项"
          rightAccessories={
            <Switch
              value={debugMode}
              onChange={() => {
                const result = toggle("debugMode");
                log.setSeverity(result ? "debug" : "info");
              }}
            />
          }
          onPress={() => {
            const result = toggle("debugMode");
            log.setSeverity(result ? "debug" : "info");
          }}
        />
        {debugMode ? developerOptions : null}
      </ScrollView>
    </Layout>
  );
}
