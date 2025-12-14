import { getCurrentTrack, getCurrentTrackIndex, getTracks, RepeatMode } from "@bilisound/player";
import * as Player from "@bilisound/player";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

import { deleteCacheStatus } from "~/storage/cache-status";
import { PLAYLIST_RESTORE_LOOP_ONCE, playlistStorage } from "~/storage/playlist";
import { PLACEHOLDER_AUDIO } from "~/constants/playback";
import useSettingsStore from "~/store/settings";
import useErrorMessageStore from "~/store/error-message";
import log from "~/utils/logger";
import { downloadResourceNow } from "~/business/download";

import { refreshCurrentTrack } from "./track-operations";

/**
 * 缓存当前曲目和下一曲目
 */
export async function saveCurrentAndNextTrack() {
  if (Platform.OS === "web") {
    return;
  }
  if (!useSettingsStore.getState().downloadNextTrack) {
    return;
  }
  const tracks = await getTracks();
  const trackIndex = await getCurrentTrackIndex();
  if (tracks.length <= 0 || trackIndex > tracks.length - 1) {
    return;
  }
  const trackIndexNext = trackIndex + 1;
  const tasks: Promise<void>[] = [];
  const currId = tracks[trackIndex].extendedData!.id;
  const currEpisode = tracks[trackIndex].extendedData!.episode;
  const currTitle = tracks[trackIndex].title;

  log.info(`[${currId} / ${currEpisode}] 预先下载当前曲目`);
  tasks.push(downloadResourceNow(currId, currEpisode, currTitle ?? "未知曲目"));
  if (trackIndexNext <= tracks.length - 1) {
    const nextId = tracks[trackIndexNext].extendedData!.id;
    const nextEpisode = tracks[trackIndexNext].extendedData!.episode;
    const nextTitle = tracks[trackIndex].title;

    log.info(`[${nextId} / ${nextEpisode}] 预先下载下一个曲目`);
    tasks.push(downloadResourceNow(nextId, nextEpisode, nextTitle ?? "未知曲目"));
  }
  await Promise.all(tasks);
}

/**
 * 删除当前曲目缓存
 */
export async function deleteCurrentTrackCache() {
  const currentTrack = await getCurrentTrack();
  const currentTrackIndex = await getCurrentTrackIndex();
  if (!currentTrack?.extendedData) {
    log.warn("无效的待删除缓存曲目");
    return;
  }
  const deleteTarget = currentTrack.uri;
  currentTrack.uri = PLACEHOLDER_AUDIO;
  currentTrack.extendedData.isLoaded = false;
  currentTrack.extendedData.expireAt = Date.now() - 1;

  if ((await Player.getRepeatMode()) === RepeatMode.ONE) {
    // 缓解 Android 端特有的 bug：在单曲循环模式下切歌到会被触发替换操作的歌曲，会在歌曲被替换后自动跳转回第一首
    playlistStorage.set(PLAYLIST_RESTORE_LOOP_ONCE, true);
    await Player.setRepeatMode(RepeatMode.OFF);
  }

  console.log(currentTrack);
  log.debug("进行曲目替换操作");
  try {
    await Player.replaceTrack(currentTrackIndex, currentTrack);
    await FileSystem.deleteAsync(deleteTarget);
    deleteCacheStatus(currentTrack.extendedData.id, currentTrack.extendedData.episode);
  } catch (e) {
    log.error("错误捕获：" + e);
    useErrorMessageStore.getState().setMessage(String((e as Error)?.message || e));
    await Player.next();
  }

  await refreshCurrentTrack();
}
