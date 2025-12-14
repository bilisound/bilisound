import { GetMetadataResponse } from "@bilisound/sdk";
import { openAddPlaylistPage } from "~/business/playlist/misc";

export function handleAddPlaylist(meta: GetMetadataResponse) {
  openAddPlaylistPage({
    playlistDetail: meta.pages.map(e => ({
      author: meta.owner.name ?? "",
      bvid: meta.bvid ?? "",
      duration: e.duration,
      episode: e.page,
      title: e.part,
      imgUrl: meta.pic ?? "",
      id: 0,
      playlistId: 0,
      extendedData: null,
    })),
    name: meta.title,
    description: meta.desc,
    source: {
      type: "video",
      bvid: meta.bvid,
      originalTitle: meta.title,
      lastSyncAt: new Date().getTime(),
    },
    cover: meta.pic,
  });
}

export type PageItem = GetMetadataResponse["pages"][number];
