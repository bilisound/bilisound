import omit from "lodash/omit";

import { PlaylistDetail, PlaylistDetailInsert, PlaylistImport, PlaylistMeta, PlaylistMetaInsert } from "./schema";

import { idb } from "~/storage/sqlite/init-web";
import { PlaylistSource } from "~/typings/playlist";

// ============================================================================
// 歌单元数据部分
// ============================================================================

export async function getPlaylistMetas(filterHasSource = false): Promise<PlaylistMeta[]> {
  const allMetas = await idb.getAll("playlistMeta");
  if (filterHasSource) {
    return allMetas
      .filter(meta => meta.source === null)
      .map(e => ({
        ...e,
        id: e.id ?? 0,
        imgUrl: e.imgUrl ? e.imgUrl : null,
        description: e.description ? e.description : null,
        source: e.source ? e.source : null,
        filterRules: e.filterRules ? e.filterRules : null,
        extendedData: e.extendedData ? e.extendedData : null,
      }));
  }
  return allMetas.map(e => ({
    ...e,
    id: e.id ?? 0,
    imgUrl: e.imgUrl ? e.imgUrl : null,
    description: e.description ? e.description : null,
    source: e.source ? e.source : null,
    filterRules: e.filterRules ? e.filterRules : null,
    extendedData: e.extendedData ? e.extendedData : null,
  }));
}

export async function getPlaylistMeta(id: number): Promise<[PlaylistMeta] | undefined> {
  const e = await idb.get("playlistMeta", id);
  if (!e) {
    return undefined;
  }
  return [
    {
      ...e,
      id: e.id ?? 0,
      imgUrl: e.imgUrl ? e.imgUrl : null,
      description: e.description ? e.description : null,
      source: e.source ? e.source : null,
      filterRules: e.filterRules ? e.filterRules : null,
      extendedData: e.extendedData ? e.extendedData : null,
    },
  ];
}

export async function deletePlaylistMeta(id: number) {
  await idb.delete("playlistMeta", id);
  const tx = idb.transaction("playlistDetail", "readwrite");
  const index = tx.store.index("by-playlistId");
  let cursor = await index.openCursor(id);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
}

export async function setPlaylistMeta(meta: Partial<PlaylistMetaInsert> & { id: number }) {
  const existingMeta = await idb.get("playlistMeta", meta.id);
  if (existingMeta) {
    await idb.put("playlistMeta", { ...existingMeta, ...omit(meta, ["id"]) });
  }
}

export async function insertPlaylistMeta(meta: PlaylistMetaInsert) {
  return { lastInsertRowId: await idb.add("playlistMeta", { ...meta }) };
}

// ============================================================================
// 歌单列表部分
// ============================================================================

export async function getPlaylistDetail(playlistId: number) {
  return idb.getAllFromIndex("playlistDetail", "by-playlistId", playlistId);
}

export async function deletePlaylistDetail(id: number) {
  return idb.delete("playlistDetail", id);
}

// ============================================================================
// 复杂操作部分
// ============================================================================

export async function addToPlaylist(playlistId: number, playlist: PlaylistDetailInsert[]) {
  const tx = idb.transaction("playlistDetail", "readwrite");
  for (const item of playlist) {
    await tx.store.add({ ...omit(item, "id"), playlistId });
  }
  await tx.done;
}

export async function syncPlaylistAmount(playlistId: number) {
  const count = await idb.countFromIndex("playlistDetail", "by-playlistId", playlistId);
  await setPlaylistMeta({
    id: playlistId,
    amount: count,
  });
}

export async function replacePlaylistDetail(playlistId: number, playlist: PlaylistDetailInsert[]) {
  const tx = idb.transaction(["playlistDetail", "playlistMeta"], "readwrite");
  const index = tx.objectStore("playlistDetail").index("by-playlistId");
  let cursor = await index.openCursor(playlistId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  for (const item of playlist) {
    await tx.objectStore("playlistDetail").add({ ...omit(item, "id"), playlistId });
  }
  const meta = await tx.objectStore("playlistMeta").get(playlistId);
  if (meta) {
    meta.amount = playlist.length;
    await tx.objectStore("playlistMeta").put(meta);
  }
  await tx.done;
}

export async function quickCreatePlaylist(
  title: string,
  description: string,
  list: PlaylistDetail[],
  source?: PlaylistSource,
  imgUrl?: string,
) {
  const newPlaylist: PlaylistMetaInsert = {
    title,
    description,
    imgUrl,
    color:
      "#" +
      Math.floor(Math.random() * 16777216)
        .toString(16)
        .padStart(6, "0"),
    amount: list.length,
    source: source && list.length > 1 ? JSON.stringify(source) : null,
  };
  const playlistId = await idb.add("playlistMeta", newPlaylist);
  const tx = idb.transaction("playlistDetail", "readwrite");
  for (const item of list) {
    await tx.store.add({ ...omit(item, "id"), playlistId });
  }
  await tx.done;
  return playlistId;
}

export async function exportPlaylist(id: number): Promise<PlaylistImport> {
  const meta = await idb.get("playlistMeta", id);
  const detail = await idb.getAllFromIndex("playlistDetail", "by-playlistId", id);
  return {
    meta: meta ? [meta] : [],
    detail,
    kind: "moe.bilisound.app.exportedPlaylist",
    version: 1,
  };
}

export async function exportAllPlaylist(): Promise<PlaylistImport> {
  const meta = await idb.getAll("playlistMeta");
  const detail = await idb.getAll("playlistDetail");
  return {
    meta,
    detail,
    kind: "moe.bilisound.app.exportedPlaylist",
    version: 1,
  };
}

export async function clonePlaylist(playlistId: number) {
  const originalMeta = await idb.get("playlistMeta", playlistId);
  if (!originalMeta) return;

  const newMeta = {
    ...originalMeta,
    title: `${originalMeta.title}（副本）`,
  };
  delete newMeta.id;

  const newPlaylistId = await idb.add("playlistMeta", newMeta);
  const originalDetails = await idb.getAllFromIndex("playlistDetail", "by-playlistId", playlistId);
  const tx = idb.transaction("playlistDetail", "readwrite");
  for (const detail of originalDetails) {
    const newDetail = { ...detail, playlistId: newPlaylistId };
    delete newDetail.id;
    await tx.store.add(newDetail);
  }
  await tx.done;

  return newPlaylistId;
}

export async function deleteAllPlaylist() {
  await idb.clear("playlistDetail");
  await idb.clear("playlistMeta");
}
