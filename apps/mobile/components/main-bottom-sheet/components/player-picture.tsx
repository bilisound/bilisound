import { useCurrentTrack } from "@bilisound/player";
import React, { useState } from "react";
import { View } from "react-native";
import { shadow } from "~/constants/styles";
import { Image } from "expo-image";
import { convertToHTTPS } from "~/utils/string";

export function PlayerPicture() {
  const currentTrack = useCurrentTrack();
  const [imageSize, setImageSize] = useState(0);

  return (
    <View
      className={"flex-1 items-center justify-center overflow-hidden"}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        // padding 是 32dp `p-8`
        const minSize = Math.min(width, height);
        const target = minSize - (minSize >= 448 ? 128 : 64);
        // 抖动缓解措施
        if (target > 0) {
          setImageSize(minSize - (minSize >= 448 ? 128 : 64));
        }
      }}
    >
      <View
        style={{ width: imageSize, height: imageSize, boxShadow: shadow["xl"] }}
        className={"rounded-2xl overflow-hidden"}
      >
        <Image source={convertToHTTPS(currentTrack?.artworkUri + "")} className={"size-full"}></Image>
      </View>
    </View>
  );
}
