import useDownloadStore from "~/store/download";
import { TrackData } from "@bilisound/player/build/types";
import { Platform } from "react-native";
import { downloadResourceNow } from "~/business/download";
import { useActionSheetStore } from "~/components/main-bottom-sheet/stores";
import Toast from "react-native-toast-message";
import { useMMKVBoolean } from "react-native-mmkv";
import { CACHE_INVALID_KEY_DO_NOT_USE, cacheStatusStorage } from "~/storage/cache-status";
import { getBilisoundResourceUrlOnline } from "~/api/bilisound";
import useSettingsStore from "~/store/settings";
import { bv2av } from "~/utils/vendors/av-bv";
import { getCacheAudioPath, saveAudioFile, uriToPath } from "~/utils/file";
import log from "~/utils/logger";
import { ActionMenuItem } from "~/components/action-menu";
import { deleteCurrentTrackCache } from "~/business/playlist/handler";

export function useDownloadMenuItem(
  currentTrack: TrackData | null | undefined,
  closeCallback: () => void,
): ActionMenuItem[] {
  const { downloadList } = useDownloadStore();
  const currentItemDownload = downloadList.get(
    currentTrack?.extendedData?.id + "_" + currentTrack?.extendedData?.episode,
  );
  const [currentCache] = useMMKVBoolean(
    currentTrack?.extendedData
      ? currentTrack.extendedData.id + "_" + currentTrack.extendedData.episode
      : CACHE_INVALID_KEY_DO_NOT_USE,
    cacheStatusStorage,
  );
  const currentProgress = currentItemDownload?.progress;

  return [
    {
      show: Platform.OS !== "web" && !currentCache,
      disabled: !!currentItemDownload,
      icon: "fa6-solid:download",
      iconSize: 18,
      text: (() => {
        if (currentProgress && currentItemDownload.status === 0) {
          return "排队中……";
        }
        if (currentProgress) {
          return `下载中 (${Math.round((currentProgress.totalBytesWritten / currentProgress.totalBytesExpectedToWrite) * 100 || 0)}%)`;
        }
        return "缓存到本地";
      })(),
      action: async () => {
        if (!currentTrack?.extendedData) {
          return;
        }
        await downloadResourceNow(
          currentTrack.extendedData.id,
          currentTrack.extendedData.episode,
          currentTrack.title ?? "未知曲目",
        );
        if (!useActionSheetStore.getState().showActionSheet) {
          Toast.show({
            type: "success",
            text1: "下载完成",
            text2: currentTrack.title + "",
          });
        }
      },
    },
    {
      show: Platform.OS === "web",
      disabled: false,
      icon: "fa6-solid:download",
      iconSize: 18,
      text: "下载",
      action: async () => {
        if (!currentTrack?.extendedData) {
          return;
        }
        globalThis.window.open(
          getBilisoundResourceUrlOnline(
            currentTrack.extendedData.id,
            currentTrack.extendedData.episode,
            useSettingsStore.getState().useLegacyID ? "av" : "bv",
          ).url,
        );
        closeCallback();
      },
    },
    {
      show: Platform.OS !== "web" && currentCache,
      disabled: false,
      icon: "fa6-solid:trash",
      iconSize: 18,
      text: "删除缓存",
      action: async () => {
        if (!currentTrack?.extendedData) {
          return;
        }
        closeCallback();
        await deleteCurrentTrackCache();
        Toast.show({
          type: "info",
          text1: "已删除当前播放曲目的缓存",
        });
      },
    },
    {
      show: Platform.OS !== "web" && currentCache,
      disabled: false,
      icon: "fa6-solid:floppy-disk",
      iconSize: 18,
      text: "保存到文件",
      action: async () => {
        if (!currentTrack?.extendedData) {
          return;
        }
        closeCallback();

        const { id, episode } = currentTrack.extendedData;
        const { useLegacyID } = useSettingsStore.getState();
        const fileName = `[${useLegacyID ? "av" + bv2av(id) : id}] [P${episode}] ${currentTrack.title}.m4a`;
        try {
          await saveAudioFile(uriToPath(getCacheAudioPath(id, episode, false)), fileName);
          Toast.show({
            type: "success",
            text1: "文件已保存",
            text2: fileName,
          });
        } catch (error) {
          log.error("文件未保存：" + error);
        }
      },
    },
  ];
}
