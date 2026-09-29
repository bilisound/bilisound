import { buildPlaylistImportPlans, playlistExportSchema } from "../exchange";

const source = {
  type: "video" as const,
  bvid: "BV1test",
  originalTitle: "Source video",
  lastSyncAt: 123,
};

it("maps the persisted v1 export format to storage-independent import plans", () => {
  const plans = buildPlaylistImportPlans({
    kind: "moe.bilisound.app.exportedPlaylist",
    version: 1,
    meta: [
      {
        id: 7,
        title: "Imported playlist",
        color: "#ffffff",
        amount: 1,
        imgUrl: null,
        source: JSON.stringify(source),
      },
    ],
    detail: [
      {
        id: 11,
        playlistId: "7",
        author: "Test author",
        bvid: "BV1test",
        duration: 120,
        episode: 1,
        title: "Test track",
        imgUrl: "https://example.com/cover.jpg",
        extendedData: null,
      },
    ],
  });

  expect(plans).toEqual([
    {
      playlist: {
        title: "Imported playlist",
        color: "#ffffff",
        imgUrl: "https://example.com/cover.jpg",
        description: undefined,
        source,
        filterRules: undefined,
        extendedData: undefined,
      },
      tracks: [
        {
          author: "Test author",
          bvid: "BV1test",
          duration: 120,
          episode: 1,
          title: "Test track",
          imgUrl: "https://example.com/cover.jpg",
          extendedData: null,
        },
      ],
    },
  ]);
  expect(plans[0].tracks[0]).not.toHaveProperty("id");
  expect(plans[0].tracks[0]).not.toHaveProperty("playlistId");
});

it("rejects unsupported playlist export versions", () => {
  expect(() =>
    playlistExportSchema.parse({
      kind: "moe.bilisound.app.exportedPlaylist",
      version: 2,
      meta: [],
      detail: [],
    }),
  ).toThrow();
});
