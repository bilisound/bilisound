import * as Player from "@bilisound/player";
import { ShuffleMode, type TrackData } from "@bilisound/player";
import { Platform } from "react-native";

import {
  clearQueuePlaybackOrder,
  getQueuePlaybackOrder,
  getQueuePlayingMode,
  QUEUE_CURRENT_INDEX,
  QUEUE_LIST,
  QUEUE_LIST_VERSION,
  queueStorage,
} from "~/storage/queue";
import { handleLegacyQueue } from "~/utils/migration/legacy-queue";
import { cleanupLegacyShuffleKeys } from "~/utils/migration/shuffle-queue";
import log from "~/utils/logger";
import { convertToHTTPS } from "~/utils/string";

import type { TrackDataOld } from "./types";
import { processTrackDataForLoad } from "./track-data";
import { refreshTrack } from "./track-operations";

export { saveTrackData } from "./queue-snapshot";

/**
 * 读取播放队列
 */
export async function loadTrackData() {
  // 先清理旧版遗留数据，这样后面读取随机播放顺序时不会遇到旧形状的值
  cleanupLegacyShuffleKeys();

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
    await Player.setQueueWithOptions(trackData, {
      beginIndex: current,
      preservePlaybackState: false,
    });

    // v3 起随机播放由 player 内部管理。根据持久化的偏好重新应用随机模式：
    // 当前曲目会被固定在播放顺序首位，播放进度不受影响。
    if (getQueuePlayingMode() === "shuffle") {
      await Player.setShuffleMode(ShuffleMode.ON);
      await restorePlaybackOrder(trackData.length);
    } else {
      clearQueuePlaybackOrder();
    }
  }
}

/**
 * 还原上次退出时的随机播放顺序，让重启后看到的队列顺序与之前一致。
 *
 * 必须在 `setShuffleMode(ON)` 之后调用：开启随机模式会先生成一份新的随机顺序，
 * 这里再用持久化的顺序覆盖它。
 */
async function restorePlaybackOrder(queueLength: number) {
  const persisted = getQueuePlaybackOrder();
  if (!persisted) {
    return;
  }
  if (!isCanonicalPermutation(persisted, queueLength)) {
    // 队列在上次保存之后变过（例如歌单同步新增曲目），或数据已损坏，旧顺序不再适用
    log.info("持久化的随机播放顺序与当前队列不匹配，改用新生成的顺序");
    clearQueuePlaybackOrder();
    return;
  }

  const restored = await Player.setPlaybackOrder(persisted);
  if (!restored) {
    log.warn("随机播放顺序还原失败，改用新生成的顺序");
    clearQueuePlaybackOrder();
  }
}

/**
 * 播放顺序必须是 canonical index 的一个完整排列，否则会有曲目无法被访问到。
 */
function isCanonicalPermutation(order: number[], size: number): boolean {
  if (order.length !== size) {
    return false;
  }
  const seen = new Set<number>();
  for (const index of order) {
    if (index < 0 || index >= size || seen.has(index)) {
      return false;
    }
    seen.add(index);
  }
  return true;
}
