import * as Player from "@bilisound/player";
import { registerBackgroundEventListener } from "@bilisound/player";

import { saveCurrentAndNextTrack } from "./cache";
import { saveTrackData } from "./queue-persistence";
import { handlePlaybackError, refreshCurrentTrack, resetPlaybackErrorRecovery } from "./track-operations";

/**
 * 注册后台播放事件（曲目切换后：刷新曲目、持久化队列、预取缓存；播放错误后恢复）。
 *
 * 由 app 根布局调用；播放编排细节保留在 playback 边界内，路由层不再直接
 * 依赖 @bilisound/player。
 */
export function registerPlaybackBackgroundEvents() {
  registerBackgroundEventListener(async param => {
    switch (param.event) {
      case "onTrackChange": {
        resetPlaybackErrorRecovery();
        const trackData = await Player.getCurrentTrack();
        if (!trackData) {
          return;
        }
        await refreshCurrentTrack();
        await saveTrackData();
        await saveCurrentAndNextTrack();
        return;
      }
      case "onPlaybackError": {
        await handlePlaybackError(param.data);
        return;
      }
      default:
        return;
    }
  });
}
