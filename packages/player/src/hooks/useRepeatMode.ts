import { addListener } from "../events";
import { getRepeatMode } from "../player";
import { RepeatMode } from "../types";
import { createSubscriptionStore } from "../utils";

export const useRepeatMode = createSubscriptionStore({
  eventName: "onRepeatModeChange",
  fetchData: getRepeatMode,
  addListener,
  initialValue: RepeatMode.OFF,
});
