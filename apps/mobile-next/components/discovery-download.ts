import { router } from "expo-router";

import { getDownloadUrl, type VideoMetadata } from "~/features/bilibili";
import { addDownloadTask, downloadResource, isCacheExists, pickDownloadTask } from "~/features/cache";
import type { DiscoveryDownloadItem } from "~/features/bilibili/discovery";

/**
 * discovery-download — 视频详情页下载入口（Web 链接 / 原生存到本地缓存）。
 *
 * Web 端：单 P 直接打开下载地址；多 P 跳转下载页由用户自行选择分 P。
 * 原生端：分 P 缓存到本地（features/cache 既有能力），并把真实结果回传给 UI，
 * 避免把「已缓存 / 已在队列 / 已取消 / 失败」误报成下载完成。
 */

export function openDownloadWebEntry(data: VideoMetadata) {
  if (typeof globalThis.window === "undefined") {
    return;
  }
  if (data.episodes.length === 1) {
    globalThis.window.open(getDownloadUrl(data.bvid, 1));
    return;
  }
  router.navigate(`/download-web?id=${data.bvid}`);
}

/**
 * 单集缓存结果：
 * - downloaded：确实下载完成并写入本地缓存
 * - already-cached：本地已有缓存（未重复入队）
 * - queued：同一任务已在下载队列中（addDownloadTask 去重）
 * - cancelled：任务结束但没有产出缓存（下载被取消）
 */
export type EpisodeCacheOutcome = "downloaded" | "already-cached" | "queued" | "cancelled";

/**
 * 将单个分 P 缓存到本地，返回真实结果供调用方生成反馈。
 *
 * 下载失败会向上抛出（含网络错误与视频音轨提取失败），由调用方提示错误，
 * 而不是吞掉异常后仍展示「下载完成」。
 */
export async function cacheEpisodeToLocal(id: string, episode: number, title: string): Promise<EpisodeCacheOutcome> {
  if (isCacheExists(id, episode)) {
    return "already-cached";
  }
  // addDownloadTask 已内建去重：队列中有同一任务（或已有缓存）时返回 false。
  if (!addDownloadTask(id, episode, title)) {
    return "queued";
  }
  await downloadResource(id, episode);
  // 下载被取消（任务从列表移除）时 downloadResource 会提前返回：此时没有缓存产出。
  return isCacheExists(id, episode) ? "downloaded" : "cancelled";
}

export interface BatchCacheResult {
  /** 本次真正入队的任务数 */
  added: number;
  /** 未入队的任务数（已缓存或已在下载队列中） */
  skipped: number;
}

/**
 * 批量缓存视频分 P（v2 详情页 MetaData 的批量下载按钮）。
 *
 * 逐个交给下载调度器排队（queue + pick），只统计真实入队的数量，
 * 让 UI 能区分「已添加 N 个任务」与「没有需要新增的任务」。
 */
export function cacheVideoEpisodesToLocal(items: readonly DiscoveryDownloadItem[]): BatchCacheResult {
  let added = 0;
  let skipped = 0;
  for (const item of items) {
    if (addDownloadTask(item.id, item.episode, item.title)) {
      added += 1;
    } else {
      skipped += 1;
    }
  }
  if (added > 0) {
    pickDownloadTask();
  }
  return { added, skipped };
}
