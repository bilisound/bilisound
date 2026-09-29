import * as FileSystem from "expo-file-system/legacy";

import { BILISOUND_LEGACY_PERSIST_QUEUE_URI } from "~/constants/file";
import { QUEUE_CURRENT_INDEX, QUEUE_LIST, queueStorage } from "~/storage/queue";
import log from "~/utils/logger";

export async function handleLegacyQueue() {
  if ((await FileSystem.getInfoAsync(BILISOUND_LEGACY_PERSIST_QUEUE_URI)).exists) {
    log.info("发现旧版播放队列缓存数据，正在升级……");
    const raw = await FileSystem.readAsStringAsync(BILISOUND_LEGACY_PERSIST_QUEUE_URI, { encoding: "utf8" });
    const data = JSON.parse(raw);
    const tracks = data?.tracks ?? [];
    const current = data.current;

    log.info("正在转存数据……");
    queueStorage.set(QUEUE_LIST, JSON.stringify(tracks));
    queueStorage.set(QUEUE_CURRENT_INDEX, current || 0);

    log.info("数据升级完毕，修改旧版数据文件名");
    await FileSystem.moveAsync({
      from: BILISOUND_LEGACY_PERSIST_QUEUE_URI,
      to: BILISOUND_LEGACY_PERSIST_QUEUE_URI + ".bak",
    });

    return { tracks, current };
  }
  return null;
}
