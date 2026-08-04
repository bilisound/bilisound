import { getFullRemotePlaylist, getRemotePlaylist, getVideoMetadata } from "~/features/bilibili";
import { replacePlaylistDetail, setPlaylistMeta } from "~/features/playlist/repository";
import { PlaylistDetailInsert } from "~/features/playlist/models";
import { PlaylistSource } from "~/typings/playlist";

/**
 * 更新上游播放列表
 * @param id
 * @param source
 * @param progressCallback
 */
export async function updatePlaylist(id: number, source: PlaylistSource, progressCallback: (progress: number) => void) {
  switch (source.type) {
    case "playlist": {
      const { metadata } = await getRemotePlaylist(source.subType, source.userId, source.listId, 1);
      const list = await getFullRemotePlaylist(source.subType, source.userId, source.listId, progress => {
        progressCallback?.(progress);
      });
      const needsFallback = list.some(e => !e.author);
      const firstEpisode = needsFallback ? await getVideoMetadata(list[0].bvid) : null;
      const builtList: PlaylistDetailInsert[] = list.map(e => ({
        author: e.author?.name ?? firstEpisode?.owner.name ?? "",
        bvid: e.bvid ?? "",
        duration: e.duration,
        episode: 1,
        title: e.title,
        imgUrl: e.coverUrl,
        playlistId: id,
        extendedData: null,
      }));
      await replacePlaylistDetail(id, builtList);
      await setPlaylistMeta({
        id,
        imgUrl: metadata.coverUrl,
        source: JSON.stringify({
          ...source,
          originalTitle: metadata.name,
          lastSyncAt: new Date().getTime(),
        } as PlaylistSource),
      });
      return builtList.length;
    }
    case "video": {
      progressCallback?.(0);
      const data = await getVideoMetadata(source.bvid);
      const builtList: PlaylistDetailInsert[] = data.episodes.map(episode => ({
        author: data.owner.name,
        bvid: data.bvid,
        duration: episode.duration,
        episode: episode.page,
        title: episode.title,
        imgUrl: data.coverUrl,
        playlistId: id,
        extendedData: null,
      }));
      await replacePlaylistDetail(id, builtList);
      await setPlaylistMeta({
        id,
        imgUrl: data.coverUrl,
        source: JSON.stringify({
          ...source,
          originalTitle: data.title,
          lastSyncAt: new Date().getTime(),
        } as PlaylistSource),
      });
      return builtList.length;
    }
    default: {
      return 0;
    }
  }
}
