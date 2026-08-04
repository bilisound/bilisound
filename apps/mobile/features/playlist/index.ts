/**
 * features/playlist — 歌单领域的统一入口。
 *
 * 职责：本地歌单 CRUD、元数据管理、导入/导出、上游同步、搜索/编辑 hook。
 * 消费者通过此模块访问歌单能力，不再直接引用 storage/sqlite/playlist 或 schema 类型。
 *
 * 依赖方向：UI / 路由 → features/playlist；底层存储保留在 storage/sqlite。
 */

// 领域类型
export type {
  PlayableItem,
  Playlist,
  PlaylistCreateInput,
  PlaylistTrack,
  PlaylistUpdate,
  SongListItem,
} from "./models";
export type { PlaylistExport, PlaylistImportPlan } from "./exchange";
export { buildPlaylistImportPlans, playlistExportSchema } from "./exchange";

// 数据仓库
export {
  getPlaylistMetas,
  getPlaylistMeta,
  deletePlaylistMeta,
  setPlaylistMeta,
  insertPlaylistMeta,
  getPlaylistDetail,
  deletePlaylistDetail,
  addToPlaylist,
  syncPlaylistAmount,
  replacePlaylistDetail,
  quickCreatePlaylist,
  exportPlaylist,
  exportAllPlaylist,
  clonePlaylist,
  deleteAllPlaylist,
  importPlaylistBatch,
} from "./repository";

// 上游同步
export { updatePlaylist } from "./update";

// 导航辅助
export { openAddPlaylistPage } from "./misc";

// Hooks
export { usePlaylistEditor } from "./use-playlist-editor";
export { usePlaylistSearch } from "./use-playlist-search";
