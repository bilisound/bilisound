import { createMMKV, useMMKVString } from "react-native-mmkv";

// 当前队列
export const QUEUE_LIST = "queue_list";

// 当前队列备份（用于退出随机播放模式）
export const QUEUE_LIST_BACKUP = "queue_list_backup";

// 当前队列数据版本
export const QUEUE_LIST_VERSION = "queue_list_version";

// 当前播放的曲目在队列中的 index
export const QUEUE_CURRENT_INDEX = "queue_current_index";

// 当前队列是否已经随机化
export const QUEUE_IS_RANDOMIZED = "queue_is_randomized";

// 播放模式
export const QUEUE_PLAYING_MODE = "queue_playing_mode";

export type QueuePlayingMode = "normal" | "shuffle";

export const queueStorage = createMMKV({ id: "storage-queue" });

export function useQueuePlayingMode() {
  return useMMKVString(QUEUE_PLAYING_MODE, queueStorage);
}

export function getQueuePlayingMode() {
  return (queueStorage.getString(QUEUE_PLAYING_MODE) ?? "normal") as QueuePlayingMode;
}

export function addToQueueListBackup(tracks: any[]) {
  const got = queueStorage.getString(QUEUE_LIST_BACKUP) ?? "[]";
  const list: any[] = JSON.parse(got); // Track
  const newList = list.concat(tracks);
  queueStorage.set(QUEUE_LIST_BACKUP, JSON.stringify(newList));
}
