import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { cssInterop, remapProps } from "nativewind";

import LogViewerDom from "~/components/dom/LogViewerDom";
import { Monicon } from "@monicon/native";

cssInterop(Image, {
  className: {
    target: "style",
  },
});
remapProps(LinearGradient, {
  className: "style",
});
cssInterop(LogViewerDom, { className: "style" });
cssInterop(Monicon, {
  className: {
    // @ts-ignore
    target: "style",
    nativeStyleToProp: {
      color: true,
    },
  },
});
