import { Text } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { Image } from "expo-image";
import { Pressable } from "react-native";

/**
 * discovery-video-item — 视频列表行（远程列表 / 历史记录）。
 *
 * 展示封面 + 标题 + 副标题，点击进入视频详情。
 */
export interface DiscoveryVideoItemProps {
  image: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

export function DiscoveryVideoItem({ image, title, subtitle, onPress }: DiscoveryVideoItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => (pressed ? { ...styles.row, opacity: 0.7 } : styles.row)}
    >
      <Image contentFit="cover" source={image} style={styles.image} />
      <View flex={1} gap="$1">
        <Text color="$text" numberOfLines={1} semiBold size="sm">
          {title}
        </Text>
        {subtitle ? (
          <Text color="$textMuted" numberOfLines={1} size="xs">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = {
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  image: {
    height: 48,
    aspectRatio: 3 / 2,
    borderRadius: 8,
  },
};
