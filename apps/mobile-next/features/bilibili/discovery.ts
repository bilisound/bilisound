import type { Numberish } from "~/typings/common";

import type {
  RemotePlaylistEpisode,
  RemotePlaylistMetadata,
  RemotePlaylistMode,
  RemotePlaylistPage,
  VideoEpisode,
  VideoMetadata,
} from "./models";

/**
 * features/bilibili/discovery — 查询 / 详情 / 远程列表页面的纯映射 helper。
 *
 * 只做数据搬运与解析，不依赖 React、路由与状态，便于单测覆盖：
 * - 查询输入规范化（trim）
 * - 远程列表分页判定与全量导入草稿映射（author 回退）
 * - 视频（全部分 P / 单个分 P）与远程列表 → 歌单草稿条目
 *
 * 返回结构在字段上与 features/playlist 的 ApplyPlaylistDraftInput /
 * PlayableItem / PlaylistSource 结构兼容，由页面直接交给 openAddPlaylistPage。
 */

/** 歌单草稿条目（结构上等价于 features/playlist 的 PlayableItem） */
export interface DiscoveryPlaylistItem {
  author: string;
  bvid: string;
  duration: number;
  episode: number;
  title: string;
  imgUrl: string;
}

export interface VideoPlaylistDraft {
  playlistDetail: DiscoveryPlaylistItem[];
  name: string;
  description: string;
  source: { type: "video"; bvid: string; originalTitle: string; lastSyncAt: number };
  cover: string;
}

export interface EpisodePlaylistDraft {
  playlistDetail: DiscoveryPlaylistItem[];
  name: string;
  description: string;
}

/** 批量下载任务条目（结构等价于 features/cache addDownloadTask 的入参） */
export interface DiscoveryDownloadItem {
  id: string;
  episode: number;
  title: string;
}

export interface RemotePlaylistDraft {
  playlistDetail: DiscoveryPlaylistItem[];
  name: string;
  description: string;
  source: {
    type: "playlist";
    originalTitle: string;
    lastSyncAt: number;
    subType: RemotePlaylistMode;
    userId: Numberish;
    listId: Numberish;
  };
  cover: string;
}

/**
 * 规范化查询输入：去除首尾空白。
 *
 * 用户粘贴的链接常带换行与空格，先去空白再交给 resolveVideo 解析。
 */
export function normalizeVideoQuery(input: string): string {
  return input.trim();
}

/**
 * 远程列表条目是否缺少作者信息。
 *
 * 收藏夹 / 部分合集的条目不带 author，此时需要回退到视频元数据作者。
 */
export function remoteEpisodesNeedAuthorFallback(episodes: readonly RemotePlaylistEpisode[]): boolean {
  return episodes.some(episode => !episode.author);
}

/**
 * 计算远程列表的下一页页码；规则与 v2 `getNextPageParam` 一致：
 * `page < ceil(total / pageSize)` 时才有下一页。
 */
export function getNextRemoteListPage(
  lastPage: Pick<RemotePlaylistPage, "page" | "total" | "pageSize">,
): number | undefined {
  if (!lastPage.pageSize) {
    return undefined;
  }
  if (lastPage.page < Math.ceil(lastPage.total / lastPage.pageSize)) {
    return lastPage.page + 1;
  }
  return undefined;
}

/**
 * 视频分 P → 歌单草稿条目（字段搬运自 v2 video-detail/helpers.ts）。
 */
export function videoEpisodesToPlaylistItems(
  metadata: VideoMetadata,
  episodes: readonly VideoEpisode[] = metadata.episodes,
): DiscoveryPlaylistItem[] {
  return episodes.map(episode => ({
    author: metadata.owner.name,
    bvid: metadata.bvid,
    duration: episode.duration,
    episode: episode.page,
    title: episode.title,
    imgUrl: metadata.coverUrl,
  }));
}

/**
 * 视频全部分 P → 批量下载任务条目（字段搬运自 v2 video-detail/MetaData 的 downloadItems）。
 */
export function videoEpisodesToDownloadItems(metadata: VideoMetadata): DiscoveryDownloadItem[] {
  return metadata.episodes.map(episode => ({
    id: metadata.bvid,
    episode: episode.page,
    title: episode.displayTitle,
  }));
}

/**
 * 视频全部内容 → 歌单草稿（v2 handleAddPlaylist：创建歌单按钮 / 详情页菜单）。
 */
export function buildVideoPlaylistDraft(metadata: VideoMetadata, now = Date.now()): VideoPlaylistDraft {
  return {
    playlistDetail: videoEpisodesToPlaylistItems(metadata),
    name: metadata.title,
    description: metadata.description,
    source: { type: "video", bvid: metadata.bvid, originalTitle: metadata.title, lastSyncAt: now },
    cover: metadata.coverUrl,
  };
}

/**
 * 单个分 P → 歌单草稿（v2 长按菜单行为）。
 *
 * 与 v2 一致：不带 source / cover，避免后续同步错误地把整个视频合并进歌单。
 */
export function buildEpisodePlaylistDraft(metadata: VideoMetadata, episode: VideoEpisode): EpisodePlaylistDraft {
  return {
    playlistDetail: videoEpisodesToPlaylistItems(metadata, [episode]),
    name: metadata.title,
    description: metadata.description,
  };
}

/**
 * 远程列表条目 → 歌单草稿条目（字段搬运自 v2 remote-list handleCreatePlaylist）。
 *
 * 缺少 author 的条目使用 fallbackAuthor（来自视频元数据的作者）填充。
 */
export function remoteEpisodesToPlaylistItems(
  episodes: readonly RemotePlaylistEpisode[],
  fallbackAuthor: string,
): DiscoveryPlaylistItem[] {
  return episodes.map(episode => ({
    author: episode.author?.name ?? fallbackAuthor,
    bvid: episode.bvid,
    duration: episode.duration,
    episode: 1,
    title: episode.title,
    imgUrl: episode.coverUrl,
  }));
}

/**
 * 远程列表全量导入 → 歌单草稿（v2 remote-list 创建歌单，携带 playlist source 供后续同步）。
 */
export function buildRemotePlaylistDraft(
  metadata: RemotePlaylistMetadata,
  mode: RemotePlaylistMode,
  episodes: readonly RemotePlaylistEpisode[],
  fallbackAuthor: string,
  now = Date.now(),
): RemotePlaylistDraft {
  return {
    playlistDetail: remoteEpisodesToPlaylistItems(episodes, fallbackAuthor),
    name: metadata.name,
    description: metadata.description,
    source: {
      type: "playlist",
      originalTitle: metadata.name,
      lastSyncAt: now,
      subType: mode,
      userId: metadata.userId,
      listId: metadata.playlistId,
    },
    cover: metadata.coverUrl,
  };
}
