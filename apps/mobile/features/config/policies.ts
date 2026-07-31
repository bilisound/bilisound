import { useSettingsStore } from "./store";
import type { DiagnosticsConfig, DownloadConfig, ResourceConfig } from "./types";

/**
 * 非响应式策略读取：供业务层（下载、资源、缓存 handler）在非 React 上下文
 * 读取配置。业务代码依赖这些 policy 读取器，而不是直接依赖 Zustand。
 */

export function getDownloadPolicy(): DownloadConfig {
  const state = useSettingsStore.getState();
  return { downloadNextTrack: state.downloadNextTrack };
}

export function getResourcePolicy(): ResourceConfig {
  const state = useSettingsStore.getState();
  return { filterResourceURL: state.filterResourceURL, useLegacyID: state.useLegacyID };
}

export function getDiagnosticsConfig(): DiagnosticsConfig {
  const state = useSettingsStore.getState();
  return { debugMode: state.debugMode };
}
