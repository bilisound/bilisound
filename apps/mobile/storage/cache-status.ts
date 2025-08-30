import { MMKV, useMMKVBoolean } from "react-native-mmkv";

export interface CacheMetadata {
  name: string;
  subName: string;
}

export const CACHE_INVALID_KEY_DO_NOT_USE = "cache_invalid_key_do_not_use";

export const CACHE_STATUS_VERSION = "cache_status_version";

// 键格式：[BV 号]_[分 P 编号]
export const cacheStatusStorage = new MMKV({ id: "cache-status" });

export function useCacheExists(id?: string, episode?: string | number) {
  return useMMKVBoolean(id + "_" + episode, cacheStatusStorage)[0];
}

export function isCacheExists(id: string, episode: string | number = 1) {
  return cacheStatusStorage.getBoolean(id + "_" + episode);
}
