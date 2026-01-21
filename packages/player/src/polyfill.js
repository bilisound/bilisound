import { Platform } from "react-native";

export function initPolyfill() {
  // 如果只有 webkitPreservesPitch 可用，则重定向 preservesPitch 过去
  if (
    Platform.OS === "web" &&
    !HTMLMediaElement.prototype.hasOwnProperty("preservesPitch") &&
    HTMLMediaElement.prototype.hasOwnProperty("webkitPreservesPitch")
  ) {
    Object.defineProperty(HTMLMediaElement.prototype, "preservesPitch", {
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
