import * as Player from "@bilisound/player";
import { registerBackgroundEventListener } from "@bilisound/player";

import { saveCurrentAndNextTrack } from "./cache";
import { saveTrackData } from "./queue-persistence";
import { refreshCurrentTrack } from "./track-operations";

/**
 * 注册后台播放事件（曲目切换后：刷新曲目、持久化队列、预取缓存）。
 *
 * 由 app 根布局调用；播放编排细节保留在 playback 边界内，路由层不再直接
 * 依赖 @bilisound/player。
 */
export function registerPlaybackBackgroundEvents() {
  registerBackgroundEventListener(async ({ event }) => {
    if (event !== "onTrackChange") {
      return;
    }
    const trackData = await Player.getCurrentTrack();
    if (!trackData) {
      return;
    }
    await refreshCurrentTrack();
    await saveTrackData();
    await saveCurrentAndNextTrack();
  });
}
