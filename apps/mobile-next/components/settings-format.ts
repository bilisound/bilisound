import { filesize } from "filesize";

/**
 * Pure presentation helpers for the settings / download pages. Kept free of
 * React and Expo imports so they can be unit tested without a runtime.
 */

export interface DownloadProgressLike {
  totalBytesExpectedToWrite: number;
  totalBytesWritten: number;
}

export interface DownloadStatusSource {
  status: 0 | 1 | 2 | 3;
  progress: DownloadProgressLike;
  progressOld: DownloadProgressLike;
  updateTime: number;
  updateTimeOld: number;
}

/** Download speed in bytes per second, derived from the last two samples. */
export function getDownloadSpeed(source: DownloadStatusSource): number {
  const bytesDiff = source.progress.totalBytesWritten - source.progressOld.totalBytesWritten;
  const timeDiff = (source.updateTime - source.updateTimeOld) / 1000;
  // 时间差为 0 或负数时无法计算速度
  return timeDiff > 0 ? bytesDiff / timeDiff : 0;
}

/** Status column text shown next to a download entry. */
export function formatDownloadStatusText(source: DownloadStatusSource): string {
  if (source.status === 0) {
    return "排队中";
  }
  if (source.status === 2) {
    return "本地处理中";
  }
  if (source.status === 3) {
    return "下载失败";
  }
  return filesize(getDownloadSpeed(source)) + "/s";
}

/** Progress bar fill ratio in the 0..1 range. */
export function getDownloadProgressRatio(progress: DownloadProgressLike): number {
  if (progress.totalBytesExpectedToWrite <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, progress.totalBytesWritten / progress.totalBytesExpectedToWrite));
}

export interface DownloadSummarySource {
  status: 0 | 1 | 2 | 3;
}

/**
 * Subtitle for the settings entry: counts queued and running tasks like the v2
 * `useDownloadDescriptionText`.
 */
export function summarizeDownloadTasks(items: readonly DownloadSummarySource[]): {
  text: string;
  inProgress: number;
  total: number;
} {
  const inProgress = items.filter(item => item.status === 0 || item.status === 1).length;
  return {
    inProgress,
    total: items.length,
    text: inProgress > 0 ? `${inProgress} 个任务进行中` : "尚无任务正在进行",
  };
}

/** Header summary for the download manager page (v2 parity: running = status 1). */
export function summarizeDownloadManager(items: readonly DownloadSummarySource[]): string {
  const total = items.length;
  if (total <= 0) {
    return "无下载任务";
  }
  const running = items.filter(item => item.status === 1).length;
  return `当前有 ${running} / ${total} 个任务进行中`;
}

const logNameRegex = /^bilisound_log_(.+)_(\d{1,2})-(\d{1,2})-(\d+).log$/;
const legacyLogNameRegex = /^bilisound_log_(\d{1,2})-(\d{1,2})-(\d+).log$/;

/** Human readable title for a log file name, ported from the v2 logs page. */
export function formatLogDisplayName(fileName: string): string {
  const info = logNameRegex.exec(fileName);
  if (info) {
    return `${info[4]}-${info[3].padStart(2, "0")}-${info[2].padStart(2, "0")}（版本 ${info[1]}）`;
  }
  const legacy = legacyLogNameRegex.exec(fileName);
  if (legacy) {
    return `${legacy[3]}-${legacy[2].padStart(2, "0")}-${legacy[1].padStart(2, "0")}`;
  }
  return "未知日志";
}

/** Opacity percentage label for the theme editor (0..1 → "40%"). */
export function formatOpacityPercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

/** Scale percentage label for the theme editor (5..300 → "100%"). */
export function formatScalePercent(value: number): string {
  return `${Math.round(value)}%`;
}
