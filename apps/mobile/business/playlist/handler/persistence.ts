import * as Player from "@bilisound/player";
import { Platform } from "react-native";

import type { TrackData } from "@bilisound/player/build/types";

import { QUEUE_CURRENT_INDEX, QUEUE_LIST, QUEUE_LIST_BACKUP, QUEUE_LIST_VERSION, queueStorage } from "~/storage/queue";
import { handleLegacyQueue } from "~/utils/migration/legacy-queue";
import { convertToHTTPS } from "~/utils/string";
import log from "~/utils/logger";

import type { TrackDataOld } from "./types";
import { processTrackDataForLoad, processTrackDataForSave } from "./track-data";
import { refreshTrack } from "./track-operations";

/**
 * 保存播放队列
 */
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

/**
 * 读取播放队列
 */
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

/**
 * 读取备份播放队列（随机模式用）
 */
export async function loadBackupTrackData() {
  const trackRawData = queueStorage.getString(QUEUE_LIST_BACKUP) || "[]";
  const trackData = JSON.parse(trackRawData) as TrackData[];
  processTrackDataForLoad(trackData);
  return trackData;
}
