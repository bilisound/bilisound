import { useSyncExternalStore } from "react";

import { getProgress } from "../player";
import { PlaybackProgress } from "../types";

const progressListeners: Set<() => void> = new Set();
let previousProgress: PlaybackProgress = {
  duration: 0,
  position: 0,
  buffered: 0,
};
let currentProgress: PlaybackProgress = {
  duration: 0,
  position: 0,
  buffered: 0,
};

let hasLooping = false;

const loop = async () => {
  previousProgress = currentProgress;
  const result = await getProgress();
  if (
    previousProgress.duration !== result.duration ||
    previousProgress.position !== result.position ||
    previousProgress.buffered !== result.buffered
  ) {
    currentProgress = result;
    // console.log(result);
    progressListeners.forEach(listener => listener());
  }
  if (progressListeners.size <= 0) {
    // console.log("Looping exit!!");
    hasLooping = false;
    return;
  }
  // return requestAnimationFrame(loop);
  return setTimeout(loop, 50);
};

const subscribe = (listener: () => void) => {
  progressListeners.add(listener);
  if (!hasLooping) {
    hasLooping = true;
    // console.log("Looping enter!!");
    loop();
  }
  return () => {
    progressListeners.delete(listener);
  };
};

const getSnapshot = (): PlaybackProgress => {
  return currentProgress;
};

/**
 * 获取当前播放进度、总时长和已加载时长
 */
export const useProgress = () => {
  return useSyncExternalStore(subscribe, getSnapshot);
};
