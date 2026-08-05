import { createMMKV } from "react-native-mmkv";

// Storage keys
const KEYS = {
  /** 当前队列（canonical 顺序） */
  QUEUE_LIST: "queue_list",
  /**
   * 随机播放顺序（canonical index 数组）
   *
   * 复用旧版 key。旧版这里存的是「打乱前的原始队列」（`TrackData[]`），
   * 现在存的是「播放顺序」（`number[]`），读取时必须校验形状后再使用。
   */
  QUEUE_LIST_BACKUP: "queue_list_backup",
  /** 当前队列数据版本 */
  QUEUE_LIST_VERSION: "queue_list_version",
  /** 当前播放的曲目在队列中的 index */
  QUEUE_CURRENT_INDEX: "queue_current_index",
  /** 播放模式（随机播放偏好的持久化来源，启动时据此重新应用 setShuffleMode） */
  QUEUE_PLAYING_MODE: "queue_playing_mode",
} as const;

// 保持向后兼容的导出
export const QUEUE_LIST = KEYS.QUEUE_LIST;
export const QUEUE_LIST_BACKUP = KEYS.QUEUE_LIST_BACKUP;
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

/**
 * 判断持久化的值是否是「播放顺序」形状。
 *
 * 旧版这个 key 存的是 `TrackData[]`，必须拒绝，否则会把曲目对象当成 index 使用。
 */
function isPlaybackOrderShape(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => Number.isInteger(item));
}

/**
 * 读取持久化的随机播放顺序。形状不符（含旧版遗留数据）时返回 null。
 */
export function getQueuePlaybackOrder(): number[] | null {
  const raw = queueStorage.getString(KEYS.QUEUE_LIST_BACKUP);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPlaybackOrderShape(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 保存随机播放顺序
 */
export function setQueuePlaybackOrder(order: number[]): void {
  queueStorage.set(KEYS.QUEUE_LIST_BACKUP, JSON.stringify(order));
}

/**
 * 清除持久化的随机播放顺序（退出随机模式、或替换队列时）
 */
export function clearQueuePlaybackOrder(): void {
  queueStorage.remove(KEYS.QUEUE_LIST_BACKUP);
}

/**
 * 持久化的值是否是旧版遗留的队列备份（而非播放顺序）
 */
export function hasLegacyQueueListBackup(): boolean {
  return queueStorage.contains(KEYS.QUEUE_LIST_BACKUP) && getQueuePlaybackOrder() === null;
}
