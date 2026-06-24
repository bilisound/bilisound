import { useShallow } from "zustand/shallow";
import { useSettingsStore } from "./store";
import type { AppearanceConfig, DownloadConfig, ResourceConfig, DiagnosticsConfig, AllConfig } from "./types";

type ConfigUpdater = <K extends keyof AllConfig>(key: K, value: AllConfig[K]) => void;
type ConfigToggler = <K extends keyof AllConfig>(key: K) => boolean;

export function useSettingsManagement(): AllConfig & { update: ConfigUpdater; toggle: ConfigToggler } {
  return useSettingsStore(
    useShallow(state => ({
      theme: state.theme,
      showYuruChara: state.showYuruChara,
      showPlaylistInGrid: state.showPlaylistInGrid,
      downloadNextTrack: state.downloadNextTrack,
      filterResourceURL: state.filterResourceURL,
      useLegacyID: state.useLegacyID,
      debugMode: state.debugMode,
      update: state.update,
      toggle: state.toggle,
    })),
  );
}

export function useAppearanceConfig(): AppearanceConfig & { update: ConfigUpdater; toggle: ConfigToggler } {
  return useSettingsStore(
    useShallow(state => ({
      theme: state.theme,
      showYuruChara: state.showYuruChara,
      showPlaylistInGrid: state.showPlaylistInGrid,
      update: state.update,
      toggle: state.toggle,
    })),
  );
}

export function usePlaylistViewConfig(): Pick<AppearanceConfig, "showPlaylistInGrid"> & { toggle: ConfigToggler } {
  return useSettingsStore(
    useShallow(state => ({
      showPlaylistInGrid: state.showPlaylistInGrid,
      toggle: state.toggle,
    })),
  );
}

export function useThemeConfig(): Pick<AppearanceConfig, "theme" | "showYuruChara"> & {
  update: ConfigUpdater;
  toggle: ConfigToggler;
} {
  return useSettingsStore(
    useShallow(state => ({
      theme: state.theme,
      showYuruChara: state.showYuruChara,
      update: state.update,
      toggle: state.toggle,
    })),
  );
}

export function useThemeName(): string {
  return useSettingsStore(state => state.theme);
}

export function useDownloadConfig(): DownloadConfig {
  return useSettingsStore(
    useShallow(state => ({
      downloadNextTrack: state.downloadNextTrack,
    })),
  );
}

export function useResourceConfig(): ResourceConfig {
  return useSettingsStore(
    useShallow(state => ({
      filterResourceURL: state.filterResourceURL,
      useLegacyID: state.useLegacyID,
    })),
  );
}

export function useDiagnosticsConfig(): DiagnosticsConfig & { toggle: ConfigToggler } {
  return useSettingsStore(
    useShallow(state => ({
      debugMode: state.debugMode,
      toggle: state.toggle,
    })),
  );
}

export function useShowYuruChara(): boolean {
  return useSettingsStore(state => state.showYuruChara);
}
