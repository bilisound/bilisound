/**
 * features/config — 用户设置与运行时策略的统一入口。
 *
 * 依赖方向：UI / 业务层 → features/config；任何模块不得直接 import
 * `~/features/config/store` 或 v2 的 `~/store/settings`。
 */
export { rehydrateSettings } from "./store";
export {
  useAppearanceConfig,
  usePlaylistViewConfig,
  useDownloadConfig,
  useResourceConfig,
  useDiagnosticsConfig,
  useSettingsActions,
} from "./selectors";
export { getDownloadPolicy, getResourcePolicy, getDiagnosticsConfig } from "./policies";
export { checkLatestVersion, downloadApk } from "./release";
export type { CheckLatestVersionReturns } from "./release";
export type {
  AppearanceConfig,
  PlaylistViewConfig,
  DownloadConfig,
  ResourceConfig,
  DiagnosticsConfig,
  SettingsProps,
  SettingsMethods,
} from "./types";
