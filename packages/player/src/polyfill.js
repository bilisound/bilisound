import { Platform } from "react-native";

export function initPolyfill() {
  const mediaElement = globalThis.HTMLMediaElement;
  // 如果只有 webkitPreservesPitch 可用，则重定向 preservesPitch 过去
  if (
    Platform.OS === "web" &&
    mediaElement &&
    !mediaElement.prototype.hasOwnProperty("preservesPitch") &&
    mediaElement.prototype.hasOwnProperty("webkitPreservesPitch")
  ) {
    Object.defineProperty(mediaElement.prototype, "preservesPitch", {
      get() {
        return this.webkitPreservesPitch;
      },
      set(value) {
        this.webkitPreservesPitch = value;
      },
      configurable: true,
      enumerable: true,
    });
  }
}
