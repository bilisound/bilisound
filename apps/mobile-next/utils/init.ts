import * as FileSystem from "expo-file-system/legacy";
import { SplashScreen } from "expo-router";

import log, { deleteOldLogContent } from "./logger";

import { getDiagnosticsConfig, rehydrateSettings } from "~/features/config";

import { BILISOUND_LOG_URI, BILISOUND_OFFLINE_URI, BILISOUND_PROCESS_URI } from "~/constants/file";
import { migrateCacheStatus } from "~/features/cache";
import { handlePlaylist } from "~/utils/migration/playlist";
import { loadPlaceholderAudio } from "~/constants/playback";

let initialization: Promise<string> | undefined;

/**
 * 一次性初始化：日志、目录、数据库、缓存与占位资源。
 *
 * 多次调用共享同一个 Promise；失败后清空守卫，允许根组件重试。
 * 播放队列恢复不属于一次性初始化，见 `ensureQueueRestored`。
 */
export default function init() {
  initialization ??= runInitialization().catch(error => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

async function runInitialization() {
  // 日志系统初始化
  await rehydrateSettings();
  log.setSeverity(getDiagnosticsConfig().debugMode ? "debug" : "info");
  if (!(await FileSystem.getInfoAsync(BILISOUND_LOG_URI)).exists) {
    await FileSystem.makeDirectoryAsync(BILISOUND_LOG_URI);
  }
  await deleteOldLogContent();

  // 目录初始化
  try {
    if (!(await FileSystem.getInfoAsync(BILISOUND_OFFLINE_URI)).exists) {
      await FileSystem.makeDirectoryAsync(BILISOUND_OFFLINE_URI);
    }
    if (!(await FileSystem.getInfoAsync(BILISOUND_PROCESS_URI)).exists) {
      await FileSystem.makeDirectoryAsync(BILISOUND_PROCESS_URI);
    }
    log.debug("目录初始化成功");
  } catch (e) {
    log.error(`目录初始化失败。原因：${e}`);
  }

  // 占位资源初始化
  try {
    await loadPlaceholderAudio();
    log.debug("占位资源初始化成功");
  } catch (e) {
    log.error(`占位资源初始化失败。原因：${e}`);
  }

  // 歌单数据库初始化
  try {
    await handlePlaylist();
    log.debug("数据库初始化成功");
  } catch (e) {
    log.error(`数据库初始化失败。原因：${e}`);
    throw e;
  }

  // 缓存初始化
  try {
    await migrateCacheStatus();
    log.debug("缓存初始化成功");
  } catch (e) {
    log.error(`缓存初始化失败。原因：${e}`);
  }

  // 隐藏 Splash Screen
  await SplashScreen.hideAsync();

  return "done";
}
