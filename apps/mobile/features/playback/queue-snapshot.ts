import * as Player from "@bilisound/player";
import { ShuffleMode } from "@bilisound/player";

import {
  clearQueuePlaybackOrder,
  QUEUE_CURRENT_INDEX,
  QUEUE_LIST,
  QUEUE_LIST_VERSION,
  queueStorage,
  setQueuePlaybackOrder,
} from "~/storage/queue";
import log from "~/utils/logger";

import { processTrackDataForSave } from "./track-data";

/**
 * 保存当前播放队列快照。
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
    savePlaybackOrder(),
  ]);
}

/**
 * 保存当前随机播放顺序，让重启后展示的队列顺序与退出前一致。
 *
 * 非随机模式下播放顺序恒等于 canonical 顺序，没有保存价值，顺手清掉。
 *
 * 这里吞掉异常：播放顺序只是展示顺序的还原信息，不值得让整个队列快照保存失败
 * （saveTrackData 会并发执行这几个任务）。
 */
export async function savePlaybackOrder() {
  try {
    if ((await Player.getShuffleMode()) !== ShuffleMode.ON) {
      clearQueuePlaybackOrder();
      return;
    }
    setQueuePlaybackOrder(await Player.getPlaybackOrder());
  } catch (e) {
    log.warn("保存随机播放顺序失败：" + e);
  }
}
