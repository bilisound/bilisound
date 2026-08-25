import log from "~/utils/logger";

import { useDownloadStore } from "./download-store";

type DownloadWorker = (id: string, episode: number) => Promise<unknown>;

/**
 * 下载调度器（feature 内部模块）。
 *
 * 从原 store/download.ts 的 pickTask 拆出，避免下载调度逻辑驻留在 Zustand action
 * 中。并发上限、worker 注册、任务领取循环都在此模块内。
 */

// 并发上限：同时进行的下载任务数
const MAX_CONCURRENT = 5;

let worker: DownloadWorker | undefined;
let processTasks: string[] = [];

/**
 * 注册下载执行器。由 ./download 模块在加载时注册自身，避免循环依赖。
 */
export function registerDownloadWorker(fn: DownloadWorker) {
  worker = fn;
}

/**
 * 领取并执行等待中的下载任务，直到达到并发上限或无任务可领。
 */
export function pickTask() {
  if (!worker) {
    log.warn("download worker is not registered; skip picking task");
    return;
  }
  const { downloadList } = useDownloadStore.getState();
  // 抓取当前队列
  const list = Array.from(downloadList.values())
    .sort((a, b) => b.count - a.count)
    .filter(e => !e.claimed);

  // 如果 processTasks 不够多，逐渐递加
  while (processTasks.length < MAX_CONCURRENT) {
    log.debug("待处理任务数量：" + processTasks.length);

    // 获取最后一个还没有处理的任务
    const got = list[list.length - 1];

    if (!got) {
      log.debug("没有要处理的任务");
      return;
    }

    // 将任务标记放到列表里
    const id = got.id + "_" + got.episode;
    processTasks.push(id);

    log.debug("处理任务 " + id);

    worker(got.id, got.episode)
      .then(() => {
        log.info(`[${got.id} / ${got.episode}] 下载完毕`);
      })
      .catch(e => {
        log.error(`[${got.id} / ${got.episode}] 下载失败：${e?.message || e}`);
        useDownloadStore.getState().updateDownloadItemPartial(id, {
          status: 3,
        });
      })
      .finally(() => {
        // 将任务标记予以删除
        processTasks = processTasks.filter(e => e !== id);

        // 尝试领取剩余任务
        pickTask();
      });
  }
}
