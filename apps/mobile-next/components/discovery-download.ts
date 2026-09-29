import { router } from "expo-router";

import { getDownloadUrl, type VideoMetadata } from "~/features/bilibili";

/**
 * discovery-download — Web 端下载入口（详情页按钮 / 菜单项共用）。
 *
 * 单 P 直接打开下载地址；多 P 跳转下载页由用户自行选择分 P。
 * 仅在 Web 平台挂载的入口调用（native 端由下载管理器切片覆盖）。
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
