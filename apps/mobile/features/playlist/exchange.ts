import { z } from "zod";

import type { PlayableItem, PlaylistCreateInput } from "./models";
import { decodePlaylistSource } from "./source-codec";

const playlistExportMetaSchema = z.object({
  id: z.number().optional(),
  title: z.string(),
  color: z.string(),
  amount: z.number(),
  imgUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  filterRules: z.string().nullable().optional(),
  extendedData: z.string().nullable().optional(),
});

const playlistExportTrackSchema = z.object({
  id: z.number().optional(),
  playlistId: z.union([z.string(), z.number()]),
  author: z.string(),
  bvid: z.string(),
  duration: z.number(),
  episode: z.number(),
  title: z.string(),
  imgUrl: z.string(),
  extendedData: z.string().nullable().optional(),
});

export const playlistExportSchema = z.object({
  kind: z.literal("moe.bilisound.app.exportedPlaylist"),
  version: z.literal(1),
  meta: z.array(playlistExportMetaSchema),
  detail: z.array(playlistExportTrackSchema),
});

export type PlaylistExport = z.infer<typeof playlistExportSchema>;

export interface PlaylistImportPlan {
  playlist: PlaylistCreateInput;
  tracks: PlayableItem[];
}

export function buildPlaylistImportPlans(input: unknown): PlaylistImportPlan[] {
  const exported = playlistExportSchema.parse(input);
  return exported.meta.map(meta => {
    const tracks = exported.detail
      .filter(track => String(track.playlistId) === String(meta.id))
      .map(
        (track): PlayableItem => ({
          author: track.author,
          bvid: track.bvid,
          duration: track.duration,
          episode: track.episode,
          title: track.title,
          imgUrl: track.imgUrl,
          extendedData: track.extendedData,
        }),
      );

    return {
      playlist: {
        title: meta.title,
        color: meta.color,
        imgUrl: meta.imgUrl || tracks[0]?.imgUrl || null,
        description: meta.description,
        source: decodePlaylistSource(meta.source),
        filterRules: meta.filterRules,
        extendedData: meta.extendedData,
      },
      tracks,
    };
  });
}
