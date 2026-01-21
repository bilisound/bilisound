import { addListener } from "../events";
import { getIsPlaying } from "../player";
import { createSubscriptionStore } from "../utils";

export const useIsPlaying = createSubscriptionStore({
  eventName: "onIsPlayingChange",
  fetchData: getIsPlaying,
  addListener,
  initialValue: false,
});
