import Fuse from "fuse.js";

import type { Playlist } from "./models";

/**
 * 歌单列表的模糊过滤，业务规则原样取自 v2
 * `apps/mobile/app/(main)/(playlist)/playlist.tsx` 的内联 Fuse 配置
 * （标题权重 0.7 / 描述权重 0.3 / threshold 0.3）。
 *
 * 提取成纯函数是为了让列表页保持引用透明，并获得一个不依赖 UI 的可运行检查。
 */
export function filterPlaylistsByQuery(playlists: Playlist[], query: string): Playlist[] {
  const keyword = query.trim();
  if (!keyword || playlists.length === 0) {
    return playlists;
  }

  const fuse = new Fuse(playlists, {
    keys: [
      { name: "title", weight: 0.7 },
      { name: "description", weight: 0.3 },
    ],
    threshold: 0.3,
    includeScore: true,
    ignoreFieldNorm: true,
    ignoreLocation: true,
  });

  return fuse.search(keyword).map(result => result.item);
}
