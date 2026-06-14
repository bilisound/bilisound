import { createMMKV } from "react-native-mmkv";

// Storage keys
const KEYS = {
  /** 当前队列 */
  QUEUE_LIST: "queue_list",
  /** 当前队列数据版本 */
  QUEUE_LIST_VERSION: "queue_list_version",
  /** 当前播放的曲目在队列中的 index */
  QUEUE_CURRENT_INDEX: "queue_current_index",
  /** 播放模式（随机播放偏好的持久化来源，启动时据此重新应用 setShuffleMode） */
  QUEUE_PLAYING_MODE: "queue_playing_mode",
} as const;

// 保持向后兼容的导出
export const QUEUE_LIST = KEYS.QUEUE_LIST;
export const QUEUE_LIST_VERSION = KEYS.QUEUE_LIST_VERSION;
export const QUEUE_CURRENT_INDEX = KEYS.QUEUE_CURRENT_INDEX;
export const QUEUE_PLAYING_MODE = KEYS.QUEUE_PLAYING_MODE;

export type QueuePlayingMode = "normal" | "shuffle";

export const queueStorage = createMMKV({ id: "storage-queue" });

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
