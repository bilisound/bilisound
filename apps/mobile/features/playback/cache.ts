import { getCurrentTrack, getCurrentTrackIndex, getNextTrackIndex, getTracks, RepeatMode } from "@bilisound/player";
import * as Player from "@bilisound/player";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

import { cleanAudioCache, deleteCacheStatus, getAudioCacheSize, getCacheStatusKey } from "~/features/cache";
import { PLAYLIST_RESTORE_LOOP_ONCE, playlistStorage } from "~/storage/playlist";
import { PLACEHOLDER_AUDIO } from "~/constants/playback";
import { getDownloadPolicy } from "~/features/config";
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
  if (!getDownloadPolicy().downloadNextTrack) {
    return;
  }
  const tracks = await getTracks();
  const trackIndex = await getCurrentTrackIndex();
  if (tracks.length <= 0 || trackIndex > tracks.length - 1) {
    return;
  }
  const trackIndexNext = await getNextTrackIndex();
  const tasks: Promise<void>[] = [];
  const currId = tracks[trackIndex].extendedData!.id;
  const currEpisode = tracks[trackIndex].extendedData!.episode;
  const currTitle = tracks[trackIndex].title;

  log.info(`[${currId} / ${currEpisode}] 预先下载当前曲目`);
  tasks.push(downloadResourceNow(currId, currEpisode, currTitle ?? "未知曲目"));
  if (trackIndexNext >= 0 && trackIndexNext <= tracks.length - 1) {
    const nextId = tracks[trackIndexNext].extendedData!.id;
    const nextEpisode = tracks[trackIndexNext].extendedData!.episode;
    const nextTitle = tracks[trackIndexNext].title;

    log.info(`[${nextId} / ${nextEpisode}] 预先下载下一个曲目`);
    tasks.push(downloadResourceNow(nextId, nextEpisode, nextTitle ?? "未知曲目"));
  }
  await Promise.all(tasks);
}

/**
 * 当前播放队列引用的缓存 key 列表，用于缓存清理时排除队列曲目
 */
async function getQueueCacheKeys(): Promise<string[]> {
  const tracks = await getTracks();
  return tracks.map(track => getCacheStatusKey(track.extendedData!.id, track.extendedData!.episode));
}

/**
 * 统计离线缓存占用空间（排除当前播放队列后可清除的部分）
 */
export async function getAudioCacheSizeInfo() {
  return getAudioCacheSize(await getQueueCacheKeys());
}

/**
 * 清除未被当前播放队列引用的离线音频缓存
 */
export async function cleanOfflineAudioCache() {
  await cleanAudioCache(await getQueueCacheKeys());
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
