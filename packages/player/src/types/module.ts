import { DownloadState, PlaybackProgress, PlaybackState, RepeatMode, TrackData, TrackDataInternal } from "./index";

export interface BilisoundPlayerModuleInterface {
  // 播放器相关
  play(): Promise<void>;
  pause(): Promise<void>;
  prev(): Promise<void>;
  next(): Promise<void>;
  toggle(): Promise<void>;
  seek(to: number): Promise<void>;
  jump(to: number): Promise<void>;
  getProgress(): Promise<PlaybackProgress>;
  getPlaybackState(): Promise<PlaybackState>;
  getIsPlaying(): Promise<boolean>;
  getCurrentTrack(): Promise<TrackDataInternal | null>;
  getCurrentTrackWeb(): Promise<TrackData | null>;
  getCurrentTrackIndex(): Promise<number>;
  setSpeed(speed: number, retainPitch: boolean): Promise<void>;
  getRepeatMode(): Promise<RepeatMode>;
  setRepeatMode(mode: RepeatMode): Promise<void>;

  // 播放队列相关
  addTrack(trackDataJson: string | TrackData): Promise<void>;
  addTrackAt(trackDataJson: string | TrackData, index: number): Promise<void>;
  addTracks(trackDatasJson: string | TrackData[]): Promise<void>;
  addTracksAt(trackDatasJson: string | TrackData[], index: number): Promise<void>;
  getTracks(): Promise<string | TrackData[]>;
  replaceTrack(index: number, trackDataJson: string | TrackData): Promise<void>;
  deleteTrack(index: number): Promise<void>;
  deleteTracks(indexesJson: string | number[]): Promise<void>;
  clearQueue(): Promise<void>;
  setQueue(trackDatasJson: string | TrackData[], beginIndex: number): Promise<void>;

  // 缓存管理相关
  addDownload(id: string, uri: string, metadataJson: string): Promise<void>;
  getDownload(id: string): Promise<string>;
  getDownloads(state?: DownloadState): Promise<string>;
  pauseDownload(id: string): Promise<void>;
  resumeDownload(id: string): Promise<void>;
  pauseAllDownloads(): Promise<void>;
  resumeAllDownloads(): Promise<void>;
  removeDownload(id: string): Promise<void>;

  // 文件操作相关
  saveFile(path: string, mimeType: string, replaceName: string | null): Promise<void>;
}
