import useSettingsStore from "~/store/settings";
import type { AllConfig } from "./types";

type ConfigUpdater = <K extends keyof AllConfig>(key: K, value: AllConfig[K]) => void;
type ConfigToggler = <K extends keyof AllConfig>(key: K) => boolean;

export function getConfigState(): AllConfig {
  const state = useSettingsStore.getState();
  return {
    theme: state.theme,
    showYuruChara: state.showYuruChara,
    showPlaylistInGrid: state.showPlaylistInGrid,
    downloadNextTrack: state.downloadNextTrack,
    filterResourceURL: state.filterResourceURL,
    useLegacyID: state.useLegacyID,
    debugMode: state.debugMode,
  };
}

export function updateConfig(...args: Parameters<ConfigUpdater>) {
  useSettingsStore.getState().update(...args);
}

export function toggleConfig(...args: Parameters<ConfigToggler>): boolean {
  return useSettingsStore.getState().toggle(...args);
}

export async function rehydrateConfig(): Promise<void> {
  await useSettingsStore.persist.rehydrate();
}

export { useSettingsStore };
