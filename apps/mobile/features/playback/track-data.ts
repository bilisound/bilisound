import { Platform } from "react-native";

import type { TrackData } from "@bilisound/player";

import { getOnlineMediaResourceUrl, getVideoImageUrl, getVideoUrl } from "~/features/bilibili";
import { USER_AGENT_BILIBILI } from "~/constants/network";
import { getCacheAudioPath } from "~/utils/file";
import type { PlayableItem } from "~/features/playlist";
import { isCacheExists, getCacheStatusKey } from "~/storage/cache-status";
import { PLACEHOLDER_AUDIO } from "~/constants/playback";

/**
 * 对播放队列进行保存预处理
 */
export function processTrackDataForSave(trackData: any[]) {
  trackData.forEach(e => {
    delete e.uri;
    delete e.headers;
    delete e.mimeType;
    if (e.extendedData) {
      delete e.extendedData.expireAt;
    }
  });
  return trackData;
}

/**
 * 对还原的播放队列进行使用预处理
 */
export function processTrackDataForLoad(trackData: TrackData[]) {
  trackData.forEach(e => {
    if (!e.extendedData) {
      return;
    }
    e.headers = {
      referer: getVideoUrl(e.extendedData.id, e.extendedData.episode),
      "user-agent": USER_AGENT_BILIBILI,
    };
    // Web needs the original URL for the Bilibili referer-aware image proxy.
    e.artworkUri = getVideoImageUrl(e.extendedData.artworkUrl ?? e.artworkUri, getVideoUrl(e.extendedData.id));
    if (Platform.OS === "web") {
      e.uri = getOnlineMediaResourceUrl(e.extendedData.id, e.extendedData.episode);
      return;
    } else {
      if (e.extendedData.isLoaded) {
        e.uri = getCacheAudioPath(e.extendedData.id, e.extendedData.episode);
        e.mimeType = "video/mp4";
      } else {
        e.uri = PLACEHOLDER_AUDIO;
      }
    }
  });
  return trackData;
}

/**
 * 播放列表转播放队列
 */
export function playlistToTracks(playlist: PlayableItem[]): TrackData[] {
  return playlist.map(e => {
    const isLoaded = !!isCacheExists(e.bvid, e.episode);

    let uri = isLoaded ? getCacheAudioPath(e.bvid, e.episode) : PLACEHOLDER_AUDIO;
    if (Platform.OS === "web") {
      uri = getOnlineMediaResourceUrl(e.bvid, e.episode);
    }

    return {
      uri,
      artist: e.author,
      artworkUri: getVideoImageUrl(e.imgUrl, getVideoUrl(e.bvid)),
      duration: e.duration,
      extendedData: {
        id: e.bvid,
        episode: e.episode,
        isLoaded,
        expireAt: 0,
        artworkUrl: e.imgUrl,
      },
      headers: {
        referer: getVideoUrl(e.bvid, e.episode),
        "user-agent": USER_AGENT_BILIBILI,
      },
      id: getCacheStatusKey(e.bvid, e.episode),
      title: e.title,
    };
  });
}
