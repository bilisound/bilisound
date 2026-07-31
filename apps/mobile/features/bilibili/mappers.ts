import type { EpisodeItem, GetEpisodeUserResponse, GetMetadataResponse, GetResourceUrlResponse } from "@bilisound/sdk";

import type {
  MediaResource,
  RemotePlaylistEpisode,
  RemotePlaylistMetadata,
  RemotePlaylistPage,
  VideoEpisode,
  VideoMetadata,
  VideoOwner,
  VideoStaffMember,
} from "./models";

function mapVideoOwner(owner: GetMetadataResponse["owner"] | EpisodeItem["author"]): VideoOwner | undefined {
  if (!owner) {
    return undefined;
  }

  return {
    id: owner.mid,
    name: owner.name,
    avatarUrl: owner.face,
  };
}

function mapVideoEpisode(episode: GetMetadataResponse["pages"][number]): VideoEpisode {
  return {
    page: episode.page,
    title: episode.part,
    displayTitle: episode.partDisplayName,
    duration: episode.duration,
  };
}

function mapVideoStaffMember(staff: NonNullable<GetMetadataResponse["staff"]>[number]): VideoStaffMember {
  return {
    id: staff.mid,
    name: staff.name,
    avatarUrl: staff.face,
    role: staff.title,
  };
}

export function mapVideoMetadata(response: GetMetadataResponse): VideoMetadata {
  return {
    bvid: response.bvid,
    aid: response.aid,
    title: response.title,
    coverUrl: response.pic,
    publishedAt: response.pubDate,
    description: response.desc,
    owner: mapVideoOwner(response.owner)!,
    staff: response.staff?.map(mapVideoStaffMember),
    episodes: response.pages.map(mapVideoEpisode),
    seasonId: response.seasonId,
  };
}

export function mapRemotePlaylistEpisode(episode: EpisodeItem): RemotePlaylistEpisode {
  return {
    bvid: episode.bvid,
    title: episode.title,
    coverUrl: episode.cover,
    duration: episode.duration,
    author: mapVideoOwner(episode.author),
  };
}

function mapRemotePlaylistMetadata(metadata: GetEpisodeUserResponse["meta"]): RemotePlaylistMetadata {
  return {
    name: metadata.name,
    description: metadata.description,
    coverUrl: metadata.cover,
    userId: metadata.userId,
    playlistId: metadata.seasonId,
  };
}

export function mapRemotePlaylistPage(response: GetEpisodeUserResponse): RemotePlaylistPage {
  return {
    pageSize: response.pageSize,
    page: response.pageNum,
    total: response.total,
    episodes: response.rows.map(mapRemotePlaylistEpisode),
    metadata: mapRemotePlaylistMetadata(response.meta),
  };
}

export function mapMediaResource(response: GetResourceUrlResponse): MediaResource {
  return { url: response.url, isAudio: response.isAudio };
}
