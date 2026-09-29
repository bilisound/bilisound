import { Text } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { Image } from "expo-image";
import { Pressable } from "react-native";

export interface PlaylistVideoItemProps {
  image: string;
  text1: string;
  text2: string;
  onPress?: () => void;
}

/**
 * 视频/曲目预览行，由 v2 `apps/mobile/components/video-item.tsx` 搬运
 * （用于「添加到歌单」页的单曲预览）。
 */
export function PlaylistVideoItem({ image, text1, text2, onPress }: PlaylistVideoItemProps) {
  const inner = (
    <>
      <Image source={image} style={{ height: 48, width: 72, borderRadius: 8 }} contentFit="cover" />
      <View flex={1} gap="$1" minWidth={0}>
        <Text color="$text" semiBold size="sm" truncated>
          {text1}
        </Text>
        <Text color="$textMuted" size="xs" truncated>
          {text2}
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${text1}，${text2}`}
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
        })}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View flexDirection="row" alignItems="center" gap="$4" paddingHorizontal="$4" paddingVertical="$3">
      {inner}
    </View>
  );
}
