/**
 * features/playlist/models — 歌单领域类型。
 *
 * 当前阶段直接复用 storage/sqlite/schema 的推断类型，通过 feature 边界导出，
 * 使消费者不再直接引用 storage 层。未来如果 schema 与 domain model 分离，
 * 此文件是唯一需要修改的映射点。
 */

export type {
  PlaylistMeta,
  PlaylistDetail,
  PlaylistMetaInsert,
  PlaylistDetailInsert,
  PlaylistImport,
} from "~/storage/sqlite/schema";

export { playlistImportSchema } from "~/storage/sqlite/schema";
