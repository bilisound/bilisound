import { useShallow } from "zustand/shallow";

import { useSettingsStore } from "./store";
import type {
  AppearanceConfig,
  DiagnosticsConfig,
  DownloadConfig,
  PlaylistViewConfig,
  ResourceConfig,
  SettingsMethods,
} from "./types";

/** 外观偏好（响应式，供 UI 使用） */
export function useAppearanceConfig(): AppearanceConfig {
  return useSettingsStore(
    useShallow(state => ({
      theme: state.theme,
      showYuruChara: state.showYuruChara,
      showPlaylistInGrid: state.showPlaylistInGrid,
    })),
  );
}

/** 歌单视图偏好（响应式，供 UI 使用） */
export function usePlaylistViewConfig(): PlaylistViewConfig {
  return useSettingsStore(useShallow(state => ({ showPlaylistInGrid: state.showPlaylistInGrid })));
}

/** 下载/缓存行为（响应式，供 UI 使用） */
export function useDownloadConfig(): DownloadConfig {
  return useSettingsStore(useShallow(state => ({ downloadNextTrack: state.downloadNextTrack })));
}

/** 资源请求策略（响应式，供 UI 使用） */
export function useResourceConfig(): ResourceConfig {
  return useSettingsStore(
    useShallow(state => ({
      filterResourceURL: state.filterResourceURL,
      useLegacyID: state.useLegacyID,
    })),
  );
}

/** 诊断开关（响应式，供 UI 使用） */
export function useDiagnosticsConfig(): DiagnosticsConfig {
  return useSettingsStore(useShallow(state => ({ debugMode: state.debugMode })));
}

/** 设置编辑动作（仅设置页 UI 使用） */
export function useSettingsActions(): SettingsMethods {
  return useSettingsStore(useShallow(state => ({ update: state.update, toggle: state.toggle })));
}
