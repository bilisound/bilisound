import { SplashScreen } from "expo-router";

import log from "./logger";

import { getDiagnosticsConfig, rehydrateSettings } from "~/features/config";

import { initDatabase } from "~/storage/sqlite/init-web";
import { initPolyfill } from "@bilisound/player/src/polyfill";

let initialization: Promise<string> | undefined;

/**
 * 一次性初始化。多次调用共享同一个 Promise；失败后清空守卫以允许重试。
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

  // 数据库初始化
  await initDatabase();

  // 播放器 polyfill
  initPolyfill();

  // 隐藏 Splash Screen
  await SplashScreen.hideAsync();

  document.getElementById("loading-logo")?.remove();

  return "done";
}
