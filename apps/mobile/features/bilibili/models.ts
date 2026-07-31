import type { Numberish } from "~/typings/common";

export type RemotePlaylistMode = "season" | "series" | "favorite";

export interface VideoOwner {
  id: number;
  name: string;
  avatarUrl: string;
}

export interface VideoStaffMember extends VideoOwner {
  role: string;
}

export interface VideoEpisode {
  page: number;
  title: string;
  displayTitle: string;
  duration: number;
}

export interface VideoMetadata {
  bvid: string;
  aid: number;
  title: string;
  coverUrl: string;
  publishedAt: number;
  description: string;
  owner: VideoOwner;
  staff?: VideoStaffMember[];
  episodes: VideoEpisode[];
  seasonId?: number;
}

export interface RemotePlaylistEpisode {
  bvid: string;
  title: string;
  coverUrl: string;
  duration: number;
  author?: VideoOwner;
}

export interface RemotePlaylistMetadata {
  name: string;
  description: string;
  coverUrl: string;
  userId: Numberish;
  playlistId: Numberish;
}

export interface RemotePlaylistPage {
  pageSize: number;
  page: number;
  total: number;
  episodes: RemotePlaylistEpisode[];
  metadata: RemotePlaylistMetadata;
}

export interface MediaResource {
  url: string;
  isAudio: boolean;
}
