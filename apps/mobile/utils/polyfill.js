import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import "core-js/actual/structured-clone";

if (globalThis.window) {
  globalThis.window.clearImmediate = globalThis.window.clearTimeout;
}
