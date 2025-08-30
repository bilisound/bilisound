import * as Player from "@bilisound/player";
import { getCurrentTrack, getCurrentTrackIndex, getTracks, RepeatMode } from "@bilisound/player";

import {
  addToQueueListBackup,
  getQueuePlayingMode,
  QUEUE_CURRENT_INDEX,
  QUEUE_IS_RANDOMIZED,
  QUEUE_LIST,
  QUEUE_LIST_BACKUP,
  QUEUE_LIST_VERSION,
  QUEUE_PLAYING_MODE,
  queueStorage,
} from "~/storage/queue";
import { TrackData } from "@bilisound/player/build/types";
import { getImageProxyUrl, getVideoUrl } from "~/business/constant-helper";
import { USER_AGENT_BILIBILI } from "~/constants/network";
import { handleLegacyQueue } from "~/utils/migration/legacy-queue";
import { getCacheAudioPath } from "~/utils/file";
import { getBilisoundMetadata, getBilisoundResourceUrl, getBilisoundResourceUrlOnline } from "~/api/bilisound";
import log from "~/utils/logger";
import { PlaylistDetail } from "~/storage/sqlite/schema";
import { cacheStatusStorage } from "~/storage/cache-status";
import { PLACEHOLDER_AUDIO, URI_EXPIRE_DURATION } from "~/constants/playback";
import { getPlaylistDetail } from "~/storage/sqlite/playlist";
import { Platform } from "react-native";
import { invalidateOnQueueStatus, PLAYLIST_RESTORE_LOOP_ONCE, playlistStorage } from "~/storage/playlist";
import { convertToHTTPS } from "~/utils/string";
import useSettingsStore from "~/store/settings";
import useErrorMessageStore from "~/store/error-message";
import { downloadResourceNow } from "~/business/download";
import * as FileSystem from "expo-file-system";

interface TrackDataOld {
  /** The track title */
  title?: string;
  /** The track album */
  album?: string;
  /** The track artist */
  artist?: string;
  /** The track duration in seconds */
  duration?: number;
  /** The track artwork */
  artwork?: string;
  /** track description */
  description?: string;
  /** The track genre */
  genre?: string;
  /** The track release date in [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) */
  date?: string;
  /** The track rating */
  rating?: any;
  /**
   * (iOS only) Whether the track is presented in the control center as being
   * live
   **/
  isLiveStream?: boolean;
  url: string;
  type?: any;
  /** The user agent HTTP header */
  userAgent?: string;
  /** Mime type of the media file */
  contentType?: string;
  /** (iOS only) The pitch algorithm to apply to the sound. */
  pitchAlgorithm?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers?: { [key: string]: any };

  bilisoundId: string;
  bilisoundEpisode: string;
  bilisoundUniqueId: string;
  bilisoundIsLoaded: boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // [key: string]: any;
}

// 对播放队列进行保存预处理
function processTrackDataForSave(trackData: any[]) {
  trackData.forEach(e => {
    delete e.uri;
    delete e.headers;
    delete e.mimeType;
    if (e.extendedData) {
      delete e.extendedData.expireAt;
    }
  });
  return trackData;
}

// 对还原的播放队列进行使用预处理
function processTrackDataForLoad(trackData: TrackData[]) {
  trackData.forEach(e => {
    if (!e.extendedData) {
      return;
    }
    e.headers = {
      referer: getVideoUrl(e.extendedData.id, e.extendedData.episode),
      "user-agent": USER_AGENT_BILIBILI,
    };
    e.artworkUri = getImageProxyUrl(
      // 只有 Web 版需要分离原 URL 和实际 URL，且 Web 版在 v1 从未上线
      e.extendedData.artworkUrl ?? e.artworkUri,
      "https://www.bilibili.com/video/" + e.extendedData.id,
    );
    if (Platform.OS === "web") {
      e.uri = getBilisoundResourceUrlOnline(e.extendedData!.id, e.extendedData!.episode).url;
      return;
    } else {
      if (e.extendedData.isLoaded) {
        e.uri = getCacheAudioPath(e.extendedData.id, e.extendedData.episode);
        e.mimeType = "video/mp4";
      } else {
        e.uri = PLACEHOLDER_AUDIO;
      }
    }
  });
  return trackData;
}

// 播放列表转播放队列
export function playlistToTracks(playlist: PlaylistDetail[]): TrackData[] {
  return playlist.map(e => {
    const isLoaded = !!cacheStatusStorage.getBoolean(e.bvid + "_" + e.episode);

    let uri = isLoaded ? getCacheAudioPath(e.bvid, e.episode) : PLACEHOLDER_AUDIO;
    if (Platform.OS === "web") {
      uri = getBilisoundResourceUrlOnline(e.bvid, e.episode).url;
    }

    return {
      uri,
      artist: e.author,
      artworkUri: getImageProxyUrl(e.imgUrl, "https://www.bilibili.com/video/" + e.bvid),
      duration: e.duration,
      extendedData: {
        id: e.bvid,
        episode: e.episode,
        isLoaded,
        expireAt: 0,
        artworkUrl: e.imgUrl,
      },
      headers: {
        referer: getVideoUrl(e.bvid, e.episode),
        "user-agent": USER_AGENT_BILIBILI,
      },
      id: e.bvid + "_" + e.episode,
      title: e.title,
    };
  });
}

// 保存播放队列
export async function saveTrackData() {
  log.debug("正在自动保存播放队列");
  await Promise.all([
    (async () => {
      const tracks = await Player.getTracks();
      processTrackDataForSave(tracks);
      queueStorage.set(QUEUE_LIST_VERSION, 2);
      queueStorage.set(QUEUE_LIST, JSON.stringify(tracks));
    })(),
    (async () => {
      const current = await Player.getCurrentTrackIndex();
      queueStorage.set(QUEUE_CURRENT_INDEX, current || 0);
    })(),
  ]);
}

// 读取播放队列
export async function loadTrackData() {
  const version = queueStorage.getNumber(QUEUE_LIST_VERSION);

  let current = queueStorage.getNumber(QUEUE_CURRENT_INDEX) || 0;
  let trackData: TrackData[];

  switch (version) {
    // 2.x 版本
    case 2: {
      const trackRawData = queueStorage.getString(QUEUE_LIST) || "[]";
      trackData = JSON.parse(trackRawData);
      break;
    }
    // 1.x 版本（可能还有旧版 JSON 数据文件）
    default: {
      const trackRawData = queueStorage.getString(QUEUE_LIST) || "[]";
      let tracks: TrackDataOld[] = JSON.parse(trackRawData);

      if (Platform.OS !== "web") {
        const tryMigrate = await handleLegacyQueue();
        if (tryMigrate) {
          tracks = tryMigrate.tracks;
          current = tryMigrate.current;
        }
      }

      trackData = tracks.map(e => ({
        id: e.bilisoundUniqueId,
        uri: "",
        artworkUri: convertToHTTPS(e.artwork ?? ""),
        title: e.title,
        artist: e.artist,
        duration: e.duration,
        extendedData: {
          id: e.bilisoundId,
          episode: Number(e.bilisoundEpisode),
          isLoaded: e.bilisoundIsLoaded,
          expireAt: 0,
          artworkUrl: e.artwork ?? "",
        },
      }));
      break;
    }
  }
  processTrackDataForLoad(trackData);

  // 提前 refreshTrack 是为了缓解 Bilisound 播放器 iOS 版本（？）的一个 Bug：
  // 如果用户退出应用时上次播放的是没有加载过的音频，重新启动应用后会自动跳转到下一首曲目
  if (trackData.length > 0) {
    trackData[current] = await refreshTrack(trackData[current]);
    await Player.setQueue(trackData, current);
  }
}

// 读取备份播放队列（随机模式用）
export async function loadBackupTrackData() {
  const trackRawData = queueStorage.getString(QUEUE_LIST_BACKUP) || "[]";
  const trackData = JSON.parse(trackRawData) as TrackData[];
  processTrackDataForLoad(trackData);
  return trackData;
}

// 从视频详情页添加曲目到队列
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
    id: id + "_" + episode,
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

// 刷新传入的曲目对象
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
  const got = cacheStatusStorage.getBoolean(`${id}_${episode}`);
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

// 预先刷新现在播放的曲目
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
    cacheStatusStorage.getBoolean(`${trackData.extendedData.id}_${trackData.extendedData.episode}`);

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

// 替换播放队列
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

// 缓存当前曲目和下一曲目
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
    cacheStatusStorage.delete(currentTrack.extendedData.id + "_" + currentTrack.extendedData.episode);
  } catch (e) {
    log.error("错误捕获：" + e);
    useErrorMessageStore.getState().setMessage(String((e as Error)?.message || e));
    await Player.next();
  }

  await refreshCurrentTrack();
}
