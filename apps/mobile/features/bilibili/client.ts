import { Platform } from "react-native";
import { BilisoundSDKDirect, BilisoundSDKRemote } from "@bilisound/sdk";

import { BILISOUND_API_PREFIX, USER_AGENT_BILIBILI } from "~/constants/network";
import { getResourcePolicy } from "~/features/config";
import log from "~/utils/logger";

import { mapMediaResource, mapRemotePlaylistEpisode, mapRemotePlaylistPage, mapVideoMetadata } from "./mappers";
import type {
  MediaResource,
  RemotePlaylistEpisode,
  RemotePlaylistMode,
  RemotePlaylistPage,
  VideoMetadata,
} from "./models";

const sdk =
  Platform.OS === "web"
    ? new BilisoundSDKRemote(BILISOUND_API_PREFIX!)
    : new BilisoundSDKDirect({
        userAgent: USER_AGENT_BILIBILI,
        apiPrefix: "https://api.bilibili.com",
        sitePrefix: "https://www.bilibili.com",
        key: "",
        logger: {
          info: log.info.bind(log),
          warn: log.warn.bind(log),
          error: log.error.bind(log),
          debug: log.debug.bind(log),
        },
      });

export async function resolveShortUrl(id: string): Promise<string> {
  return sdk.parseB23(id);
}

export async function getVideoMetadata(id: string): Promise<VideoMetadata> {
  return mapVideoMetadata(await sdk.getMetadata(id));
}

export function getVideoUrl(id: string, episode: number | string = 1): string {
  return `https://www.bilibili.com/video/${id}${episode === 1 || episode === "1" ? "" : `?p=${episode}`}`;
}

export function getVideoImageUrl(url: string, referer = "https://www.bilibili.com"): string {
  if (Platform.OS === "web") {
    return `${BILISOUND_API_PREFIX}/internal/image?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;
  }

  return url.replace(/^http:/, "https:");
}

export function getOnlineMediaResourceUrl(id: string, episode: number | string, download?: "av" | "bv"): string {
  return `${BILISOUND_API_PREFIX}/internal/resource?id=${id}&episode=${episode}${download ? `&dl=${download}` : ""}`;
}

export function getDownloadUrl(id: string, episode: number | string): string {
  const { useLegacyID } = getResourcePolicy();
  return getOnlineMediaResourceUrl(id, episode, useLegacyID ? "av" : "bv");
}

export async function getMediaResource(id: string, episode: number | string): Promise<MediaResource> {
  if (Platform.OS === "web") {
    return { url: getOnlineMediaResourceUrl(id, episode), isAudio: true };
  }

  const { filterResourceURL } = getResourcePolicy();
  return mapMediaResource(await sdk.getResourceUrl(id, episode, filterResourceURL));
}

export async function getRemotePlaylist(
  mode: RemotePlaylistMode,
  userId: string | number,
  playlistId: string | number,
  page = 1,
): Promise<RemotePlaylistPage> {
  return mapRemotePlaylistPage(await sdk.getUserList(mode, userId, playlistId, page));
}

export async function getFullRemotePlaylist(
  mode: RemotePlaylistMode,
  userId: string | number,
  playlistId: string | number,
  progressCallback?: (progress: number) => void,
): Promise<RemotePlaylistEpisode[]> {
  return (await sdk.getUserListFull(mode, userId, playlistId, progressCallback)).map(mapRemotePlaylistEpisode);
}
