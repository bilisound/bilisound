import type {
  PlaylistDetail as PlaylistDetailRow,
  PlaylistDetailInsert as PlaylistDetailInsertRow,
  PlaylistMeta as PlaylistMetaRow,
  PlaylistMetaInsert as PlaylistMetaInsertRow,
} from "~/storage/sqlite/schema";

import type { PlayableItem, Playlist, PlaylistCreateInput, PlaylistTrack, PlaylistUpdate } from "./models";
import { decodePlaylistSource, encodePlaylistSource } from "./source-codec";

export function toPlaylist(row: PlaylistMetaRow): Playlist {
  return {
    id: row.id,
    title: row.title,
    color: row.color,
    amount: row.amount,
    imgUrl: row.imgUrl,
    description: row.description,
    source: decodePlaylistSource(row.source),
    filterRules: row.filterRules,
    extendedData: row.extendedData,
  };
}

export function toPlaylistTrack(row: PlaylistDetailRow): PlaylistTrack {
  return {
    id: row.id,
    playlistId: row.playlistId,
    author: row.author,
    bvid: row.bvid,
    duration: row.duration,
    episode: row.episode,
    title: row.title,
    imgUrl: row.imgUrl,
    extendedData: row.extendedData,
  };
}

export function toPlaylistMetaInsert(input: PlaylistCreateInput, amount: number): PlaylistMetaInsertRow {
  return {
    title: input.title,
    color: input.color,
    amount,
    imgUrl: input.imgUrl,
    description: input.description,
    source: encodePlaylistSource(input.source),
    filterRules: input.filterRules,
    extendedData: input.extendedData,
  };
}

export function toPlaylistMetaUpdate(update: PlaylistUpdate): Partial<PlaylistMetaInsertRow> & { id: number } {
  const { id, source, ...fields } = update;
  return {
    id,
    ...fields,
    ...(source === undefined ? {} : { source: encodePlaylistSource(source) }),
  };
}

export function toPlaylistDetailInsert(item: PlayableItem, playlistId: number): PlaylistDetailInsertRow {
  return {
    playlistId,
    author: item.author,
    bvid: item.bvid,
    duration: item.duration,
    episode: item.episode,
    title: item.title,
    imgUrl: item.imgUrl,
    extendedData: item.extendedData,
  };
}
