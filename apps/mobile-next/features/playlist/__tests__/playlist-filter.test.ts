import { filterPlaylistsByQuery } from "../filter";
import type { Playlist } from "../models";

function makePlaylist(overrides: Partial<Playlist> & Pick<Playlist, "id" | "title">): Playlist {
  return {
    color: "#123456",
    amount: 0,
    imgUrl: null,
    description: null,
    source: null,
    filterRules: null,
    extendedData: null,
    ...overrides,
  };
}

const playlists: Playlist[] = [
  makePlaylist({ id: 1, title: "晨跑歌单", description: "适合清晨慢跑的快节奏曲目" }),
  makePlaylist({ id: 2, title: "深夜学习", description: "Lo-Fi 与纯音乐" }),
  makePlaylist({ id: 3, title: "收藏夹", description: null }),
];

describe("filterPlaylistsByQuery", () => {
  it("空白关键词返回原列表（保持引用，不做无谓过滤）", () => {
    expect(filterPlaylistsByQuery(playlists, "")).toBe(playlists);
    expect(filterPlaylistsByQuery(playlists, "   ")).toBe(playlists);
  });

  it("按标题过滤", () => {
    const result = filterPlaylistsByQuery(playlists, "晨跑");
    expect(result.map(item => item.id)).toEqual([1]);
  });

  it("标题与描述之外的词不会误匹配", () => {
    expect(filterPlaylistsByQuery(playlists, "完全不存在的关键词")).toEqual([]);
  });

  it("空列表不做搜索，原样返回", () => {
    expect(filterPlaylistsByQuery([], "晨跑")).toEqual([]);
  });
});
