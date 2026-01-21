import { addListener } from "../events";
import { getPlaybackState } from "../player";
import { createSubscriptionStore } from "../utils";

export const usePlaybackState = createSubscriptionStore({
  eventName: "onPlaybackStateChange",
  fetchData: getPlaybackState,
  addListener,
  initialValue: "STATE_IDLE",
});
