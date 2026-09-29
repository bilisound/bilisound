import { useQuery } from "@tanstack/react-query";
import { filesize } from "filesize";
import { Platform } from "react-native";

import { AppLayout } from "~/components/app-layout";
import { notify, reportError } from "~/components/feedback";
import { SettingsMenuItem } from "~/components/settings-menu";
import { cleanOfflineAudioCache, getAudioCacheSizeInfo } from "~/features/playback";
import { exportPlaylistToFile, importPlaylistFromFile } from "~/utils/exchange/playlist";

export default function DataScreen() {
  const native = Platform.OS !== "web";
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["count_size"],
    queryFn: getAudioCacheSizeInfo,
    staleTime: 30000,
  });

  const cacheDescription = (() => {
    if (!data || isLoading) {
      return "占用空间统计中……";
    }
    if (data.cacheFreeSize <= 0) {
      return "目前没有可供清除的缓存";
    }
    return `${filesize(data.cacheFreeSize)} 可清除`;
  })();

  async function handleCleanCache() {
    try {
      await cleanOfflineAudioCache();
      await refetch();
      notify("离线缓存已清除");
    } catch (error) {
      reportError(error);
    }
  }

  return (
    <AppLayout back title="数据管理">
      {native ? (
        <SettingsMenuItem
          description={cacheDescription}
          disabled={!data || data.cacheFreeSize <= 0}
          icon="fa6-solid:trash"
          title="清除离线缓存"
          onPress={handleCleanCache}
        />
      ) : null}
      <SettingsMenuItem
        description="导出的歌单可以在其它设备导入"
        icon="fa6-solid:share"
        title="导出全部歌单"
        onPress={() => void exportPlaylistToFile().catch(reportError)}
      />
      <SettingsMenuItem
        description="支持 Bilisound 导出的 TOML 歌单文件"
        icon="fa6-solid:file-import"
        title="导入歌单"
        onPress={() => void importPlaylistFromFile().catch(reportError)}
      />
    </AppLayout>
  );
}
