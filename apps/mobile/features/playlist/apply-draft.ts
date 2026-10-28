import { useNavigation } from "expo-router";
import { useEffect } from "react";

import { create } from "zustand";

import type { PlayableItem } from "./models";
import type { PlaylistSource } from "~/typings/playlist";

export interface ApplyPlaylistDraft {
  playlistDetail: PlayableItem[];
  name: string;
  description: string;
  source?: PlaylistSource;
  cover?: string;
}

export type ApplyPlaylistDraftInput = Omit<ApplyPlaylistDraft, "description"> & {
  description?: string;
};

interface ApplyPlaylistDraftState {
  draft: ApplyPlaylistDraft;
}

const emptyDraft: ApplyPlaylistDraft = {
  playlistDetail: [],
  name: "",
  description: "",
};

export const useApplyPlaylistDraftStore = create<ApplyPlaylistDraftState>()(() => ({
  draft: emptyDraft,
}));

export function replaceApplyPlaylistDraft(input: ApplyPlaylistDraftInput) {
  useApplyPlaylistDraftStore.setState({
    draft: {
      playlistDetail: input.playlistDetail,
      name: input.name,
      description: input.description ?? "",
      source: input.source,
      cover: input.cover,
    },
  });
}

export function clearApplyPlaylistDraft() {
  useApplyPlaylistDraftStore.setState({ draft: emptyDraft });
}

export function useApplyPlaylistDraft() {
  const navigation = useNavigation();

  useEffect(() => {
    // `beforeRemove` was removed in Expo Router SDK 58; `removed` fires once the route actually unmounts.
    const unsubscribe = navigation.addListener("removed", () => {
      clearApplyPlaylistDraft();
    });

    return () => queueMicrotask(unsubscribe);
  }, [navigation]);

  return useApplyPlaylistDraftStore(state => state.draft);
}
