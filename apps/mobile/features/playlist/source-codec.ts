import type { PlaylistSource } from "~/typings/playlist";

export function decodePlaylistSource(value: string | null | undefined): PlaylistSource | null {
  return value ? (JSON.parse(value) as PlaylistSource) : null;
}

export function encodePlaylistSource(value: PlaylistSource | null | undefined): string | null | undefined {
  return value ? JSON.stringify(value) : value;
}
