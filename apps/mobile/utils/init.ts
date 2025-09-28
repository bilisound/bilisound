import * as FileSystem from "expo-file-system/legacy";
import { SplashScreen } from "expo-router";

import log, { deleteOldLogContent } from "./logger";
import useSettingsStore from "../store/settings";

import { BILISOUND_LOG_URI, BILISOUND_OFFLINE_URI, BILISOUND_PROCESS_URI } from "~/constants/file";
import { handleCacheStatus } from "~/utils/migration/cache-status";
import { handlePlaylist } from "~/utils/migration/playlist";
import { loadTrackData } from "~/business/playlist/handler";
import { loadPlaceholderAudio } from "~/constants/playback";

export default async function init() {
  // 日志系统初始化
  await useSettingsStore.persist.rehydrate();
  const settings = useSettingsStore.getState();
  log.setSeverity(settings.debugMode ? "debug" : "info");
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
  }

  // 缓存初始化
  try {
    await handleCacheStatus();
    log.debug("缓存初始化成功");
  } catch (e) {
    log.error(`缓存初始化失败。原因：${e}`);
  }

  // 播放队列初始化
  await loadTrackData();

  // 隐藏 Splash Screen
  await SplashScreen.hideAsync();

  return "done";
}
