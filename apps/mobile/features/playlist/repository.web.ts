import * as playlistStorage from "~/storage/sqlite/playlist";

import type { PlaylistRepository } from "./repository-contract";

const repository: PlaylistRepository = {
  getPlaylistMetas: async filterHasSource => playlistStorage.getPlaylistMetas(filterHasSource),
  getPlaylistMeta: async id => (await playlistStorage.getPlaylistMeta(id)) ?? [],
  deletePlaylistMeta: async id => {
    await playlistStorage.deletePlaylistMeta(id);
  },
  setPlaylistMeta: async meta => {
    await playlistStorage.setPlaylistMeta(meta);
  },
  insertPlaylistMeta: async meta => {
    const result = await playlistStorage.insertPlaylistMeta(meta);
    return { lastInsertRowId: result.lastInsertRowId };
  },
  getPlaylistDetail: async playlistId => playlistStorage.getPlaylistDetail(playlistId),
  deletePlaylistDetail: async id => {
    await playlistStorage.deletePlaylistDetail(id);
  },
  addToPlaylist: async (playlistId, playlist) => {
    await playlistStorage.addToPlaylist(playlistId, playlist);
  },
  syncPlaylistAmount: async playlistId => {
    await playlistStorage.syncPlaylistAmount(playlistId);
  },
  replacePlaylistDetail: async (playlistId, playlist) => {
    await playlistStorage.replacePlaylistDetail(playlistId, playlist);
  },
  quickCreatePlaylist: async (title, description, list, source, imgUrl) =>
    playlistStorage.quickCreatePlaylist(title, description, list, source, imgUrl),
  exportPlaylist: async id => playlistStorage.exportPlaylist(id),
  exportAllPlaylist: async () => playlistStorage.exportAllPlaylist(),
  clonePlaylist: async playlistId => {
    const clonedPlaylistId = await playlistStorage.clonePlaylist(playlistId);
    if (clonedPlaylistId === undefined) {
      throw new Error(`Playlist ${playlistId} not found`);
    }
    return clonedPlaylistId;
  },
  deleteAllPlaylist: async () => {
    await playlistStorage.deleteAllPlaylist();
  },
  importPlaylistBatch: async plans => {
    for (const { meta, detail } of plans) {
      const { lastInsertRowId } = await playlistStorage.insertPlaylistMeta({
        ...meta,
        amount: detail.length,
        id: undefined,
      });
      await playlistStorage.addToPlaylist(
        lastInsertRowId,
        detail.map(item => ({ ...item, playlistId: lastInsertRowId })),
      );
    }
  },
};

export const {
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
} = repository;
