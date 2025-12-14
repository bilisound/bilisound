import { createMMKV, useMMKVBoolean } from "react-native-mmkv";

export interface CacheMetadata {
  name: string;
  subName: string;
}

export const CACHE_STATUS_VERSION = "cache_status_version";

// 键格式：[BV 号]_[分 P 编号]
export const cacheStatusStorage = createMMKV({ id: "cache-status" });

/**
 * 生成缓存状态的 key
 */
export function getCacheStatusKey(id: string, episode: string | number): string {
  return `${id}_${episode}`;
}

/**
 * 监听指定资源的缓存状态（响应式）
 * @returns 缓存是否存在，参数无效时返回 undefined
 */
export function useCacheExists(id?: string, episode?: string | number): boolean | undefined {
  const key = id && episode != null ? getCacheStatusKey(id, episode) : "";
  const [exists] = useMMKVBoolean(key, cacheStatusStorage);
  // 参数无效时返回 undefined
  if (!id || episode == null) {
    return undefined;
  }
  return exists;
}

/**
 * 获取指定资源的缓存状态（非响应式）
 */
export function isCacheExists(id: string, episode: string | number = 1): boolean | undefined {
  return cacheStatusStorage.getBoolean(getCacheStatusKey(id, episode));
}

/**
 * 设置指定资源的缓存状态
 */
export function setCacheExists(id: string, episode: string | number, exists: boolean): void {
  cacheStatusStorage.set(getCacheStatusKey(id, episode), exists);
}

/**
 * 删除指定资源的缓存状态
 */
export function deleteCacheStatus(id: string, episode: string | number): void {
  cacheStatusStorage.remove(getCacheStatusKey(id, episode));
}
