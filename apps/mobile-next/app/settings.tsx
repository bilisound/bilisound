import { router } from "expo-router";
import { Platform } from "react-native";

import { SwitchVisual } from "@bilisound/ui";
import { AppLayout } from "~/components/app-layout";
import { summarizeDownloadTasks } from "~/components/settings-format";
import { SettingsMenuItem } from "~/components/settings-menu";
import { BRAND } from "~/constants/branding";
import { FEATURE_DOWNLOAD_MANAGER } from "~/constants/feature";
import { VERSION } from "~/constants/releasing";
import { useDownloadList } from "~/features/cache";
import { useDiagnosticsConfig, useDownloadConfig, useResourceConfig, useSettingsActions } from "~/features/config";
import log from "~/utils/logger";

export default function SettingsScreen() {
  const native = Platform.OS !== "web";
  const { filterResourceURL, useLegacyID } = useResourceConfig();
  const { downloadNextTrack } = useDownloadConfig();
  const { debugMode } = useDiagnosticsConfig();
  const { toggle } = useSettingsActions();
  const { downloadList } = useDownloadList();

  const downloadSummary = summarizeDownloadTasks(
    Array.from(downloadList.values()).sort((a, b) => a.startTime - b.startTime),
  );

  return (
    <AppLayout title="设置">
      <SettingsMenuItem
        accessibilityRole="switch"
        accessibilityState={{ checked: useLegacyID }}
        description="开启该选项后，在保存的音频文件中，文件名前缀将以 av 号开头"
        icon="fa6-solid:link"
        right={<SwitchVisual checked={useLegacyID} />}
        title="使用 av 号而非 bv 号"
        onPress={() => toggle("useLegacyID")}
      />
      {native ? (
        <SettingsMenuItem
          accessibilityRole="switch"
          accessibilityState={{ checked: downloadNextTrack }}
          description="可以显著改善持续听歌的体验"
          icon="fa6-solid:cloud-arrow-down"
          right={<SwitchVisual checked={downloadNextTrack} />}
          title="自动缓存队列中的曲目"
          onPress={() => toggle("downloadNextTrack")}
        />
      ) : null}
      <SettingsMenuItem
        description="切换应用主题和看板娘显示"
        icon="fa6-solid:paintbrush"
        title="外观设置"
        onPress={() => router.navigate("/settings/theme")}
      />
      <SettingsMenuItem
        description={native ? "管理离线缓存和数据备份" : "管理数据备份"}
        icon="fa6-solid:database"
        title="数据管理"
        onPress={() => router.navigate("/settings/data")}
      />
      {FEATURE_DOWNLOAD_MANAGER && native ? (
        <SettingsMenuItem
          accessibilityLabel={`下载管理，${downloadSummary.text}`}
          description={downloadSummary.text}
          icon="fa6-solid:download"
          title="下载管理"
          onPress={() => router.navigate("/download")}
        />
      ) : null}
      <SettingsMenuItem
        description={`版本 ${VERSION}`}
        icon="fa6-solid:circle-info"
        title={`关于 ${BRAND}`}
        onPress={() => router.navigate("/settings/about")}
      />
      <SettingsMenuItem
        accessibilityRole="switch"
        accessibilityState={{ checked: debugMode }}
        description="开启后可显示高级选项"
        icon="fa6-solid:code"
        right={<SwitchVisual checked={debugMode} />}
        title="开发者模式"
        onPress={() => {
          const result = toggle("debugMode");
          log.setSeverity(result ? "debug" : "info");
        }}
      />
      {debugMode && native ? (
        <>
          <SettingsMenuItem
            accessibilityRole="switch"
            accessibilityState={{ checked: filterResourceURL }}
            description="开启后可能会显著改善连接速度"
            icon="fa6-solid:cloud"
            right={<SwitchVisual checked={filterResourceURL} />}
            title="只从云服务商 CDN 节点获取音频"
            onPress={() => toggle("filterResourceURL")}
          />
          <SettingsMenuItem
            description="查看并分享应用运行日志"
            icon="fa6-solid:bug"
            title="应用日志"
            onPress={() => router.navigate("/settings/logs")}
          />
        </>
      ) : null}
    </AppLayout>
  );
}
