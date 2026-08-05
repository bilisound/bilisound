import { addListener } from "../events";
import { getPlaybackOrder } from "../player";
import { createSubscriptionStore } from "../utils";

/**
 * 当前播放顺序（canonical index 数组）。
 *
 * 队列变化与随机模式切换都会改变播放顺序，所以两个事件都要订阅。
 */
export const usePlaybackOrder = createSubscriptionStore<number[]>({
  eventName: ["onQueueChange", "onShuffleModeChange"],
  fetchData: getPlaybackOrder,
  addListener,
  initialValue: [],
});
