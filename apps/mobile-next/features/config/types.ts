/**
 * 持久化设置的原生形态。`SettingsProps` 必须与 v2 `settings-store` 的存储
 * 键完全一致，以保证存量用户数据无需迁移即可读回。
 */
export interface SettingsProps {
  useLegacyID: boolean;
  downloadNextTrack: boolean;
  filterResourceURL: boolean;
  debugMode: boolean;
  showPlaylistInGrid: boolean;
  theme: string;
  showYuruChara: boolean;
}

type BooleanSettingKey = {
  [K in keyof SettingsProps]: SettingsProps[K] extends boolean ? K : never;
}[keyof SettingsProps];

export interface SettingsMethods {
  update: <K extends keyof SettingsProps>(key: K, value: SettingsProps[K]) => void;
  toggle: (key: BooleanSettingKey) => boolean;
}

/** 外观偏好 */
export interface AppearanceConfig {
  theme: string;
  showYuruChara: boolean;
}

/** 歌单视图偏好 */
export interface PlaylistViewConfig {
  showPlaylistInGrid: boolean;
}

/** 下载/缓存行为 */
export interface DownloadConfig {
  downloadNextTrack: boolean;
}

/** 资源请求策略 */
export interface ResourceConfig {
  filterResourceURL: boolean;
  useLegacyID: boolean;
}

/** 诊断开关 */
export interface DiagnosticsConfig {
  debugMode: boolean;
}
