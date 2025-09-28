import * as FileSystem from "expo-file-system/legacy";

import { BILISOUND_OFFLINE_URI } from "~/constants/file";
import { CACHE_STATUS_VERSION, cacheStatusStorage } from "~/storage/cache-status";
import log from "~/utils/logger";

export async function handleCacheStatus() {
  if ((cacheStatusStorage.getNumber(CACHE_STATUS_VERSION) || 0) >= 1) {
    return;
  }
  log.info("从未同步过音频缓存状态，正在初始化……");
  const fileList = await FileSystem.readDirectoryAsync(BILISOUND_OFFLINE_URI);
  const fileName = fileList.map(e => e.split(".")[0]);
  log.debug("正在录入已缓存音频列表：" + fileName);
  for (let i = 0; i < fileName.length; i++) {
    const e = fileName[i];
    cacheStatusStorage.set(e, true);
  }
  cacheStatusStorage.set(CACHE_STATUS_VERSION, 1);
}
