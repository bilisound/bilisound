import { addListener } from "../events";
import { getTracks } from "../player";
import { createSubscriptionStore } from "../utils";

export const useQueue = createSubscriptionStore({
  eventName: "onQueueChange",
  fetchData: getTracks,
  addListener,
  initialValue: [],
});
