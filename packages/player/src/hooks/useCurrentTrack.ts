import { addListener } from "../events";
import { getCurrentTrack } from "../player";
import { createSubscriptionStore } from "../utils";

export const useCurrentTrack = createSubscriptionStore({
  eventName: "onTrackChange",
  fetchData: getCurrentTrack,
  addListener,
  initialValue: undefined,
});
