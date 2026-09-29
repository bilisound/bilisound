import { setSpeed } from "@bilisound/player";
import { create } from "zustand";
import throttle from "lodash/throttle";

/**
 * features/playback/playback-speed — 播放速度状态（feature 内部）。
 *
 * 持有速度值与 retainPitch，并在变更时通过 player.setSpeed 应用。
 * UI 层通过 usePlaybackSpeed 订阅，不再直接 import ~/store/playback-speed。
 * 依赖方向：playback -> @bilisound/player（合法编排边界）。
 */

interface PlaybackSpeedState {
  speedValue: number;
  retainPitch: boolean;
  applySpeed: (value: number, retainPitch: boolean) => void;
}

const throttledSetSpeed = throttle(setSpeed, 100);

const usePlaybackSpeedStore = create<PlaybackSpeedState>((set, get) => ({
  speedValue: 1,
  retainPitch: false,
  applySpeed: (value: number, retainPitch: boolean) => {
    const got = get();
    if (got.speedValue === value && got.retainPitch === retainPitch) {
      // console.log("阻挡重复渲染");
      return;
    }
    set(() => ({ speedValue: value, retainPitch }));
    throttledSetSpeed(value, retainPitch);
  },
}));

/**
 * 订阅播放速度状态：speedValue / retainPitch / applySpeed
 */
export function usePlaybackSpeed() {
  const speedValue = usePlaybackSpeedStore(state => state.speedValue);
  const retainPitch = usePlaybackSpeedStore(state => state.retainPitch);
  const applySpeed = usePlaybackSpeedStore(state => state.applySpeed);
  return { speedValue, retainPitch, applySpeed };
}
