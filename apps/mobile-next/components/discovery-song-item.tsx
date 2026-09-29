import { Text } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { Pressable } from "react-native";

import { formatSecond } from "~/utils/datetime";

/**
 * discovery-song-item — 视频分 P 行（视频详情 / 下载页）。
 *
 * 点击播放，长按打开分 P 操作菜单。
 */
export interface DiscoverySongItemProps {
  /** 分 P 序号（展示用；播放使用原始 episode） */
  page: number;
  title: string;
  duration: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export function DiscoverySongItem({ page, title, duration, onPress, onLongPress }: DiscoverySongItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => (pressed ? { ...styles.row, opacity: 0.7 } : styles.row)}
    >
      <View
        alignItems="center"
        backgroundColor="$primarySolid"
        borderRadius="$1.5"
        height={22}
        justifyContent="center"
        minWidth={22}
        paddingHorizontal="$2"
      >
        <Text color="$primaryOnSolid" size="sm">
          {page}
        </Text>
      </View>
      <View flex={1} gap="$1">
        <Text color="$text" numberOfLines={1} size="sm">
          {title}
        </Text>
        <Text color="$textMuted" size="sm">
          {formatSecond(duration)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = {
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    height: 64,
    paddingHorizontal: 16,
  },
};
