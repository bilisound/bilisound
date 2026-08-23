import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { router } from "expo-router";

import {
  clearApplyPlaylistDraft,
  replaceApplyPlaylistDraft,
  useApplyPlaylistDraft,
  useApplyPlaylistDraftStore,
} from "../apply-draft";
import { openAddPlaylistPage } from "../misc";

jest.mock("expo-router", () => {
  const navigationListeners = new Map<string, () => void>();
  const navigation = {
    addListener: jest.fn((event: string, listener: () => void) => {
      navigationListeners.set(event, listener);
      return () => {
        if (navigationListeners.get(event) === listener) {
          navigationListeners.delete(event);
        }
      };
    }),
  };

  return {
    navigationListeners,
    router: {
      push: jest.fn(),
    },
    useNavigation: () => navigation,
  };
});

const item = {
  author: "Test author",
  bvid: "BV1test",
  duration: 120,
  episode: 1,
  title: "Test track",
  imgUrl: "https://example.com/cover.jpg",
};

beforeEach(() => {
  clearApplyPlaylistDraft();
  jest.clearAllMocks();
  const { navigationListeners } = jest.requireMock("expo-router") as {
    navigationListeners: Map<string, () => void>;
  };
  navigationListeners.clear();
});

it("replaces the whole draft and clears omitted optional fields", () => {
  openAddPlaylistPage({
    playlistDetail: [item],
    name: "Remote playlist",
    description: "Remote description",
    source: {
      type: "video",
      bvid: "BV1source",
      originalTitle: "Source video",
      lastSyncAt: 123,
    },
    cover: "https://example.com/source.jpg",
  });

  openAddPlaylistPage({
    playlistDetail: [item],
    name: "Local copy",
  });

  expect(useApplyPlaylistDraftStore.getState().draft).toEqual({
    playlistDetail: [item],
    name: "Local copy",
    description: "",
    source: undefined,
    cover: undefined,
  });
  expect(router.push).toHaveBeenCalledTimes(2);
  expect(router.push).toHaveBeenLastCalledWith("/apply-playlist");
});

it("clears retained playlist items after the workflow succeeds", () => {
  replaceApplyPlaylistDraft({ playlistDetail: [item], name: "Temporary" });

  clearApplyPlaylistDraft();

  expect(useApplyPlaylistDraftStore.getState().draft).toEqual({
    playlistDetail: [],
    name: "",
    description: "",
  });
});

it("clears the draft when its route begins returning", async () => {
  function DraftConsumer() {
    useApplyPlaylistDraft();
    return null;
  }

  replaceApplyPlaylistDraft({ playlistDetail: [item], name: "Temporary" });

  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(React.StrictMode, null, React.createElement(DraftConsumer)));
  });
  expect(useApplyPlaylistDraftStore.getState().draft.playlistDetail).toEqual([item]);

  const { navigationListeners } = jest.requireMock("expo-router") as {
    navigationListeners: Map<string, () => void>;
  };
  await act(async () => {
    navigationListeners.get("beforeRemove")?.();
  });

  expect(useApplyPlaylistDraftStore.getState().draft).toEqual({
    playlistDetail: [],
    name: "",
    description: "",
  });

  await act(async () => {
    renderer.unmount();
  });
});
