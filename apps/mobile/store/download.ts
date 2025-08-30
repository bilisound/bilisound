import { DownloadProgressData } from "expo-file-system";
import { create } from "zustand";
import * as FileSystem from "expo-file-system";
import { downloadResource } from "~/business/download";
import log from "~/utils/logger";

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

export interface DownloadProps {
  downloadList: Map<string, DownloadItem>;
  max: number;
  count: number;
  processTasks: string[];
}

export interface DownloadMethods {
  addDownloadItem: (key: string, downloadItem: Omit<DownloadItem, "count">) => void;
  updateDownloadItemPartial: (key: string, downloadItem: Partial<DownloadItem>) => void;
  removeDownloadItem: (key: string) => void;
  clearDownloadItem: () => void;
  cancelAll: () => Promise<void>;
  pickTask: () => void;
  addProcessTask: (id: string) => void;
  removeProcessTask: (id: string) => void;
}

const useDownloadStore = create<DownloadProps & DownloadMethods>()((set, get) => ({
  downloadList: new Map(),
  max: 5,
  count: 0,
  processTasks: [],
  abortController: new AbortController(),
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
  clearDownloadItem: () => {
    set(() => ({ downloadList: new Map() }));
  },
  cancelAll: async () => {
    set(() => ({ downloadList: new Map() }));
  },
  addProcessTask: id => {
    const processTasks = get().processTasks;
    processTasks.push(id);
    set(() => ({ processTasks }));
  },
  removeProcessTask: id => {
    const processTasks = get().processTasks;
    const index = processTasks.findIndex(e => e === id);
    if (index >= 0) {
      processTasks.splice(index, 1);
      set(() => ({ processTasks }));
    }
  },
  pickTask: () => {
    // 抓取当前队列
    const list = Array.from(get().downloadList.values())
      .sort((a, b) => b.count - a.count)
      .filter(e => !e.claimed);

    // 如果 processTasks 不够多，逐渐递加
    while (get().processTasks.length < get().max) {
      log.debug("待处理任务数量：" + get().processTasks.length);

      // 获取最后一个还没有处理的任务
      const got = list[list.length - 1];

      if (!got) {
        log.debug("没有要处理的任务");
        return;
      }

      // 将任务标记放到列表里
      const id = got.id + "_" + got.episode;
      get().addProcessTask(id);

      log.debug("处理任务 " + id);

      downloadResource(got.id, got.episode)
        .then(() => {
          log.info(`[${got.id} / ${got.episode}] 下载完毕`);
        })
        .catch(e => {
          log.error(`[${got.id} / ${got.episode}] 下载失败：${e?.message || e}`);
          get().updateDownloadItemPartial(id, {
            status: 3,
          });
        })
        .finally(() => {
          // 将任务标记予以删除
          get().removeProcessTask(id);

          // 尝试领取剩余任务
          get().pickTask();
        });
    }
  },
}));

export default useDownloadStore;
