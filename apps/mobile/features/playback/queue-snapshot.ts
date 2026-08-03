import * as Player from "@bilisound/player";

import { QUEUE_CURRENT_INDEX, QUEUE_LIST, QUEUE_LIST_VERSION, queueStorage } from "~/storage/queue";
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
  ]);
}
