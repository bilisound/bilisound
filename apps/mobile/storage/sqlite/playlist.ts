import { eq, count as countFunc, sql, isNull, or } from "drizzle-orm";
import omit from "lodash/omit";

import {
  PlaylistDetail,
  playlistDetail,
  PlaylistDetailInsert,
  PlaylistImport,
  PlaylistMeta,
  playlistMeta,
  PlaylistMetaInsert,
} from "./schema";

import { db } from "~/storage/sqlite/main";
import { PlaylistSource } from "~/typings/playlist";

// ============================================================================
// 歌单元数据部分
// ============================================================================

/**
 * 查询歌单元数据列表
 */
export async function getPlaylistMetas(filterHasSource = false): Promise<PlaylistMeta[]> {
  if (filterHasSource) {
    return db
      .select()
      .from(playlistMeta)
      .where(or(isNull(playlistMeta.source), eq(playlistMeta.source, "")));
  }
  return db.select().from(playlistMeta);
}

/**
 * 查询歌单元数据
 * @param id
 */
export async function getPlaylistMeta(id: number): Promise<PlaylistMeta[]> {
  return db.select().from(playlistMeta).where(eq(playlistMeta.id, id));
}

/**
 * 删除歌单元数据
 * @param id
 */
export async function deletePlaylistMeta(id: number) {
  await db.delete(playlistMeta).where(eq(playlistMeta.id, id));
  await db.delete(playlistDetail).where(eq(playlistDetail.playlistId, id));
}

/**
 * 修改歌单元数据
 * @param meta
 */
export async function setPlaylistMeta(meta: Partial<PlaylistMetaInsert> & { id: number }) {
  await db
    .update(playlistMeta)
    .set(omit(meta, ["id"]))
    .where(eq(playlistMeta.id, meta.id));
}

/**
 * 插入歌单元数据
 * @param meta
 */
export async function insertPlaylistMeta(meta: PlaylistMetaInsert) {
  return db.insert(playlistMeta).values(meta);
}

// ============================================================================
// 歌单列表部分
// ============================================================================

/**
 * 获取歌单列表
 * @param playlistId
 */
export async function getPlaylistDetail(playlistId: number) {
  return db.select().from(playlistDetail).where(eq(playlistDetail.playlistId, playlistId));
}

/**
 * 删除歌单列表项
 * @param id
 */
export async function deletePlaylistDetail(id: number) {
  return db.delete(playlistDetail).where(eq(playlistDetail.id, id));
}

// ============================================================================
// 复杂操作部分
// ============================================================================

/**
 * 添加一首或多首曲目到已有的播放列表
 * @param playlistId
 * @param playlist
 */
export async function addToPlaylist(playlistId: number, playlist: PlaylistDetailInsert[]) {
  const parsedPlaylist = playlist.map(e => omit({ ...e, playlistId }, "id"));
  await db.insert(playlistDetail).values(parsedPlaylist);
}

/**
 * 同步指定播放列表的曲目数量
 * @param playlistId
 */
export async function syncPlaylistAmount(playlistId: number) {
  const countResponse = await db
    .select({ count: countFunc() })
    .from(playlistDetail)
    .where(eq(playlistDetail.playlistId, playlistId));
  const amount = countResponse[0].count;
  await setPlaylistMeta({
    id: playlistId,
    amount,
  });
}

/**
 * 用另一个播放列表详情完全替换播放列表
 * @param playlistId
 * @param playlist
 */
export function replacePlaylistDetail(playlistId: number, playlist: PlaylistDetailInsert[]) {
  db.transaction(tx => {
    tx.delete(playlistDetail).where(eq(playlistDetail.playlistId, playlistId)).run();
    tx.insert(playlistDetail).values(playlist).run();
    tx.update(playlistMeta)
      .set({
        amount: playlist.length,
      })
      .where(eq(playlistMeta.id, playlistId))
      .run();
  });
}

/**
 * 从多首曲目快速创建新的播放列表
 * @param title
 * @param description
 * @param list
 * @param source
 * @param imgUrl
 */
export async function quickCreatePlaylist(
  title: string,
  description: string,
  list: PlaylistDetail[],
  source?: PlaylistSource,
  imgUrl?: string,
) {
  // 在 playlistMeta 表中创建新的播放列表
  const newPlaylist = await db
    .insert(playlistMeta)
    .values({
      title,
      description,
      imgUrl,
      color:
        "#" +
        Math.floor(Math.random() * 16777216)
          .toString(16)
          .padStart(6, "0"), // 生成随机颜色
      amount: list.length,
      source: source && list.length > 1 ? JSON.stringify(source) : null,
    })
    .returning();

  const playlistId = newPlaylist[0].id;

  // 将 list 中的数据插入到 playlistDetail 表
  const builtList = list.map(e => omit({ ...e, playlistId }, "id"));
  await db.insert(playlistDetail).values(builtList);

  return playlistId;
}

/**
 * 导出播放列表
 * @param id
 */
export async function exportPlaylist(id: number): Promise<PlaylistImport> {
  const meta = await db.select().from(playlistMeta).where(eq(playlistMeta.id, id));
  const detail = await db.select().from(playlistDetail).where(eq(playlistDetail.playlistId, id));
  return {
    meta,
    detail,
    kind: "moe.bilisound.app.exportedPlaylist",
    version: 1,
  };
}

/**
 * 导出全部播放列表
 */
export async function exportAllPlaylist(): Promise<PlaylistImport> {
  const meta = await db.select().from(playlistMeta);
  const detail = await db.select().from(playlistDetail);
  return {
    meta,
    detail,
    kind: "moe.bilisound.app.exportedPlaylist",
    version: 1,
  };
}

/**
 * 克隆播放列表
 */
export async function clonePlaylist(playlistId: number) {
  // 开始事务
  return db.transaction(async tx => {
    // 克隆 playlist_meta
    const clonedMeta = tx.run(
      sql`INSERT INTO playlist_meta (title, color, amount, img_url, description, source, extended_data)
                SELECT title || '（副本）', color, amount, img_url, description, source, extended_data
                FROM playlist_meta
                WHERE id = ${playlistId}`,
    );
    const newPlaylistId = clonedMeta.lastInsertRowId;

    // 克隆 playlist_detail
    tx.run(
      sql`INSERT INTO playlist_detail (playlist_id, author, bvid, duration, episode, title, img_url, extended_data)
                SELECT ${newPlaylistId}, author, bvid, duration, episode, title, img_url, extended_data
                FROM playlist_detail
                WHERE playlist_id = ${playlistId}`,
    );

    // 更新新播放列表的 amount
    tx.run(
      sql`UPDATE playlist_meta
                SET amount = (SELECT COUNT(*) FROM playlist_detail WHERE playlist_id = ${newPlaylistId})
                WHERE id = ${newPlaylistId}`,
    );

    return newPlaylistId;
  });
}

/**
 * 删除全部歌单
 */
export async function deleteAllPlaylist() {
  await db.delete(playlistDetail);
  await db.delete(playlistMeta);
}
