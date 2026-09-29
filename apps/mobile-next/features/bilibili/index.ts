/**
 * features/bilibili — Bilibili external data boundary.
 *
 * UI and business code consume app-owned models and resource URL helpers from
 * this module. Only the adapter implementation imports @bilisound/sdk.
 */
export {
  getDownloadUrl,
  getFullRemotePlaylist,
  getMediaResource,
  getOnlineMediaResourceUrl,
  getRemotePlaylist,
  getVideoImageUrl,
  getVideoMetadata,
  getVideoUrl,
  resolveShortUrl,
} from "./client";
export { resolveVideo, resolveVideoAndJump } from "./url-resolver";
export type { UserListParseResult } from "./url-resolver";
export type {
  MediaResource,
  RemotePlaylistEpisode,
  RemotePlaylistMetadata,
  RemotePlaylistMode,
  RemotePlaylistPage,
  VideoEpisode,
  VideoMetadata,
  VideoOwner,
  VideoStaffMember,
} from "./models";
