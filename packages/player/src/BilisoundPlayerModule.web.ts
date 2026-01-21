import { registerWebModule, NativeModule } from "expo";

import {
  DownloadState,
  EventListFunc,
  PlaybackProgress,
  PlaybackState,
  TrackData,
  TrackDataInternal,
  RepeatMode,
} from "./types";
import { BilisoundPlayerModuleInterface } from "./types/module";
import { deleteItems } from "./utils";

class BilisoundPlayerModuleWeb
  extends NativeModule<EventListFunc>
  implements BilisoundPlayerModuleInterface
{
  private static isMediaSessionAvailable = !!window?.navigator?.mediaSession;
  /**
   * HTMLAudioElement 本体
   */
  private audioElement: HTMLAudioElement;
  /**
   * 播放队列
   */
  private trackData: TrackData[] = [];
  /**
   * 实例 ID
   */
  private readonly id = window.crypto.randomUUID();
  /**
   * 当前播放内容在队列中的位置
   */
  private index = -1;
  /**
   * 播放速度设置
   * @private
   */
  private playbackSpeedOption = {
    speed: 1,
    retainPitch: true,
  };
  private playbackState: PlaybackState = "STATE_IDLE";
  private repeatMode: RepeatMode = RepeatMode.OFF;

  constructor() {
    super();
    const el = document.createElement("audio");
    el.dataset.managedByBilisound = this.id;
    el.addEventListener("loadstart", () => {
      this.playbackState = "STATE_BUFFERING";
      this.emit("onPlaybackStateChange", {
        type: "STATE_BUFFERING",
      });
    });
    el.addEventListener("canplay", () => {
      this.playbackState = "STATE_READY";
      this.emit("onPlaybackStateChange", {
        type: "STATE_READY",
      });
    });
    el.addEventListener("ended", async () => {
      switch (this.repeatMode) {
        case RepeatMode.ONE: {
          await this.jump(this.index);
          await this.play();
          break;
        }
        case RepeatMode.ALL: {
          if (this.index >= this.trackData.length - 1) {
            await this.jump(0);
          } else {
            await this.next();
          }
          await this.play();
          break;
        }
        case RepeatMode.OFF:
        default: {
          if (this.index >= this.trackData.length - 1) {
            // 没有可以继续播放的内容了！
            this.playbackState = "STATE_ENDED";
            this.emit("onPlaybackStateChange", {
              type: "STATE_ENDED",
            });
          } else {
            // 播放下一首
            await this.next();
            await this.play();
          }
          break;
        }
      }
    });
    el.addEventListener("play", () => {
      this.emit("onIsPlayingChange", { isPlaying: true });
    });
    el.addEventListener("pause", () => {
      this.emit("onIsPlayingChange", { isPlaying: false });
    });
    el.addEventListener("error", (e) => {
      this.emit("onPlaybackError", {
        type: "ERROR_GENERIC",
        message: e.message,
      });
    });
    if (BilisoundPlayerModuleWeb.isMediaSessionAvailable) {
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        this.prev(),
      );
      navigator.mediaSession.setActionHandler("nexttrack", () => this.next());
    }

    // 挂载元素
    document.body.appendChild(el);
    this.audioElement = el;
  }

  private emitQueueChange() {
    this.emit("onQueueChange", null);
  }

  private emitCurrentChange() {
    this.emit("onTrackChange", null);
  }

  /**
   * 更新 Media Session，这样用户可以使用媒体键或在锁屏界面控制 Bilisound
   */
  private updateMediaSession() {
    if (!BilisoundPlayerModuleWeb.isMediaSessionAvailable) {
      return;
    }
    const current = this.trackData[this.index];
    if (!current) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title ?? "",
      artist: current.artist ?? "",
      artwork: [
        {
          src: current.artworkUri ?? "",
        },
      ],
    });
  }

  private clear() {
    this.audioElement.pause();
    this.audioElement.src = "";
    this.index = -1;
    this.trackData = [];
  }

  private assertInRange(index: number) {
    if (index < 0 || index > this.trackData.length - 1) {
      throw new Error("非法的索引值");
    }
  }

  async play() {
    await this.audioElement.play();
  }

  async pause() {
    this.audioElement.pause();
  }

  async prev() {
    const { audioElement } = this;
    if (!audioElement) {
      return;
    }
    // https://ux.stackexchange.com/questions/80335/why-does-previous-button-in-music-player-apps-start-the-current-track-from-the-b
    if (!audioElement.paused && audioElement.currentTime > 3) {
      audioElement.currentTime = 0;
      return;
    }
    if (this.index > 0) {
      await this.jump(this.index - 1);
    }
  }

  async next() {
    if (this.index < this.trackData.length - 1) {
      await this.jump(this.index + 1);
    }
  }

  async toggle() {
    if (this.audioElement.paused) {
      await this.play();
    } else {
      await this.pause();
    }
  }

  async seek(to: number) {
    this.audioElement.currentTime = to;
  }

  async jump(to: number) {
    return this.setCurrent(to);
  }

  private async setCurrent(
    to: number,
    options: { noUpdateUri?: boolean } = {},
  ) {
    const { audioElement } = this;
    if (!audioElement) {
      return;
    }
    if (this.trackData.length <= 0) {
      audioElement.pause();
      audioElement.src = "";
      return;
    }
    this.assertInRange(to);
    this.index = to;
    const prevPlayState = !audioElement.paused;
    const obj = this.trackData[to];
    if (!options.noUpdateUri) {
      audioElement.src = obj.uri;
    }

    this.emitCurrentChange();
    if (prevPlayState) {
      await this.play();
    }

    const { speed, retainPitch } = this.playbackSpeedOption;
    this.audioElement.playbackRate = speed;
    this.audioElement.preservesPitch = retainPitch;
    this.updateMediaSession();
  }

  async getProgress(): Promise<PlaybackProgress> {
    const { audioElement } = this;
    return {
      // 当前播放时间
      position: audioElement.currentTime || 0,
      // 音频总长度
      duration: audioElement.duration || 0,
      // 已加载长度
      buffered:
        audioElement.buffered.length > 0
          ? audioElement.buffered.end(audioElement.buffered.length - 1)
          : 0,
    };
  }

  async getPlaybackState(): Promise<PlaybackState> {
    return this.playbackState;
  }

  async getIsPlaying(): Promise<boolean> {
    return !this.audioElement.paused;
  }

  async getCurrentTrack(): Promise<TrackDataInternal | null> {
    return null;
  }

  async getCurrentTrackWeb(): Promise<TrackData | null> {
    return this.trackData[this.index] ?? null;
  }

  async getCurrentTrackIndex() {
    return this.index;
  }

  async setSpeed(speed: number, retainPitch: boolean) {
    this.playbackSpeedOption = {
      speed,
      retainPitch,
    };
    this.audioElement.playbackRate = speed;
    this.audioElement.preservesPitch = retainPitch;
  }

  async addTrack(trackDataJson: TrackData) {
    this.trackData.push(trackDataJson);
    if (this.index < 0) {
      await this.jump(0);
    }
    this.emitQueueChange();
    this.emitCurrentChange();
  }

  async addTrackAt(trackDataJson: TrackData, index: number) {
    this.assertInRange(index);
    this.trackData.splice(index, 1, trackDataJson);
    if (this.index >= index) {
      this.index += 1;
    }
    this.emitQueueChange();
    this.emitCurrentChange();
  }

  async addTracks(trackDatasJson: TrackData[]) {
    this.trackData.push(...trackDatasJson);
    if (this.index < 0) {
      await this.jump(0);
    }
    this.emitQueueChange();
    this.emitCurrentChange();
  }

  async addTracksAt(trackDatasJson: TrackData[], index: number) {
    this.assertInRange(index);
    this.trackData.splice(index, 0, ...trackDatasJson);
    if (this.index >= index) {
      this.index += trackDatasJson.length;
    }
    this.emitQueueChange();
    this.emitCurrentChange();
  }

  async getTracks(): Promise<TrackData[]> {
    return structuredClone(this.trackData);
  }

  async replaceTrack(index: number, trackDataJson: TrackData) {
    const previousUri = this.trackData[this.index].uri;
    this.trackData[index] = structuredClone(trackDataJson);
    if (index === this.index) {
      await this.setCurrent(index, {
        // URL 相比之前在 trackData 项中的变了，才对 audio element 进行显式 url 更新
        noUpdateUri: previousUri === trackDataJson.uri,
      });
    }
    this.emitQueueChange();
  }

  async deleteTrack(index: number) {
    this.trackData.splice(index, 1);
    if (index === this.index) {
      await this.setCurrent(index);
    }
    if (index > this.index) {
      this.index -= 1;
    }
    this.emitQueueChange();
  }

  async deleteTracks(indexesJson: number[]) {
    if (indexesJson.includes(this.index)) {
      // 被删除的 track 恰好是正在播放的
      this.trackData = deleteItems(this.trackData, indexesJson);
      if (this.index >= this.trackData.length - 1) {
        await this.setCurrent(this.trackData.length - 1);
      } else {
        await this.setCurrent(this.index);
      }
    } else {
      const targetId = this.trackData[this.index].id;
      this.trackData = deleteItems(this.trackData, indexesJson);
      this.index = this.trackData.findIndex((e) => e.id === targetId);
    }

    this.emitQueueChange();
  }

  async clearQueue() {
    this.clear();
    this.emitQueueChange();
  }

  async setQueue(trackDatasJson: TrackData[], beginIndex: number) {
    this.clear();
    await this.addTracks(trackDatasJson);
    await this.jump(beginIndex);
  }

  async addDownload(id: string, uri: string, metadataJson: string) {}

  async getDownload(id: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

  async getDownloads(state?: DownloadState): Promise<string> {
    throw new Error("Method not implemented.");
  }

  async pauseDownload(id: string) {}

  async resumeDownload(id: string) {}

  async pauseAllDownloads() {}

  async resumeAllDownloads() {}

  async removeDownload(id: string) {}

  async getRepeatMode(): Promise<number> {
    return this.repeatMode;
  }

  async setRepeatMode(mode: number): Promise<void> {
    this.repeatMode = mode;
    this.emit("onRepeatModeChange", { mode });
  }

  async saveFile(path: string, mimeType: string, replaceName?: string | null) {}
}

export const BilisoundPlayerModule = registerWebModule(
  BilisoundPlayerModuleWeb,
  "BilisoundPlayerModule"
);
