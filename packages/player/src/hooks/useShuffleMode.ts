import { addListener } from "../events";
import { getShuffleMode } from "../player";
import { ShuffleMode } from "../types";
import { createSubscriptionStore } from "../utils";

export const useShuffleMode = createSubscriptionStore({
  eventName: "onShuffleModeChange",
  fetchData: getShuffleMode,
  addListener,
  initialValue: ShuffleMode.OFF,
});
