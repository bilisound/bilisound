import { replaceApplyPlaylistDraft, type ApplyPlaylistDraftInput } from "./apply-draft";
import { router } from "expo-router";

export function openAddPlaylistPage(draft: ApplyPlaylistDraftInput) {
  replaceApplyPlaylistDraft(draft);
  router.push(`/apply-playlist`);
}
