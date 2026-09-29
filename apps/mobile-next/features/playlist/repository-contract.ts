import type { PlaylistSource } from "~/typings/playlist";

import type { PlaylistExport, PlaylistImportPlan } from "./exchange";
import type { PlayableItem, Playlist, PlaylistCreateInput, PlaylistTrack, PlaylistUpdate } from "./models";

export interface PlaylistInsertResult {
  lastInsertRowId: number;
}

export interface PlaylistRepository {
  getPlaylistMetas(filterHasSource?: boolean): Promise<Playlist[]>;
  getPlaylistMeta(id: number): Promise<Playlist | null>;
  deletePlaylistMeta(id: number): Promise<void>;
  setPlaylistMeta(meta: PlaylistUpdate): Promise<void>;
  insertPlaylistMeta(meta: PlaylistCreateInput): Promise<PlaylistInsertResult>;
  getPlaylistDetail(playlistId: number): Promise<PlaylistTrack[]>;
  deletePlaylistDetail(id: number): Promise<void>;
  addToPlaylist(playlistId: number, playlist: PlayableItem[]): Promise<void>;
  syncPlaylistAmount(playlistId: number): Promise<void>;
  replacePlaylistDetail(playlistId: number, playlist: PlayableItem[]): Promise<void>;
  quickCreatePlaylist(
    title: string,
    description: string,
    list: PlayableItem[],
    source?: PlaylistSource,
    imgUrl?: string,
  ): Promise<number>;
  exportPlaylist(id: number): Promise<PlaylistExport>;
  exportAllPlaylist(): Promise<PlaylistExport>;
  clonePlaylist(playlistId: number): Promise<number>;
  deleteAllPlaylist(): Promise<void>;
  importPlaylistBatch(plans: PlaylistImportPlan[]): Promise<void>;
}
