import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { cssInterop, remapProps } from "nativewind";

import LogViewerDom from "~/components/dom/LogViewerDom";

cssInterop(Image, {
  className: {
    target: "style",
  },
});
remapProps(LinearGradient, {
  className: "style",
});
cssInterop(LogViewerDom, { className: "style" });
