import { Platform } from "react-native";

import { BilisoundPlayerModule } from "./BilisoundPlayerModule";
import { Config } from "./config";
import type {
  DownloadData,
  DownloadItem,
  PlaybackProgress,
  PlaybackState,
  SetQueueOptions,
  TrackData,
  TrackDataInternal,
} from "./types";
import { DownloadState, RepeatMode, ShuffleMode } from "./types";
import { toTrackData, toTrackDataInternal } from "./utils";

export { Config } from "./config";

/**
 * 设置默认请求 Headers，包括 `User-Agent`
 * @param defaultHeaders
 */
export function setDefaultHeaders(defaultHeaders: Record<string, string>) {
  Config.instance.defaultHeaders = defaultHeaders;
}

/**
 * 播放
 */
export function play(): Promise<void> {
  return BilisoundPlayerModule.play();
}

/**
 * 暂停
 */
export function pause(): Promise<void> {
  return BilisoundPlayerModule.pause();
}

/**
 * 上一首
 */
export function prev(): Promise<void> {
  return BilisoundPlayerModule.prev();
}

/**
 * 下一首
 */
export function next(): Promise<void> {
  return BilisoundPlayerModule.next();
}

/**
 * 切换播放/暂停状态
 */
export function toggle(): Promise<void> {
  return BilisoundPlayerModule.toggle();
}

/**
 * 调整播放进度
 * @param to 播放进度（秒）
 */
export function seek(to: number): Promise<void> {
  return BilisoundPlayerModule.seek(to);
}

/**
 * 跳转到队列中指定的曲目
 * @param to
 */
export function jump(to: number): Promise<void> {
  return BilisoundPlayerModule.jump(to);
}

/**
 * 获取播放进度
 */
export async function getProgress(): Promise<PlaybackProgress> {
  return BilisoundPlayerModule.getProgress();
}

/**
 * 获取播放状态
 */
export async function getPlaybackState(): Promise<PlaybackState> {
  return BilisoundPlayerModule.getPlaybackState();
}

/**
 * 获取是否正在播放
 */
export async function getIsPlaying(): Promise<boolean> {
  return BilisoundPlayerModule.getIsPlaying();
}

export async function getCurrentTrack() {
  if (Platform.OS === "web") {
    return BilisoundPlayerModule.getCurrentTrackWeb();
  }
  const e: TrackDataInternal | null = await BilisoundPlayerModule.getCurrentTrack();
  if (!e) {
    return undefined;
  }
  return toTrackData(e);
}

export async function getCurrentTrackIndex() {
  return BilisoundPlayerModule.getCurrentTrackIndex();
}

export async function getNextTrackIndex() {
  return BilisoundPlayerModule.getNextTrackIndex();
}

/**
 * 调整播放速度
 * @param speed 播放速度
 * @param retainPitch 保持音高与正常速度时一致
 */
export function setSpeed(speed: number, retainPitch = true): Promise<void> {
  return BilisoundPlayerModule.setSpeed(speed, retainPitch);
}

/**
 * 获取循环模式
 * @returns {Promise<number>} 循环模式
 * - 0: 不循环
 * - 1: 单曲循环
 * - 2: 列表循环
 */
export function getRepeatMode(): Promise<RepeatMode> {
  return BilisoundPlayerModule.getRepeatMode();
}

/**
 * 设置循环模式
 * @param mode 循环模式
 * - 0: 不循环
 * - 1: 单曲循环
 * - 2: 列表循环
 */
export function setRepeatMode(mode: RepeatMode): Promise<void> {
  return BilisoundPlayerModule.setRepeatMode(mode);
}

/**
 * 获取随机播放模式
 *
 * 随机播放改变的是「播放顺序」（next/prev 的走向），不会改变 `getTracks()` 返回的
 * 规范队列顺序。
 * @returns {Promise<ShuffleMode>} 随机播放模式
 * - 0: 关闭
 * - 1: 开启
 */
export function getShuffleMode(): Promise<ShuffleMode> {
  return BilisoundPlayerModule.getShuffleMode();
}

/**
 * 设置随机播放模式
 *
 * 开启时：当前曲目与播放进度保持不变，next/prev 按随机顺序走。
 * 关闭时：当前曲目与播放进度保持不变，next/prev 按规范队列顺序走。
 * @param mode 随机播放模式
 * - 0: 关闭
 * - 1: 开启
 */
export function setShuffleMode(mode: ShuffleMode): Promise<void> {
  return BilisoundPlayerModule.setShuffleMode(mode);
}

/**
 * 切换随机播放模式，并返回切换后的模式
 */
export async function toggleShuffleMode(): Promise<ShuffleMode> {
  const current = await BilisoundPlayerModule.getShuffleMode();
  const next = current === ShuffleMode.ON ? ShuffleMode.OFF : ShuffleMode.ON;
  await BilisoundPlayerModule.setShuffleMode(next);
  return next;
}

/**
 * 向播放队列添加单首曲目
 * @param trackData 曲目信息
 * @param index 插入位置。不指定则插入到末尾
 */
export function addTrack(trackData: TrackData, index?: number): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof index === "number") {
      return BilisoundPlayerModule.addTrackAt(structuredClone(trackData), index);
    }
    return BilisoundPlayerModule.addTrack(structuredClone(trackData));
  }

  const builtTrackData = toTrackDataInternal(trackData);
  if (typeof index === "number") {
    return BilisoundPlayerModule.addTrackAt(JSON.stringify(builtTrackData), index);
  }
  return BilisoundPlayerModule.addTrack(JSON.stringify(builtTrackData));
}

/**
 * 向播放队列添加多首曲目
 * @param trackDatas 曲目信息
 * @param index 插入位置。不指定则插入到末尾
 */
export function addTracks(trackDatas: TrackData[], index?: number): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof index === "number") {
      return BilisoundPlayerModule.addTracksAt(structuredClone(trackDatas), index);
    }
    return BilisoundPlayerModule.addTracks(structuredClone(trackDatas));
  }

  const processedData: TrackDataInternal[] = [];
  for (let i = 0; i < trackDatas.length; i++) {
    const trackData = trackDatas[i]!;
    processedData.push(toTrackDataInternal(trackData));
  }
  if (typeof index === "number") {
    return BilisoundPlayerModule.addTracksAt(JSON.stringify(processedData), index);
  }
  return BilisoundPlayerModule.addTracks(JSON.stringify(processedData));
}

/**
 * 获取整个播放队列
 * @returns {Promise<TrackData[]>} 整个播放队列
 */
export async function getTracks(): Promise<TrackData[]> {
  const raw = await BilisoundPlayerModule.getTracks();
  if (typeof raw === "string") {
    const rawData: TrackDataInternal[] = JSON.parse(raw);
    return rawData.map(e => {
      return toTrackData(e);
    });
  }
  return raw;
}

/**
 * 替换曲目。如果替换的曲目是当前正在播放的，会导致当前播放的曲目重新开始播放
 * @param trackData 待替换曲目
 * @param index 被替换的曲目的 index
 */
export async function replaceTrack(index: number, trackData: TrackData): Promise<void> {
  if (Platform.OS === "web") {
    return BilisoundPlayerModule.replaceTrack(index, trackData);
  }

  const builtTrackData = toTrackDataInternal(trackData);
  return BilisoundPlayerModule.replaceTrack(index, JSON.stringify(builtTrackData));
}

/**
 * 删除曲目
 * @param index
 */
export async function deleteTracks(index: number | number[]): Promise<void> {
  if (Platform.OS === "web") {
    if (Array.isArray(index)) {
      return BilisoundPlayerModule.deleteTracks(index);
    }
    return BilisoundPlayerModule.deleteTrack(index);
  }

  if (Array.isArray(index)) {
    return BilisoundPlayerModule.deleteTracks(JSON.stringify(index));
  }
  return BilisoundPlayerModule.deleteTrack(index);
}

/**
 * 清空队列
 */
export async function clearQueue() {
  await BilisoundPlayerModule.clearQueue();
}

/**
 * Atomically replaces the canonical queue and selects its initial playback state.
 */
export function setQueueWithOptions(trackDatas: TrackData[], options: SetQueueOptions = {}): Promise<void> {
  const normalizedOptions = normalizeSetQueueOptions(trackDatas.length, options);
  if (Platform.OS === "web") {
    return BilisoundPlayerModule.setQueueWithOptions(structuredClone(trackDatas), normalizedOptions);
  }

  const processedData = trackDatas.map(toTrackDataInternal);
  return BilisoundPlayerModule.setQueueWithOptions(JSON.stringify(processedData), JSON.stringify(normalizedOptions));
}

/**
 * Replaces the queue at the requested canonical index and leaves playback paused.
 */
export function setQueue(trackDatas: TrackData[], beginIndex = 0): Promise<void> {
  return setQueueWithOptions(trackDatas, { beginIndex });
}

function normalizeSetQueueOptions(trackCount: number, options: SetQueueOptions): Required<SetQueueOptions> {
  const beginIndex = options.beginIndex ?? 0;
  const position = options.position ?? 0;
  const preservePlaybackState = options.preservePlaybackState ?? false;

  if (
    !Number.isInteger(beginIndex) ||
    (trackCount === 0 ? beginIndex !== 0 : beginIndex < 0 || beginIndex >= trackCount)
  ) {
    throw new RangeError("beginIndex is outside the canonical queue");
  }
  if (!Number.isFinite(position) || position < 0) {
    throw new RangeError("position must be a finite non-negative number");
  }
  if (typeof preservePlaybackState !== "boolean") {
    throw new TypeError("preservePlaybackState must be a boolean");
  }

  return { beginIndex, position, preservePlaybackState };
}

/**
 * 添加下载项
 * @param id
 * @param uri
 * @param metadata
 */
export async function addDownload(id: string, uri: string, metadata: DownloadData = { headers: {} }): Promise<void> {
  const outputMetadata: DownloadData = {
    headers: { ...Config.instance.defaultHeaders, ...metadata.headers },
  };
  return BilisoundPlayerModule.addDownload(id, uri, JSON.stringify(outputMetadata));
}

/**
 * 查询单个下载项
 */
export async function getDownload(id: string): Promise<DownloadItem> {
  return JSON.parse(await BilisoundPlayerModule.getDownload(id));
}

/**
 * 查询符合条件的下载项列表
 * @param state
 */
export async function getDownloads(state?: DownloadState): Promise<DownloadItem[]> {
  return JSON.parse(await BilisoundPlayerModule.getDownloads(state));
}

/**
 * 暂停下载项
 * @param id
 */
export async function pauseDownload(id: string): Promise<void> {
  return BilisoundPlayerModule.pauseDownload(id);
}

/**
 * 恢复下载项
 * @param id
 */
export async function resumeDownload(id: string): Promise<void> {
  return BilisoundPlayerModule.resumeDownload(id);
}

/**
 * 暂停全部下载项
 */
export async function pauseAllDownloads(): Promise<void> {
  return BilisoundPlayerModule.pauseAllDownloads();
}

/**
 * 恢复全部下载项
 */
export async function resumeAllDownloads(): Promise<void> {
  return BilisoundPlayerModule.resumeAllDownloads();
}

/**
 * 移除下载项
 * @param id
 */
export async function removeDownload(id: string): Promise<void> {
  return BilisoundPlayerModule.removeDownload(id);
}

/**
 * 将文件保存到用户指定的位置
 * @param path 源文件路径
 * @param mimeType MIME 类型
 */
export function saveFile(path: string, mimeType: string, replaceName?: string | null): Promise<void> {
  return BilisoundPlayerModule.saveFile(path, mimeType, replaceName || null);
}
