import type { PlaylistImport } from "~/storage/sqlite/schema";
import { BRAND } from "~/constants/branding";

type PlaylistLLMExportInput = Pick<PlaylistImport, "meta" | "detail">;

interface PlaylistGroupTrack {
  episode: number;
  title: string;
}

interface PlaylistGroup {
  duplicateTitleCount: Map<string, number>;
  tracks: PlaylistGroupTrack[];
}

function normalizeInlineText(value?: string | null) {
  if (!value) {
    return "";
  }
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

function getPlaylistTitle(data: PlaylistLLMExportInput) {
  return normalizeInlineText(data.meta[0]?.title) || "未命名歌单";
}

export function buildPlaylistLLMExportFileName(data: PlaylistLLMExportInput) {
  return `[${BRAND} Export for LLM] ${getPlaylistTitle(data)}.txt`;
}

export function formatPlaylistForLLMExport(data: PlaylistLLMExportInput) {
  const lines = [
    "Bilisound Export for LLM",
    `Playlist: ${getPlaylistTitle(data)}`,
    `Total Songs: ${data.detail.length}`,
  ];

  const groups = new Map<string, PlaylistGroup>();
  const detail = [...data.detail].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  for (const item of detail) {
    const author = normalizeInlineText(item.author) || "未知作者";
    const title = normalizeInlineText(item.title);

    if (!title) {
      continue;
    }

    const group = groups.get(author) ?? {
      duplicateTitleCount: new Map<string, number>(),
      tracks: [],
    };
    group.tracks.push({
      episode: item.episode,
      title,
    });
    group.duplicateTitleCount.set(title, (group.duplicateTitleCount.get(title) ?? 0) + 1);
    groups.set(author, group);
  }

  for (const [author, group] of groups) {
    lines.push("", `Uploader: ${author}`);
    for (const track of group.tracks) {
      const suffix = (group.duplicateTitleCount.get(track.title) ?? 0) > 1 ? ` [EP${track.episode}]` : "";
      lines.push(`- ${track.title}${suffix}`);
    }
  }

  return lines.join("\n");
}
