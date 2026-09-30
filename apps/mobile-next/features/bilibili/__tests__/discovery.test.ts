import type { RemotePlaylistEpisode, VideoMetadata } from "../models";

import {
  buildEpisodePlaylistDraft,
  buildRemotePlaylistDraft,
  buildVideoPlaylistDraft,
  getNextRemoteListPage,
  normalizeVideoQuery,
  remoteEpisodesNeedAuthorFallback,
  remoteEpisodesToPlaylistItems,
  videoEpisodesToDownloadItems,
} from "../discovery";

const metadata: VideoMetadata = {
  bvid: "BV1example",
  aid: 42,
  title: "Video title",
  coverUrl: "https://image.example/cover.jpg",
  publishedAt: 1_700_000_000,
  description: "Video description",
  owner: { id: 7, name: "Uploader", avatarUrl: "https://image.example/avatar.jpg" },
  episodes: [
    { page: 1, title: "Part one", displayTitle: "P1 Part one", duration: 90 },
    { page: 2, title: "Part two", displayTitle: "P2 Part two", duration: 120 },
  ],
  seasonId: 12,
};

function remoteEpisode(overrides: Partial<RemotePlaylistEpisode> = {}): RemotePlaylistEpisode {
  return {
    bvid: "BV1episode",
    title: "Episode title",
    coverUrl: "https://image.example/episode.jpg",
    duration: 180,
    author: { id: 11, name: "Creator", avatarUrl: "https://image.example/creator.jpg" },
    ...overrides,
  };
}

describe("discovery query normalization", () => {
  it("trims leading/trailing whitespace and keeps the payload intact", () => {
    expect(normalizeVideoQuery("  BV1Gx411w7wU\n")).toBe("BV1Gx411w7wU");
    expect(normalizeVideoQuery("\t https://b23.tv/k37TjOT ")).toBe("https://b23.tv/k37TjOT");
    expect(normalizeVideoQuery("   ")).toBe("");
  });
});

describe("remote playlist pagination", () => {
  it("returns the next page while more rows remain", () => {
    expect(getNextRemoteListPage({ page: 1, total: 37, pageSize: 20 })).toBe(2);
    expect(getNextRemoteListPage({ page: 2, total: 37, pageSize: 20 })).toBeUndefined();
  });

  it("stops at exact multiples and empty lists", () => {
    expect(getNextRemoteListPage({ page: 2, total: 40, pageSize: 20 })).toBeUndefined();
    expect(getNextRemoteListPage({ page: 1, total: 0, pageSize: 20 })).toBeUndefined();
  });

  it("guards against a zero page size", () => {
    expect(getNextRemoteListPage({ page: 1, total: 10, pageSize: 0 })).toBeUndefined();
  });
});

describe("remote playlist draft mapping", () => {
  it("detects episodes without an author", () => {
    expect(remoteEpisodesNeedAuthorFallback([remoteEpisode()])).toBe(false);
    expect(remoteEpisodesNeedAuthorFallback([remoteEpisode({ author: undefined })])).toBe(true);
    expect(remoteEpisodesNeedAuthorFallback([])).toBe(false);
  });

  it("keeps the episode author and falls back for missing authors", () => {
    expect(
      remoteEpisodesToPlaylistItems(
        [remoteEpisode(), remoteEpisode({ bvid: "BV1fallback", title: "No author", author: undefined })],
        "Fallback author",
      ),
    ).toEqual([
      {
        author: "Creator",
        bvid: "BV1episode",
        duration: 180,
        episode: 1,
        title: "Episode title",
        imgUrl: "https://image.example/episode.jpg",
      },
      {
        author: "Fallback author",
        bvid: "BV1fallback",
        duration: 180,
        episode: 1,
        title: "No author",
        imgUrl: "https://image.example/episode.jpg",
      },
    ]);
  });

  it("builds a synced playlist draft with the playlist source", () => {
    const draft = buildRemotePlaylistDraft(
      {
        name: "Remote list",
        description: "Desc",
        coverUrl: "https://image.example/list.jpg",
        userId: "5",
        playlistId: "9",
      },
      "favorite",
      [remoteEpisode({ author: undefined })],
      "Fallback author",
      1234,
    );

    expect(draft).toEqual({
      playlistDetail: [
        {
          author: "Fallback author",
          bvid: "BV1episode",
          duration: 180,
          episode: 1,
          title: "Episode title",
          imgUrl: "https://image.example/episode.jpg",
        },
      ],
      name: "Remote list",
      description: "Desc",
      source: {
        type: "playlist",
        originalTitle: "Remote list",
        lastSyncAt: 1234,
        subType: "favorite",
        userId: "5",
        listId: "9",
      },
      cover: "https://image.example/list.jpg",
    });
  });
});

describe("video draft mapping", () => {
  it("maps every episode and keeps the video source", () => {
    const draft = buildVideoPlaylistDraft(metadata, 5678);

    expect(draft.playlistDetail).toEqual([
      {
        author: "Uploader",
        bvid: "BV1example",
        duration: 90,
        episode: 1,
        title: "Part one",
        imgUrl: "https://image.example/cover.jpg",
      },
      {
        author: "Uploader",
        bvid: "BV1example",
        duration: 120,
        episode: 2,
        title: "Part two",
        imgUrl: "https://image.example/cover.jpg",
      },
    ]);
    expect(draft.name).toBe("Video title");
    expect(draft.description).toBe("Video description");
    expect(draft.source).toEqual({ type: "video", bvid: "BV1example", originalTitle: "Video title", lastSyncAt: 5678 });
    expect(draft.cover).toBe("https://image.example/cover.jpg");
  });

  it("maps a single episode without a source (long-press menu behavior)", () => {
    const draft = buildEpisodePlaylistDraft(metadata, metadata.episodes[1]);

    expect(draft).toEqual({
      playlistDetail: [
        {
          author: "Uploader",
          bvid: "BV1example",
          duration: 120,
          episode: 2,
          title: "Part two",
          imgUrl: "https://image.example/cover.jpg",
        },
      ],
      name: "Video title",
      description: "Video description",
    });
    expect("source" in draft).toBe(false);
  });
});

describe("video download item mapping", () => {
  it("maps every episode to a download task entry (v2 MetaData downloadItems)", () => {
    expect(videoEpisodesToDownloadItems(metadata)).toEqual([
      { id: "BV1example", episode: 1, title: "P1 Part one" },
      { id: "BV1example", episode: 2, title: "P2 Part two" },
    ]);
  });

  it("returns an empty list for videos without episodes", () => {
    expect(videoEpisodesToDownloadItems({ ...metadata, episodes: [] })).toEqual([]);
  });
});
