import { createMMKV, useMMKVString } from "react-native-mmkv";
import type { TrackData } from "@bilisound/player/build/types";

// Storage keys
const KEYS = {
  /** 当前队列 */
  QUEUE_LIST: "queue_list",
  /** 当前队列备份（用于退出随机播放模式） */
  QUEUE_LIST_BACKUP: "queue_list_backup",
  /** 当前队列数据版本 */
  QUEUE_LIST_VERSION: "queue_list_version",
  /** 当前播放的曲目在队列中的 index */
  QUEUE_CURRENT_INDEX: "queue_current_index",
  /** 当前队列是否已经随机化 */
  QUEUE_IS_RANDOMIZED: "queue_is_randomized",
  /** 播放模式 */
  QUEUE_PLAYING_MODE: "queue_playing_mode",
} as const;

// 保持向后兼容的导出
export const QUEUE_LIST = KEYS.QUEUE_LIST;
export const QUEUE_LIST_BACKUP = KEYS.QUEUE_LIST_BACKUP;
export const QUEUE_LIST_VERSION = KEYS.QUEUE_LIST_VERSION;
export const QUEUE_CURRENT_INDEX = KEYS.QUEUE_CURRENT_INDEX;
export const QUEUE_IS_RANDOMIZED = KEYS.QUEUE_IS_RANDOMIZED;
export const QUEUE_PLAYING_MODE = KEYS.QUEUE_PLAYING_MODE;

export type QueuePlayingMode = "normal" | "shuffle";

export const queueStorage = createMMKV({ id: "storage-queue" });

/**
 * 监听播放模式（响应式）
 * @returns [当前模式, 设置模式函数]
 */
export function useQueuePlayingMode(): [QueuePlayingMode, (mode: QueuePlayingMode) => void] {
  const [value, setValue] = useMMKVString(KEYS.QUEUE_PLAYING_MODE, queueStorage);
  const mode = (value ?? "normal") as QueuePlayingMode;
  return [mode, setValue];
}

/**
 * 获取播放模式（非响应式）
 */
export function getQueuePlayingMode(): QueuePlayingMode {
  return (queueStorage.getString(KEYS.QUEUE_PLAYING_MODE) ?? "normal") as QueuePlayingMode;
}

/**
 * 设置播放模式
 */
export function setQueuePlayingMode(mode: QueuePlayingMode): void {
  queueStorage.set(KEYS.QUEUE_PLAYING_MODE, mode);
}

/**
 * 添加曲目到队列备份
 */
export function addToQueueListBackup(tracks: TrackData[]): void {
  const got = queueStorage.getString(KEYS.QUEUE_LIST_BACKUP) ?? "[]";
  const list: TrackData[] = JSON.parse(got);
  const newList = list.concat(tracks);
  queueStorage.set(KEYS.QUEUE_LIST_BACKUP, JSON.stringify(newList));
}
