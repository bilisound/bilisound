import * as Player from "@bilisound/player";
import { RepeatMode, ShuffleMode } from "@bilisound/player";
import { Platform } from "react-native";

import type { TrackData } from "@bilisound/player/build/types";

import { setQueuePlayingMode } from "~/storage/queue";
import { getImageProxyUrl, getVideoUrl } from "~/business/constant-helper";
import { USER_AGENT_BILIBILI } from "~/constants/network";
import { getCacheAudioPath } from "~/utils/file";
import { getBilisoundMetadata, getBilisoundResourceUrl } from "~/api/bilisound";
import log from "~/utils/logger";
import { isCacheExists, getCacheStatusKey } from "~/storage/cache-status";
import { URI_EXPIRE_DURATION } from "~/constants/playback";
import { getPlaylistDetail } from "~/storage/sqlite/playlist";
import { invalidateOnQueueStatus, PLAYLIST_RESTORE_LOOP_ONCE, playlistStorage } from "~/storage/playlist";
import { getResourcePolicy } from "~/features/config";
import useErrorMessageStore from "~/store/error-message";

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
 * 从视频详情页添加曲目到队列
 */
export async function addTrackFromDetail(id: string, episode: number) {
  log.debug(`用户请求增加曲目：${id} / ${episode}`);
  const existing = await Player.getTracks();
  const found = existing.findIndex(e => e.extendedData?.id === id && e.extendedData.episode === episode);
  if (found >= 0) {
    log.debug(`发现列表中已有相同曲目 ${found}，进行跳转`);
    await Player.jump(found);
    return;
  }

  const data = await getBilisoundMetadata({ id });
  const url = await getBilisoundResourceUrl(id, episode, getResourcePolicy().filterResourceURL);
  const currentEpisode = data.pages.find(e => e.page === episode);
  if (!currentEpisode) {
    throw new Error("指定视频没有指定的分 P 信息");
  }

  const trackData: TrackData = {
    uri: url.url,
    artist: data.owner.name,
    artworkUri: getImageProxyUrl(data.pic, "https://www.bilibili.com/video/" + id),
    duration: currentEpisode.duration,
    mimeType: "video/mp4",
    extendedData: {
      id,
      episode,
      isLoaded: false,
      expireAt: new Date().getTime() + URI_EXPIRE_DURATION,
      artworkUrl: data.pic,
    },
    headers: {
      referer: getVideoUrl(id, episode),
      "user-agent": USER_AGENT_BILIBILI,
    },
    id: getCacheStatusKey(id, episode),
    title: data.pages.length === 1 ? data.title : currentEpisode.part,
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
  const url = await getBilisoundResourceUrl(id, episode, getResourcePolicy().filterResourceURL);
  trackData.uri = url.url;
  trackData.extendedData!.expireAt = new Date().getTime() + URI_EXPIRE_DURATION;
  trackData.mimeType = "video/mp4";
  return trackData;
}

/**
 * 预先刷新现在播放的曲目
 */
export async function refreshCurrentTrack() {
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

  const refreshPromise = refreshCurrentTrackOnce(trackData, trackIndex);
  currentTrackRefresh = { key: refreshKey, promise: refreshPromise };
  try {
    await refreshPromise;
  } finally {
    if (currentTrackRefresh?.promise === refreshPromise) {
      currentTrackRefresh = null;
    }
  }
}

async function refreshCurrentTrackOnce(trackData: OptionalTrackData, trackIndex: number) {
  let restoreLoopOnce = false;
  let shouldResume = false;

  if (!trackData || !shouldRefreshTrack(trackData)) {
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

/**
 * 替换播放队列
 */
export async function replaceQueueWithPlaylist(id: number, index = 0) {
  const data = await getPlaylistDetail(id);
  const tracks = playlistToTracks(data);
  if (Platform.OS !== "web" && !tracks[index].extendedData?.isLoaded) {
    await refreshTrack(tracks[index]);
  }
  await Player.setQueue(tracks, index);
  await Player.play();

  // 替换队列时恢复到非随机状态（与旧版行为一致），随机顺序由 player 内部管理
  await Player.setShuffleMode(ShuffleMode.OFF);
  setQueuePlayingMode("normal");
}
