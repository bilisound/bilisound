import { collectUniqueCoverImages } from "../cover";
import type { PlaylistTrack } from "../models";

function makeTrack(overrides: Partial<PlaylistTrack> & Pick<PlaylistTrack, "imgUrl">): PlaylistTrack {
  return {
    id: 1,
    playlistId: 1,
    author: "测试作者",
    bvid: "BV1test",
    duration: 60,
    episode: 1,
    title: "测试曲目",
    extendedData: null,
    ...overrides,
  };
}

describe("collectUniqueCoverImages", () => {
  it("按首次出现顺序去重", () => {
    const tracks = [
      makeTrack({ imgUrl: "https://example.com/a.jpg" }),
      makeTrack({ imgUrl: "https://example.com/b.jpg" }),
      makeTrack({ imgUrl: "https://example.com/a.jpg" }),
      makeTrack({ imgUrl: "https://example.com/c.jpg" }),
      makeTrack({ imgUrl: "https://example.com/b.jpg" }),
    ];

    expect(collectUniqueCoverImages(tracks)).toEqual([
      "https://example.com/a.jpg",
      "https://example.com/b.jpg",
      "https://example.com/c.jpg",
    ]);
  });

  it("没有曲目时返回空数组", () => {
    expect(collectUniqueCoverImages(undefined)).toEqual([]);
    expect(collectUniqueCoverImages(null)).toEqual([]);
    expect(collectUniqueCoverImages([])).toEqual([]);
  });

  it("保留原值（包含空封面字符串），与 v2 的取法一致", () => {
    const tracks = [makeTrack({ imgUrl: "" }), makeTrack({ imgUrl: "https://example.com/a.jpg" })];

    expect(collectUniqueCoverImages(tracks)).toEqual(["", "https://example.com/a.jpg"]);
  });
});
