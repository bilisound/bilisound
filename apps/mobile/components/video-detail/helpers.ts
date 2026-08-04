import type { VideoEpisode, VideoMetadata } from "~/features/bilibili";
import { openAddPlaylistPage } from "~/features/playlist";

export function handleAddPlaylist(metadata: VideoMetadata) {
  openAddPlaylistPage({
    playlistDetail: metadata.episodes.map(episode => ({
      author: metadata.owner.name,
      bvid: metadata.bvid,
      duration: episode.duration,
      episode: episode.page,
      title: episode.title,
      imgUrl: metadata.coverUrl,
    })),
    name: metadata.title,
    description: metadata.description,
    source: {
      type: "video",
      bvid: metadata.bvid,
      originalTitle: metadata.title,
      lastSyncAt: new Date().getTime(),
    },
    cover: metadata.coverUrl,
  });
}

export type PageItem = VideoEpisode;
