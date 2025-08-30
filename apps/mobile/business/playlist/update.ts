import { getBilisoundMetadata, getUserList, getUserListFull } from "~/api/bilisound";
import { replacePlaylistDetail, setPlaylistMeta } from "~/storage/sqlite/playlist";
import { PlaylistDetailInsert } from "~/storage/sqlite/schema";
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
      const { meta } = await getUserList(source.subType, source.userId, source.listId, 1);
      const list = await getUserListFull(source.subType, source.userId, source.listId, progress => {
        progressCallback?.(progress);
      });
      const firstEpisode = await getBilisoundMetadata({ id: list[0].bvid });
      const builtList: PlaylistDetailInsert[] = list.map(e => ({
        author: firstEpisode.owner.name,
        bvid: e.bvid ?? "",
        duration: e.duration,
        episode: 1,
        title: e.title,
        imgUrl: e.cover ?? "",
        playlistId: id,
        extendedData: null,
      }));
      replacePlaylistDetail(id, builtList);
      await setPlaylistMeta({
        id,
        imgUrl: meta.cover,
        source: JSON.stringify({
          ...source,
          originalTitle: meta.name,
          lastSyncAt: new Date().getTime(),
        } as PlaylistSource),
      });
      return builtList.length;
    }
    case "video": {
      progressCallback?.(0);
      const data = await getBilisoundMetadata({ id: source.bvid });
      const builtList: PlaylistDetailInsert[] = data.pages.map(e => ({
        author: data.owner.name,
        bvid: data.bvid,
        duration: e.duration,
        episode: e.page,
        title: e.part,
        imgUrl: data.pic,
        playlistId: id,
        extendedData: null,
      }));
      replacePlaylistDetail(id, builtList);
      await setPlaylistMeta({
        id,
        imgUrl: data.pic,
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
