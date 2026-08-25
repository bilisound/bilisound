/**
 * features/cache — 本地缓存与下载的统一入口。
 *
 * 职责：音频缓存状态（MMKV）、缓存文件路径与清理、一次性缓存状态迁移。
 * 下载调度将在后续切片迁入。
 *
 * 依赖方向：cache -> bilibili / config；cache 不依赖 player / playback。
 * 需要播放器队列信息的缓存协调由 features/playback 编排。
 */

// 缓存状态
export { getCacheStatusKey, useCacheExists, isCacheExists, setCacheExists, deleteCacheStatus } from "./cache-status";

// 音频缓存文件
export { getCacheAudioPath, getAudioCacheSize, cleanAudioCache } from "./audio-cache";

// 一次性迁移
export { migrateCacheStatus } from "./migration";
