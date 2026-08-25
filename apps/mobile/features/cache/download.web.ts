// Web 平台下载占位实现：Web 端通过 getDownloadUrl 直接打开下载链接，
// 不进入本地下载调度流程。

export function addDownloadTask() {
  return false;
}

export async function downloadResource() {}

export async function downloadResourceNow() {}

export function pickDownloadTask() {}

export function useDownloadList() {
  return {
    downloadList: new Map(),
    cancelAll: async () => {},
  };
}

export type { DownloadItem } from "./download-store";
