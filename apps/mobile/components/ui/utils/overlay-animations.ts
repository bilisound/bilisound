import { Easing, Keyframe } from "react-native-reanimated";

const DIALOG_DURATION = 250;
const MENU_DURATION = 100;
export const DIALOG_BACKDROP_OPACITY = 0.7;
const easing = Easing.inOut(Easing.ease);

export const dialogContentEntering = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.95 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing },
}).duration(DIALOG_DURATION);
export const dialogContentExiting = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 0.95 }], easing },
}).duration(DIALOG_DURATION);
export const dialogBackdropEntering = new Keyframe({
  0: { opacity: 0 },
  100: { opacity: DIALOG_BACKDROP_OPACITY, easing },
}).duration(DIALOG_DURATION);
export const dialogBackdropExiting = new Keyframe({
  0: { opacity: DIALOG_BACKDROP_OPACITY },
  100: { opacity: 0, easing },
}).duration(DIALOG_DURATION);
export const menuEntering = new Keyframe({
  0: { opacity: 0 },
  100: { opacity: 1, easing },
}).duration(MENU_DURATION);
export const menuExiting = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 0.8 }], easing },
}).duration(MENU_DURATION);
