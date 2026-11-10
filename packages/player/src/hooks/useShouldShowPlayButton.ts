import { addListener } from "../events";
import { getShouldShowPlayButton } from "../player";
import { createSubscriptionStore } from "../utils";

export const useShouldShowPlayButton = createSubscriptionStore({
  eventName: "onShouldShowPlayButtonChange",
  fetchData: getShouldShowPlayButton,
  addListener,
  initialValue: true,
});
