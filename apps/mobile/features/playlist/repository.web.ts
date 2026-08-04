import * as playlistStorage from "~/storage/sqlite/playlist";

import { playlistExportSchema } from "./exchange";
import {
  toPlaylist,
  toPlaylistDetailInsert,
  toPlaylistMetaInsert,
  toPlaylistMetaUpdate,
  toPlaylistTrack,
} from "./mappers";
import type { PlaylistRepository } from "./repository-contract";

const repository: PlaylistRepository = {
  getPlaylistMetas: async filterHasSource => (await playlistStorage.getPlaylistMetas(filterHasSource)).map(toPlaylist),
  getPlaylistMeta: async id => {
    const row = (await playlistStorage.getPlaylistMeta(id))?.[0];
    return row ? toPlaylist(row) : null;
  },
  deletePlaylistMeta: async id => {
    await playlistStorage.deletePlaylistMeta(id);
  },
  setPlaylistMeta: async meta => {
    await playlistStorage.setPlaylistMeta(toPlaylistMetaUpdate(meta));
  },
  insertPlaylistMeta: async meta => {
    const result = await playlistStorage.insertPlaylistMeta(toPlaylistMetaInsert(meta, 0));
    return { lastInsertRowId: result.lastInsertRowId };
  },
  getPlaylistDetail: async playlistId => (await playlistStorage.getPlaylistDetail(playlistId)).map(toPlaylistTrack),
  deletePlaylistDetail: async id => {
    await playlistStorage.deletePlaylistDetail(id);
  },
  addToPlaylist: async (playlistId, playlist) => {
    await playlistStorage.addToPlaylist(
      playlistId,
      playlist.map(item => toPlaylistDetailInsert(item, playlistId)),
    );
  },
  syncPlaylistAmount: async playlistId => {
    await playlistStorage.syncPlaylistAmount(playlistId);
  },
  replacePlaylistDetail: async (playlistId, playlist) => {
    await playlistStorage.replacePlaylistDetail(
      playlistId,
      playlist.map(item => toPlaylistDetailInsert(item, playlistId)),
    );
  },
  quickCreatePlaylist: async (title, description, list, source, imgUrl) => {
    const color = `#${Math.floor(Math.random() * 16777216)
      .toString(16)
      .padStart(6, "0")}`;
    const { lastInsertRowId } = await playlistStorage.insertPlaylistMeta(
      toPlaylistMetaInsert(
        {
          title,
          color,
          description,
          imgUrl,
          source: source && list.length > 1 ? source : null,
        },
        list.length,
      ),
    );
    await playlistStorage.addToPlaylist(
      lastInsertRowId,
      list.map(item => toPlaylistDetailInsert(item, lastInsertRowId)),
    );
    return lastInsertRowId;
  },
  exportPlaylist: async id => playlistExportSchema.parse(await playlistStorage.exportPlaylist(id)),
  exportAllPlaylist: async () => playlistExportSchema.parse(await playlistStorage.exportAllPlaylist()),
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
    for (const { playlist, tracks } of plans) {
      const { lastInsertRowId } = await playlistStorage.insertPlaylistMeta(
        toPlaylistMetaInsert(playlist, tracks.length),
      );
      await playlistStorage.addToPlaylist(
        lastInsertRowId,
        tracks.map(item => toPlaylistDetailInsert(item, lastInsertRowId)),
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
