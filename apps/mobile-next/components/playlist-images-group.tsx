import { View } from "@tamagui/core";
import { Image } from "expo-image";

import { getVideoImageUrl } from "~/features/bilibili";

export interface PlaylistImagesGroupProps {
  images: string[];
}

/**
 * 详情页头图组，由 v2 `apps/mobile/components/playlist-detail/ImagesGroup.tsx`
 * 搬运：0 张占位、1-3 张单图、4 张及以上 2x2 拼图。
 */
export function PlaylistImagesGroup({ images: rawImages }: PlaylistImagesGroupProps) {
  // Stored covers are often http:// URLs, which iOS ATS blocks; Web needs the referer proxy.
  const images = rawImages.map(url => getVideoImageUrl(url));
  if (images.length === 0) {
    return <View width="100%" aspectRatio={16 / 9} borderRadius="$2" backgroundColor="$surfaceMuted" />;
  }

  if (images.length <= 3) {
    return (
      <Image source={images[0]} style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 8 }} contentFit="cover" />
    );
  }

  return (
    <View width="100%" aspectRatio={16 / 9} borderRadius="$2" overflow="hidden">
      <View flexDirection="row" flex={1}>
        <Image source={images[0]} style={{ flex: 1 }} contentFit="cover" />
        <Image source={images[1]} style={{ flex: 1 }} contentFit="cover" />
      </View>
      <View flexDirection="row" flex={1}>
        <Image source={images[2]} style={{ flex: 1 }} contentFit="cover" />
        <Image source={images[3]} style={{ flex: 1 }} contentFit="cover" />
      </View>
    </View>
  );
}
