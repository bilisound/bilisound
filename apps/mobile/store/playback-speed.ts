import { setSpeed } from "@bilisound/player";
import { create } from "zustand";
import throttle from "lodash/throttle";

interface PlaybackSpeedState {
  speedValue: number;
  retainPitch: boolean;
  applySpeed: (value: number, retainPitch: boolean) => void;
}

const throttledSetSpeed = throttle(setSpeed, 100);

export const usePlaybackSpeedStore = create<PlaybackSpeedState>((set, get) => ({
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
