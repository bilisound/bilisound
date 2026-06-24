import { SplashScreen } from "expo-router";

import log from "./logger";
import { rehydrateConfig, isDebugMode } from "~/features/config";

import { initDatabase } from "~/storage/sqlite/init-web";
import { loadTrackData } from "~/business/playlist/handler";
import { initPolyfill } from "@bilisound/player/src/polyfill";

export default async function init() {
  // 日志系统初始化
  await rehydrateConfig();
  log.setSeverity(isDebugMode() ? "debug" : "info");

  // 数据库初始化
  await initDatabase();

  // 播放队列初始化
  initPolyfill();
  await loadTrackData();

  // 隐藏 Splash Screen
  await SplashScreen.hideAsync();

  document.getElementById("loading-logo")?.remove();

  return "done";
}
