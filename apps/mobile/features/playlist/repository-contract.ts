import type { PlaylistSource } from "~/typings/playlist";

import type { PlaylistDetail, PlaylistDetailInsert, PlaylistImport, PlaylistMeta, PlaylistMetaInsert } from "./models";

export interface PlaylistInsertResult {
  lastInsertRowId: number;
}

export interface PlaylistImportPlan {
  meta: PlaylistMetaInsert;
  detail: PlaylistDetailInsert[];
}

export interface PlaylistRepository {
  getPlaylistMetas(filterHasSource?: boolean): Promise<PlaylistMeta[]>;
  getPlaylistMeta(id: number): Promise<PlaylistMeta[]>;
  deletePlaylistMeta(id: number): Promise<void>;
  setPlaylistMeta(meta: Partial<PlaylistMetaInsert> & { id: number }): Promise<void>;
  insertPlaylistMeta(meta: PlaylistMetaInsert): Promise<PlaylistInsertResult>;
  getPlaylistDetail(playlistId: number): Promise<PlaylistDetail[]>;
  deletePlaylistDetail(id: number): Promise<void>;
  addToPlaylist(playlistId: number, playlist: PlaylistDetailInsert[]): Promise<void>;
  syncPlaylistAmount(playlistId: number): Promise<void>;
  replacePlaylistDetail(playlistId: number, playlist: PlaylistDetailInsert[]): Promise<void>;
  quickCreatePlaylist(
    title: string,
    description: string,
    list: PlaylistDetail[],
    source?: PlaylistSource,
    imgUrl?: string,
  ): Promise<number>;
  exportPlaylist(id: number): Promise<PlaylistImport>;
  exportAllPlaylist(): Promise<PlaylistImport>;
  clonePlaylist(playlistId: number): Promise<number>;
  deleteAllPlaylist(): Promise<void>;
  importPlaylistBatch(plans: PlaylistImportPlan[]): Promise<void>;
}
