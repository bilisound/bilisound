import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { PlaylistDetail } from "~/storage/sqlite/schema";

export function usePlaylistSearch(playlistDetail: PlaylistDetail[] | undefined) {
  const [searchQuery, setSearchQuery] = useState("");

  // 创建 Fuse 实例
  const fuse = useMemo(() => {
    if (!playlistDetail || playlistDetail.length === 0) return null;
    return new Fuse(playlistDetail, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "author", weight: 0.3 },
      ],
      threshold: 0.3, // 模糊匹配阈值，0.3 表示相对宽松的匹配
      includeScore: true,
      ignoreFieldNorm: true,
      ignoreLocation: true,
    });
  }, [playlistDetail]);

  // 过滤后的播放列表数据
  const filteredPlaylistDetail = useMemo(() => {
    if (!playlistDetail) return [];
    if (!searchQuery.trim() || !fuse) return playlistDetail;

    const results = fuse.search(searchQuery.trim());
    return results.map(result => result.item);
  }, [playlistDetail, searchQuery, fuse]);

  // 获取原始索引（用于播放时定位）
  const getOriginalIndex = (filteredIndex: number): number => {
    if (!searchQuery.trim() || !playlistDetail) {
      return filteredIndex;
    }
    const item = filteredPlaylistDetail[filteredIndex];
    if (!item) return filteredIndex;
    return playlistDetail.findIndex(e => e.id === item.id);
  };

  return {
    searchQuery,
    setSearchQuery,
    filteredPlaylistDetail,
    getOriginalIndex,
    isFiltering: !!searchQuery.trim(),
  };
}
