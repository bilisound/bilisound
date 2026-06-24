export interface AppearanceConfig {
  theme: string;
  showYuruChara: boolean;
  showPlaylistInGrid: boolean;
}

export interface DownloadConfig {
  downloadNextTrack: boolean;
}

export interface ResourceConfig {
  filterResourceURL: boolean;
  useLegacyID: boolean;
}

export interface DiagnosticsConfig {
  debugMode: boolean;
}

export interface AllConfig extends AppearanceConfig, DownloadConfig, ResourceConfig, DiagnosticsConfig {}
