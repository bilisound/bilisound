import { mapMediaResource, mapRemotePlaylistPage, mapVideoMetadata } from "../mappers";

describe("Bilibili response mappers", () => {
  it("maps a metadata DTO to the app-owned video model", () => {
    const metadata = mapVideoMetadata({
      bvid: "BV1example",
      aid: 42,
      title: "Video title",
      pic: "http://image.example/cover.jpg",
      pubDate: 1_700_000_000,
      desc: "Video description",
      owner: { mid: 7, name: "Uploader", face: "http://image.example/avatar.jpg" },
      staff: [{ mid: 8, name: "Editor", face: "http://image.example/editor.jpg", title: "剪辑" }],
      pages: [{ page: 1, part: "Episode title", partDisplayName: "P1 Episode title", duration: 90 }],
      seasonId: 12,
    });

    expect(metadata).toEqual({
      bvid: "BV1example",
      aid: 42,
      title: "Video title",
      coverUrl: "http://image.example/cover.jpg",
      publishedAt: 1_700_000_000,
      description: "Video description",
      owner: { id: 7, name: "Uploader", avatarUrl: "http://image.example/avatar.jpg" },
      staff: [{ id: 8, name: "Editor", avatarUrl: "http://image.example/editor.jpg", role: "剪辑" }],
      episodes: [{ page: 1, title: "Episode title", displayTitle: "P1 Episode title", duration: 90 }],
      seasonId: 12,
    });
  });

  it("maps remote playlist pagination and episode DTOs", () => {
    const playlist = mapRemotePlaylistPage({
      pageSize: 20,
      pageNum: 2,
      total: 37,
      rows: [
        {
          bvid: "BV1episode",
          title: "Playlist video",
          cover: "http://image.example/playlist.jpg",
          duration: 180,
          author: { mid: 11, name: "Creator", face: "http://image.example/creator.jpg" },
        },
      ],
      meta: {
        name: "Playlist name",
        description: "Playlist description",
        cover: "http://image.example/playlist-cover.jpg",
        userId: "22",
        seasonId: "33",
      },
    });

    expect(playlist).toEqual({
      pageSize: 20,
      page: 2,
      total: 37,
      episodes: [
        {
          bvid: "BV1episode",
          title: "Playlist video",
          coverUrl: "http://image.example/playlist.jpg",
          duration: 180,
          author: { id: 11, name: "Creator", avatarUrl: "http://image.example/creator.jpg" },
        },
      ],
      metadata: {
        name: "Playlist name",
        description: "Playlist description",
        coverUrl: "http://image.example/playlist-cover.jpg",
        userId: "22",
        playlistId: "33",
      },
    });
  });

  it("keeps only the resource fields the application consumes", () => {
    expect(
      mapMediaResource({
        url: "https://media.example/audio.m4a",
        isAudio: true,
        volume: {
          measured_i: -16.3,
          measured_lra: 2.2,
          measured_tp: -1.2,
          measured_threshold: -27.1,
          target_offset: 0.4,
          target_i: -14,
          target_tp: -1,
        },
      }),
    ).toEqual({ url: "https://media.example/audio.m4a", isAudio: true });
  });
});
