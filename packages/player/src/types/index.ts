/**
 * 可供覆盖的曲目中的扩展数据类型
 *
 * @example
 *
 * ```ts
 * // typings.d.ts or player.ts
 * import '@bilisound/player';
 *
 * declare module '@bilisound/player' {
 *   interface ExtendedData {
 *     requiresAuth?: boolean
 *   }
 * }
 * ```
 */
export interface ExtendedData extends Record<string, unknown> {}

export interface TrackData {
  id: string;
  uri: string;
  artworkUri?: string | null;
  title?: string | null;
  artist?: string | null;
  duration?: number | null;
  mimeType?: string | null;
  headers?: Record<string, string> | null;
  extendedData?: ExtendedData | null;
}

export interface TrackDataInternal {
  id: string;
  uri: string;
  artworkUri: string | null;
  title: string | null;
  artist: string | null;
  duration: number | null;
  mimeType: string | null;
  headers: string | null;
  extendedData: string | null;
}

export interface DownloadData {
  headers: Record<string, string>;
}

export interface Download {
  bytesDownloaded: number;
  bytesTotal: number;
  id: string;
  state: number;
  uri: string;
}

export interface PlaybackProgress {
  duration: number;
  position: number;
  buffered: number;
}

// 播放状态类型
export type PlaybackState = "STATE_IDLE" | "STATE_BUFFERING" | "STATE_READY" | "STATE_ENDED";

// 错误类型
export type ErrorType = "ERROR_NETWORK_FAILURE" | "ERROR_BAD_HTTP_STATUS_CODE" | "ERROR_GENERIC";

// 下载状态字典
export enum DownloadState {
  /** The download is waiting to be started. */
  STATE_QUEUED = 0,

  /** The download is stopped for a specified. */
  STATE_STOPPED = 1,

  /** The download is currently started. */
  STATE_DOWNLOADING = 2,

  /** The download completed. */
  STATE_COMPLETED = 3,

  /** The download failed. */
  STATE_FAILED = 4,

  /** The download is being removed. */
  STATE_REMOVING = 5,

  /** The download will restart after all downloaded data is removed. */
  STATE_RESTARTING = 7,
}

export enum RepeatMode {
  /** No repeat */
  OFF = 0,

  /** Repeat current track */
  ONE = 1,

  /** Repeat all tracks */
  ALL = 2,
}

/**
 * 下载项目
 */
export interface DownloadItem {
  bytesDownloaded: number;
  bytesTotal: number;
  id: string;
  state: number;
  uri: string;
}

// 播放状态变化事件
export interface PlaybackStateChangeEvent {
  type: PlaybackState;
}

// 播放错误事件
export interface PlaybackErrorEvent {
  type: ErrorType;
  message: string;
  code?: number;
}

export interface IsPlayingChangeEvent {
  isPlaying: boolean;
}

export type DownloadUpdateEvent =
  | {
      type: "DOWNLOAD_CHANGE";
      download: Download;
      error?: string | null;
    }
  | {
      type: "DOWNLOAD_REMOVE";
      download: Download;
    }
  | {
      type: "DOWNLOAD_GLOBAL_STATE_CHANGE";
      paused: boolean;
    };

export interface RepeatModeChangeEvent {
  mode: RepeatMode;
}

export interface EventList {
  onPlaybackStateChange: PlaybackStateChangeEvent;
  onPlaybackError: PlaybackErrorEvent;
  onQueueChange: null;
  onTrackChange: null;
  onIsPlayingChange: IsPlayingChangeEvent;
  onDownloadUpdate: DownloadUpdateEvent;
  onRepeatModeChange: RepeatModeChangeEvent;
  [key: string]: any;
}

export interface EventListFunc {
  onPlaybackStateChange: (params: PlaybackStateChangeEvent) => void;
  onPlaybackError: (params: PlaybackErrorEvent) => void;
  onQueueChange: (params: null) => void;
  onTrackChange: (params: null) => void;
  onIsPlayingChange: (params: IsPlayingChangeEvent) => void;
  onDownloadUpdate: (params: DownloadUpdateEvent) => void;
  onRepeatModeChange: (params: RepeatModeChangeEvent) => void;
  [key: string]: any;
}

export type BackgroundEventParam = {
  [K in keyof EventList]: {
    event: K;
    data: EventList[K];
  };
}[keyof EventList];

export type BackgroundEventParamUnconfirmed = {
  event: keyof EventList | string;
  data: any;
};

export type BackgroundEventListener = (param: BackgroundEventParam) => Promise<void> | void;
