import * as Player from "@bilisound/player";
import { RepeatMode, ShuffleMode } from "@bilisound/player";
import { Platform } from "react-native";

import type { PlaybackErrorEvent, TrackData } from "@bilisound/player";

import { clearQueuePlaybackOrder, setQueuePlayingMode } from "~/storage/queue";
import { getMediaResource, getVideoImageUrl, getVideoMetadata, getVideoUrl } from "~/features/bilibili";
import { USER_AGENT_BILIBILI } from "~/constants/network";
import { getCacheAudioPath, isCacheExists, getCacheStatusKey } from "~/features/cache";
import log from "~/utils/logger";
import { URI_EXPIRE_DURATION } from "~/constants/playback";
import { getPlaylistDetail, type PlayableItem } from "~/features/playlist";
import {
  invalidateOnQueueStatus,
  PLAYLIST_ON_QUEUE,
  PLAYLIST_RESTORE_LOOP_ONCE,
  playlistStorage,
} from "~/storage/playlist";
import useErrorMessageStore from "~/store/error-message";

import { saveTrackData } from "./queue-snapshot";
import { playlistToTracks } from "./track-data";

let currentTrackRefresh: { key: string; promise: Promise<void> } | null = null;
let resumeCurrentTrackAfterRefresh = false;

type OptionalTrackData = TrackData | null | undefined;

function getTrackRefreshKey(trackIndex: number, trackData: OptionalTrackData) {
  const extendedData = trackData?.extendedData;
  return `${trackIndex}:${extendedData?.id ?? ""}:${extendedData?.episode ?? ""}`;
}

function isSameTrack(left: OptionalTrackData, right: OptionalTrackData) {
  return (
    left?.extendedData?.id === right?.extendedData?.id && left?.extendedData?.episode === right?.extendedData?.episode
  );
}

function shouldRefreshTrack(trackData: OptionalTrackData) {
  const extendedData = trackData?.extendedData;
  if (!extendedData || extendedData.isLoaded) {
    return false;
  }

  return (extendedData.expireAt ?? 0) <= Date.now() || isCacheExists(extendedData.id, extendedData.episode);
}

/**
 * 播放用例：从视频详情页播放指定分 P（追加/跳转到播放队列）
 */
export async function playEpisode(id: string, episode: number) {
  log.debug(`用户请求增加曲目：${id} / ${episode}`);
  const existing = await Player.getTracks();
  const found = existing.findIndex(e => e.extendedData?.id === id && e.extendedData.episode === episode);
  if (found >= 0) {
    log.debug(`发现列表中已有相同曲目 ${found}，进行跳转`);
    await Player.jump(found);
    return;
  }

  const data = await getVideoMetadata(id);
  const url = await getMediaResource(id, episode);
  const currentEpisode = data.episodes.find(item => item.page === episode);
  if (!currentEpisode) {
    throw new Error("指定视频没有指定的分 P 信息");
  }

  const trackData: TrackData = {
    uri: url.url,
    artist: data.owner.name,
    artworkUri: getVideoImageUrl(data.coverUrl, getVideoUrl(id)),
    duration: currentEpisode.duration,
    mimeType: "video/mp4",
    extendedData: {
      id,
      episode,
      isLoaded: false,
      expireAt: new Date().getTime() + URI_EXPIRE_DURATION,
      artworkUrl: data.coverUrl,
    },
    headers: {
      referer: getVideoUrl(id, episode),
      "user-agent": USER_AGENT_BILIBILI,
    },
    id: getCacheStatusKey(id, episode),
    title: data.episodes.length === 1 ? data.title : currentEpisode.title,
  };
  await Player.addTrack(trackData);
  // v3 起 player 内部管理随机顺序，新增曲目会被自动并入播放顺序，无需再维护 backup
  await Player.jump(existing.length); // existing.length - 1 + 1
  await Player.play();
  invalidateOnQueueStatus();
}

/**
 * 刷新传入的曲目对象
 */
export async function refreshTrack(trackData: TrackData) {
  const { extendedData } = trackData;
  if (!extendedData) {
    log.error("无法替换曲目 " + trackData.uri + "，因为缺乏必要的元数据！！");
    return trackData;
  }
  const id = extendedData.id;
  const episode = extendedData.episode;
  log.info("正在进行刷新 Track 操作");
  log.debug(`id: ${id}, episode: ${episode}`);

  // 处理本地缓存
  const got = isCacheExists(id, episode);
  if (got) {
    log.info("有缓存，应用缓存");
    // url 设置为缓存数据
    trackData.uri = getCacheAudioPath(id, episode);
    trackData.extendedData!.isLoaded = true;
    return trackData;
  }

  // 拉取最新的 URL
  log.info("开始拉取最新的 URL");
  const url = await getMediaResource(id, episode);
  trackData.uri = url.url;
  trackData.extendedData!.expireAt = new Date().getTime() + URI_EXPIRE_DURATION;
  trackData.mimeType = "video/mp4";
  return trackData;
}

/**
 * 预先刷新现在播放的曲目
 *
 * @param force 跳过 `shouldRefreshTrack` 判断，强制拉取最新 URL（用于 403/410 恢复）
 */
export async function refreshCurrentTrack(force = false) {
  if (Platform.OS === "web") {
    return;
  }
  log.debug("检查当前曲目是否可能需要替换");
  const trackData = await Player.getCurrentTrack();
  const trackIndex = await Player.getCurrentTrackIndex();
  const refreshKey = getTrackRefreshKey(trackIndex, trackData);
  if (currentTrackRefresh?.key === refreshKey) {
    return currentTrackRefresh.promise;
  }

  const refreshPromise = refreshCurrentTrackOnce(trackData, trackIndex, force);
  currentTrackRefresh = { key: refreshKey, promise: refreshPromise };
  try {
    await refreshPromise;
  } finally {
    if (currentTrackRefresh?.promise === refreshPromise) {
      currentTrackRefresh = null;
    }
  }
}

async function refreshCurrentTrackOnce(trackData: OptionalTrackData, trackIndex: number, force: boolean) {
  let restoreLoopOnce = false;
  let shouldResume = false;

  if (!trackData || !(force || shouldRefreshTrack(trackData))) {
    resumeCurrentTrackAfterRefresh = false;
  } else {
    if ((await Player.getRepeatMode()) === RepeatMode.ONE) {
      // 缓解 Android 端特有的 bug：在单曲循环模式下切歌到会被触发替换操作的歌曲，会在歌曲被替换后自动跳转回第一首
      playlistStorage.set(PLAYLIST_RESTORE_LOOP_ONCE, true);
      restoreLoopOnce = true;
      await Player.setRepeatMode(RepeatMode.OFF);
    }

    log.debug("进行曲目替换操作");
    try {
      shouldResume = (await Player.getIsPlaying()) || resumeCurrentTrackAfterRefresh;
      resumeCurrentTrackAfterRefresh = false;

      const refreshedTrack = await refreshTrack(trackData);
      const latestTrack = await Player.getCurrentTrack();
      const latestTrackIndex = await Player.getCurrentTrackIndex();
      if (latestTrackIndex !== trackIndex || !isSameTrack(latestTrack, trackData)) {
        log.debug("当前曲目已变化，跳过过期的曲目替换操作");
      } else {
        if (shouldResume) {
          await Player.pause();
        }
        await Player.replaceTrack(trackIndex, refreshedTrack);
        if (shouldResume) {
          await Player.play();
        }
      }
    } catch (e) {
      log.error("错误捕获：" + e);
      useErrorMessageStore.getState().setMessage(String((e as Error)?.message || e));
      await Player.next();
      if (shouldResume) {
        await Player.play();
      }
    }
  }

  if (restoreLoopOnce || playlistStorage.getBoolean(PLAYLIST_RESTORE_LOOP_ONCE)) {
    await Player.setRepeatMode(RepeatMode.ONE);
    playlistStorage.set(PLAYLIST_RESTORE_LOOP_ONCE, false);
  }
}

export async function playNextTrack() {
  resumeCurrentTrackAfterRefresh = await Player.getIsPlaying();
  await Player.next();
}

const MAX_NETWORK_RETRIES = 3;
let networkRetry: { key: string; attempt: number } | null = null;
let networkRetryTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 切歌后重置错误恢复状态，让下一首重新拥有完整的重试次数。
 */
export function resetPlaybackErrorRecovery() {
  if (networkRetryTimer) {
    clearTimeout(networkRetryTimer);
  }
  networkRetryTimer = null;
  networkRetry = null;
}

/**
 * 消费播放错误并尝试恢复。
 *
 * - HTTP 403/410：缓存 URL 已过期，刷新当前曲目 URL 后替换。
 * - 网络类错误：按 1s / 2s / 4s 退避重试 `prepare()`，最多 3 次。
 *
 * 播放错误事件在 Android 由 Headless 任务送达，iOS 由前台监听送达。
 */
export async function handlePlaybackError(error: PlaybackErrorEvent) {
  if (Platform.OS === "web") {
    return;
  }

  if (error.type === "ERROR_BAD_HTTP_STATUS_CODE" && (error.code === 403 || error.code === 410)) {
    log.info(`曲目 URL 已失效（HTTP ${error.code}），正在刷新当前曲目`);
    resetPlaybackErrorRecovery();
    try {
      await refreshCurrentTrack(true);
    } catch (e) {
      log.error("刷新失效曲目失败：" + e);
    }
    return;
  }

  if (error.type !== "ERROR_NETWORK_FAILURE") {
    return;
  }
  if (Platform.OS !== "android") {
    // 只有 Android 暴露了 prepare()；iOS 的失败恢复依赖 replaceTrack 重建 AVPlayerItem。
    return;
  }

  const trackData = await Player.getCurrentTrack();
  const trackIndex = await Player.getCurrentTrackIndex();
  const key = getTrackRefreshKey(trackIndex, trackData);
  const attempt = networkRetry?.key === key ? networkRetry.attempt : 0;
  if (attempt >= MAX_NETWORK_RETRIES) {
    log.warn(`网络错误重试已达上限（${MAX_NETWORK_RETRIES} 次），不再重试`);
    return;
  }

  networkRetry = { key, attempt: attempt + 1 };
  // 退避重试。清掉上一首遗留的计时器，避免多首曲目重叠重试。
  if (networkRetryTimer) {
    clearTimeout(networkRetryTimer);
  }
  networkRetryTimer = setTimeout(
    () => {
      networkRetryTimer = null;
      Player.prepare().catch(e => log.warn("重试 prepare 失败：" + e));
    },
    1000 * 2 ** attempt,
  );
}

/**
 * 播放用例：将歌单加载到播放队列并开始播放
 */
export async function playPlaylist(id: number, index = 0) {
  const data = await getPlaylistDetail(id);
  const tracks = playlistToTracks(data);
  if (Platform.OS !== "web" && !tracks[index].extendedData?.isLoaded) {
    await refreshTrack(tracks[index]);
  }
  await Player.setQueueWithOptions(tracks, {
    beginIndex: index,
    preservePlaybackState: false,
  });
  await Player.play();

  // 替换队列时恢复到非随机状态（与旧版行为一致），随机顺序由 player 内部管理
  await Player.setShuffleMode(ShuffleMode.OFF);
  setQueuePlayingMode("normal");
  clearQueuePlaybackOrder();
}

/**
 * 播放用例：向当前播放队列追加歌单曲目（歌单新增曲目后同步到正在播放该歌单的队列）
 */
export async function appendPlaylistToCurrentQueue(playlistId: number, playlistDetail: PlayableItem[]) {
  const queueOwner = JSON.parse(playlistStorage.getString(PLAYLIST_ON_QUEUE) ?? "{}") as {
    value?: { id?: number };
  };
  if (queueOwner.value?.id !== playlistId) {
    return;
  }

  const convertedList = playlistToTracks(playlistDetail);
  await Player.addTracks(convertedList);
  await saveTrackData();
  // v3 起 player 内部管理随机顺序，新增曲目会被自动并入播放顺序，无需再维护 backup
}
