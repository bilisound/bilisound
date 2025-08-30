import { MMKV, useMMKVBoolean, useMMKVObject } from "react-native-mmkv";

import { PlaylistMeta } from "~/storage/sqlite/schema";

export const LEGACY_PLAYLIST_INDEX_KEY = "playlist_index";

export const LEGACY_PLAYLIST_ITEM_KEY_PREFIX = "playlist_item_";

export const PLAYLIST_ON_QUEUE = "playlist_on_queue";

// 播放列表数据库版本
export const PLAYLIST_DB_VERSION = "playlist_db_version";

export const PLAYLIST_RESTORE_LOOP_ONCE = "playlist_restore_loop_once";

export interface LegacyPlaylistMeta {
  id: string;
  title: string;
  color: string;
  amount: number;
  createFromQueue?: boolean;
}

export interface LegacyPlaylistDetailRow {
  author: string;
  bvid: string;
  duration: number;
  episode: number;
  title: string;
  imgUrl: string;
}

export const playlistStorage = new MMKV({ id: "storage-playlist" });

export function usePlaylistOnQueue() {
  return useMMKVObject<{ value?: PlaylistMeta | undefined }>(PLAYLIST_ON_QUEUE, playlistStorage);
}

export function invalidateOnQueueStatus() {
  playlistStorage.set(PLAYLIST_ON_QUEUE, "{}");
}

export function usePlaylistRestoreLoopOnceFlag() {
  return useMMKVBoolean(PLAYLIST_RESTORE_LOOP_ONCE, playlistStorage);
}
