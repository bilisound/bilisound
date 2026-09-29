import * as FileSystem from "expo-file-system/legacy";
import path from "path-browserify";
import { Platform } from "react-native";

import { BILISOUND_OFFLINE_URI, BILISOUND_PROCESS_URI } from "~/constants/file";
import { uriToPath } from "~/utils/file";

// 注意：cleanAudioCache 中直接使用 cacheStatusStorage.remove()，因为 key 是从文件名解析的
import { cacheStatusStorage } from "./cache-status";

export function getCacheAudioPath(id: string, episode: number, isTemp = false) {
  if (isTemp) {
    return `${BILISOUND_PROCESS_URI}/${id}_${episode}.tmp`;
  }
  return `${BILISOUND_OFFLINE_URI}/${id}_${episode}.m4a`;
}

interface CheckDirectorySizeOptions {
  fileFilter?: (fileName: string, index: number, fileList: string[]) => boolean;
}

async function checkDirectorySizeByUri(uri: string, options: CheckDirectorySizeOptions = {}) {
  let items = (await FileSystem.readDirectoryAsync(uri)).map(e => {
    return uri + "/" + encodeURI(e);
  });
  if (options.fileFilter) {
    items = items.filter(options.fileFilter);
  }
  let totalSize = 0;
  for (let i = 0; i < items.length; i++) {
    const meta = await FileSystem.getInfoAsync(items[i]);
    if (meta.exists) {
      totalSize += meta.size;
    }
  }
  return totalSize;
}

/**
 * 统计离线缓存占用空间。
 * @param keepKeys 仍在被引用的缓存 key（`${id}_${episode}`），这些文件计入占用但不计入可清除空间
 */
export async function getAudioCacheSize(keepKeys: string[]) {
  if (Platform.OS === "web") {
    return { cacheSize: 0, cacheFreeSize: 0 };
  }
  const cacheSize = await checkDirectorySizeByUri(BILISOUND_OFFLINE_URI);
  const cacheFreeSize = await checkDirectorySizeByUri(BILISOUND_OFFLINE_URI, {
    fileFilter(fileName) {
      const name = path.parse(uriToPath(fileName)).name;
      return !keepKeys.includes(name);
    },
  });
  return { cacheSize, cacheFreeSize };
}

/**
 * 清除未被引用的离线音频缓存。
 * @param keepKeys 需要保留的缓存 key（`${id}_${episode}`），通常为当前播放队列引用的曲目
 */
export async function cleanAudioCache(keepKeys: string[]) {
  if (Platform.OS === "web") {
    return;
  }
  const items = (await FileSystem.readDirectoryAsync(BILISOUND_OFFLINE_URI))
    .map(e => {
      return BILISOUND_OFFLINE_URI + "/" + encodeURI(e);
    })
    .filter(fileName => {
      const name = path.parse(uriToPath(fileName)).name;
      return !keepKeys.includes(name);
    });
  for (let i = 0; i < items.length; i++) {
    const name = path.parse(uriToPath(items[i])).name;
    await FileSystem.deleteAsync(items[i]);
    cacheStatusStorage.remove(name);
  }
}
