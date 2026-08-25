/**
 * features/playback/queue-ownership — 播放队列隶属歌单的状态访问。
 *
 * 队列隶属标记（PLAYLIST_ON_QUEUE）与单曲循环一次性恢复标记
 * （PLAYLIST_RESTORE_LOOP_ONCE）是 playback 编排的内部状态，持久化在
 * storage/playlist 的 MMKV 中。UI 层通过此模块访问，不再直接 import
 * ~/storage/playlist。
 *
 * 持久化契约稳定：PLAYLIST_ON_QUEUE 的 "playlist_on_queue" key、
 * "storage-playlist" MMKV id、{ value?: { id } } JSON 形状保持不变。
 */

import { PLAYLIST_ON_QUEUE, playlistStorage, usePlaylistRestoreLoopOnceFlag } from "~/storage/playlist";

export { usePlaylistRestoreLoopOnceFlag };

/**
 * 当前播放队列隶属的歌单 id；队列未与任何歌单绑定时返回 undefined
 */
export function getQueueOwnerPlaylistId(): number | undefined {
  const owner = JSON.parse(playlistStorage.getString(PLAYLIST_ON_QUEUE) ?? "{}") as {
    value?: { id?: number };
  };
  return owner.value?.id;
}

/**
 * 清空当前播放队列的歌单隶属标记
 */
export function invalidateQueueOwnership() {
  playlistStorage.set(PLAYLIST_ON_QUEUE, "{}");
}
