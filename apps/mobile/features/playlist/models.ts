import type { PlaylistSource } from "~/typings/playlist";

export interface Playlist {
  id: number;
  title: string;
  color: string;
  amount: number;
  imgUrl: string | null;
  description: string | null;
  source: PlaylistSource | null;
  filterRules: string | null;
  extendedData: string | null;
}

export interface PlaylistCreateInput {
  title: string;
  color: string;
  imgUrl?: string | null;
  description?: string | null;
  source?: PlaylistSource | null;
  filterRules?: string | null;
  extendedData?: string | null;
}

export type PlaylistUpdate = Partial<PlaylistCreateInput> & { id: number };

export interface PlayableItem {
  author: string;
  bvid: string;
  duration: number;
  episode: number;
  title: string;
  imgUrl: string;
  extendedData?: string | null;
}

export interface PlaylistTrack extends PlayableItem {
  id: number;
  playlistId: number;
  extendedData: string | null;
}

export type SongListItem = Pick<PlayableItem, "author" | "bvid" | "duration" | "episode" | "title">;
