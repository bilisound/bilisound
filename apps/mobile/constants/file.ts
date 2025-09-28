import * as FileSystem from "expo-file-system/legacy";

/**
 * 日志文件夹路径
 */
export const BILISOUND_LOG_URI = `${FileSystem.cacheDirectory}logs`;

/**
 * 离线缓存文件夹路径
 */
export const BILISOUND_OFFLINE_URI = `${FileSystem.documentDirectory}sounds`;

/**
 * 离线待处理文件夹路径
 */
export const BILISOUND_PROCESS_URI = `${FileSystem.cacheDirectory}downloads`;

/**
 * 持久化播放队列路径
 */
export const BILISOUND_LEGACY_PERSIST_QUEUE_URI = `${FileSystem.documentDirectory}playlist.json`;
