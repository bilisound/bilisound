import type { PlaylistTrack } from "./models";

/**
 * 收集歌单内出现过的封面地址，按首次出现的顺序去重。
 *
 * 语义与 v2 保持一致：详情页头图组用 `Array.from(new Set(detail.map(e => e.imgUrl)))`，
 * 封面选择页用 `index === self.findIndex(...)` 在曲目列表上去重，两者等价。
 * 这里收口成一个纯函数，两个页面共用同一份取法。
 *
 * 不做过多的清洗（例如过滤空串），与 v2 相同：是否可用交给界面判断。
 */
export function collectUniqueCoverImages(tracks: PlaylistTrack[] | undefined | null): string[] {
  return Array.from(new Set((tracks ?? []).map(track => track.imgUrl)));
}
