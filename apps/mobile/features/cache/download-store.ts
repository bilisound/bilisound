import { DownloadProgressData } from "expo-file-system/legacy";
import * as FileSystem from "expo-file-system/legacy";
import { create } from "zustand";

export interface DownloadItem {
  title: string;
  id: string;
  episode: number;
  path: string;
  progress: DownloadProgressData;
  progressOld: DownloadProgressData;
  updateTime: number;
  updateTimeOld: number;
  startTime: number;
  instance?: FileSystem.DownloadResumable;
  /**
   * 0 - 等待中，1 - 下载中，2 - 本地处理中，3 - 下载失败
   */
  status: 0 | 1 | 2 | 3;
  count: number;
  claimed?: boolean;
}

interface DownloadStoreState {
  downloadList: Map<string, DownloadItem>;
  count: number;
  addDownloadItem: (key: string, downloadItem: Omit<DownloadItem, "count">) => void;
  updateDownloadItemPartial: (key: string, downloadItem: Partial<DownloadItem>) => void;
  removeDownloadItem: (key: string) => void;
  cancelAll: () => Promise<void>;
}

/**
 * 下载任务状态存储（feature 内部）。
 * 调度逻辑位于 ./download-scheduler；此处仅持有可观察的任务状态。
 */
export const useDownloadStore = create<DownloadStoreState>()((set, get) => ({
  downloadList: new Map(),
  count: 0,
  addDownloadItem: (key, downloadItem) => {
    const downloadList = new Map(get().downloadList);
    const count = get().count + 1;
    downloadList.set(key, { ...downloadItem, count });
    set(() => ({ downloadList, count }));
  },
  updateDownloadItemPartial: (key, downloadItem) => {
    const downloadList = new Map(get().downloadList);
    const got = downloadList.get(key);
    if (got) {
      downloadList.set(key, { ...got, ...downloadItem });
      set(() => ({ downloadList }));
    }
  },
  removeDownloadItem: key => {
    const downloadList = new Map(get().downloadList);
    downloadList.delete(key);
    set(() => ({ downloadList }));
  },
  cancelAll: async () => {
    set(() => ({ downloadList: new Map() }));
  },
}));
