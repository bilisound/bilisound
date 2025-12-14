import * as Player from "@bilisound/player";
import { RepeatMode } from "@bilisound/player";
import { Platform } from "react-native";

import type { TrackData } from "@bilisound/player/build/types";

import {
  addToQueueListBackup,
  getQueuePlayingMode,
  QUEUE_IS_RANDOMIZED,
  QUEUE_LIST_BACKUP,
  QUEUE_PLAYING_MODE,
  queueStorage,
} from "~/storage/queue";
import { getImageProxyUrl, getVideoUrl } from "~/business/constant-helper";
import { USER_AGENT_BILIBILI } from "~/constants/network";
import { getCacheAudioPath } from "~/utils/file";
import { getBilisoundMetadata, getBilisoundResourceUrl } from "~/api/bilisound";
import log from "~/utils/logger";
import { isCacheExists, getCacheStatusKey } from "~/storage/cache-status";
import { URI_EXPIRE_DURATION } from "~/constants/playback";
import { getPlaylistDetail } from "~/storage/sqlite/playlist";
import { invalidateOnQueueStatus, PLAYLIST_RESTORE_LOOP_ONCE, playlistStorage } from "~/storage/playlist";
import useSettingsStore from "~/store/settings";
import useErrorMessageStore from "~/store/error-message";

import { playlistToTracks, processTrackDataForSave } from "./track-data";

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
  const url = await getBilisoundResourceUrl(id, episode, useSettingsStore.getState().filterResourceURL);
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
  if (getQueuePlayingMode() === "shuffle") {
    addToQueueListBackup([trackData]);
  }
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
  const url = await getBilisoundResourceUrl(id, episode, useSettingsStore.getState().filterResourceURL);
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

  // 未缓存音频 URL 刷新条件：trackData 有效、未加载、已过期
  const updateCondition =
    trackData && !trackData.extendedData?.isLoaded && (trackData.extendedData?.expireAt ?? 0) <= new Date().getTime();

  // 未缓存音频 URL 事后缓存刷新条件：trackData 有效、未加载、有缓存记录
  const toPersistentCondition =
    trackData?.extendedData &&
    !trackData.extendedData.isLoaded &&
    isCacheExists(trackData.extendedData.id, trackData.extendedData.episode);

  if (toPersistentCondition || updateCondition) {
    if ((await Player.getRepeatMode()) === RepeatMode.ONE) {
      // 缓解 Android 端特有的 bug：在单曲循环模式下切歌到会被触发替换操作的歌曲，会在歌曲被替换后自动跳转回第一首
      playlistStorage.set(PLAYLIST_RESTORE_LOOP_ONCE, true);
      await Player.setRepeatMode(RepeatMode.OFF);
    }

    log.debug("进行曲目替换操作");
    try {
      await Player.replaceTrack(trackIndex, await refreshTrack(trackData));
    } catch (e) {
      log.error("错误捕获：" + e);
      useErrorMessageStore.getState().setMessage(String((e as Error)?.message || e));
      await Player.next();
    }
  }

  if (playlistStorage.getBoolean(PLAYLIST_RESTORE_LOOP_ONCE)) {
    await Player.setRepeatMode(RepeatMode.ONE);
    playlistStorage.set(PLAYLIST_RESTORE_LOOP_ONCE, false);
  }
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

  // 恢复到非随机状态
  queueStorage.set(QUEUE_PLAYING_MODE, "normal");
  queueStorage.set(QUEUE_IS_RANDOMIZED, false);
  queueStorage.set(QUEUE_LIST_BACKUP, JSON.stringify(processTrackDataForSave(tracks)));
}
