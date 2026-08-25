/**
 * features/playback — 播放用例编排的统一入口。
 *
 * 职责：将 playlist / player / cache / config / bilibili 的协调从路由文件与歌单
 * 领域模块中移出，暴露面向用例的 API：播放歌单、播放分 P、队列持久化与会话恢复、
 * 随机模式切换、缓存协调、后台事件注册。
 *
 * 依赖方向：UI / 业务层 → features/playback；播放器机制保留在 @bilisound/player。
 */

// 播放用例
export {
  playEpisode,
  playPlaylist,
  playNextTrack,
  appendPlaylistToCurrentQueue,
  refreshTrack,
  refreshCurrentTrack,
} from "./track-operations";

// 队列持久化 / 播放会话恢复
export { saveTrackData, loadTrackData } from "./queue-persistence";

// 缓存协调
export {
  saveCurrentAndNextTrack,
  deleteCurrentTrackCache,
  getAudioCacheSizeInfo,
  cleanOfflineAudioCache,
} from "./cache";

// 随机播放模式切换（持久化用户偏好）
export { toggleShuffleMode } from "./shuffle";

// 后台播放事件
export { registerPlaybackBackgroundEvents } from "./background";

// 歌单详情页播放用例 hook
export { usePlaylistPlayer } from "./use-playlist-player";
