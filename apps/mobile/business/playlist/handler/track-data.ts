import { Platform } from "react-native";

import type { TrackData } from "@bilisound/player/build/types";

import { getImageProxyUrl, getVideoUrl } from "~/business/constant-helper";
import { USER_AGENT_BILIBILI } from "~/constants/network";
import { getCacheAudioPath } from "~/utils/file";
import { getBilisoundResourceUrlOnline } from "~/api/bilisound";
import type { PlaylistDetail } from "~/storage/sqlite/schema";
import { cacheStatusStorage } from "~/storage/cache-status";
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
    e.artworkUri = getImageProxyUrl(
      // 只有 Web 版需要分离原 URL 和实际 URL，且 Web 版在 v1 从未上线
      e.extendedData.artworkUrl ?? e.artworkUri,
      "https://www.bilibili.com/video/" + e.extendedData.id,
    );
    if (Platform.OS === "web") {
      e.uri = getBilisoundResourceUrlOnline(e.extendedData!.id, e.extendedData!.episode).url;
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
export function playlistToTracks(playlist: PlaylistDetail[]): TrackData[] {
  return playlist.map(e => {
    const isLoaded = !!cacheStatusStorage.getBoolean(e.bvid + "_" + e.episode);

    let uri = isLoaded ? getCacheAudioPath(e.bvid, e.episode) : PLACEHOLDER_AUDIO;
    if (Platform.OS === "web") {
      uri = getBilisoundResourceUrlOnline(e.bvid, e.episode).url;
    }

    return {
      uri,
      artist: e.author,
      artworkUri: getImageProxyUrl(e.imgUrl, "https://www.bilibili.com/video/" + e.bvid),
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
      id: e.bvid + "_" + e.episode,
      title: e.title,
    };
  });
}
