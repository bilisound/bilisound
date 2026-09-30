/**
 * Shared helpers for the RNW `Pressable` selection-host regression tests.
 *
 * On web, `react-native-web` renders a Pressable carrying `accessibilityRole="button"`
 * as a real `<button>` element (`AccessibilityUtil/propsToAccessibilityComponent` →
 * `roleComponents.button`), and its PressResponder deliberately skips `onPress` on
 * keyup for native interactive elements (`PressResponder.js`, the
 * `isNativeInteractiveElement` guard). A real browser therefore activates these
 * hosts with the click it synthesizes for the focused button; jsdom does not
 * implement that default action, so this helper dispatches exactly the click a
 * browser would produce for one key press.
 */
import { act } from "react";

import { clickElement, pressKey } from "./harness";

/** One full browser key press: keydown + keyup + the synthesized click. */
export async function pressNativeButtonKey(target: Element, key: string) {
  const down = await pressKey(target, key);
  const up = new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key });
  await act(async () => {
    target.dispatchEvent(up);
  });
  await clickElement(target);
  return { down, up };
}
