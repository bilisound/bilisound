import { getConfigState } from "./store";
import type { DownloadConfig, ResourceConfig, DiagnosticsConfig } from "./types";

export function getDownloadPolicy(): DownloadConfig {
  const state = getConfigState();
  return {
    downloadNextTrack: state.downloadNextTrack,
  };
}

export function getResourcePolicy(): ResourceConfig {
  const state = getConfigState();
  return {
    filterResourceURL: state.filterResourceURL,
    useLegacyID: state.useLegacyID,
  };
}

export function getDiagnosticsConfig(): DiagnosticsConfig {
  const state = getConfigState();
  return {
    debugMode: state.debugMode,
  };
}

export function shouldFilterResourceURL(): boolean {
  return getConfigState().filterResourceURL;
}

export function shouldUseLegacyID(): boolean {
  return getConfigState().useLegacyID;
}

export function shouldDownloadNextTrack(): boolean {
  return getConfigState().downloadNextTrack;
}

export function isDebugMode(): boolean {
  return getConfigState().debugMode;
}
