import { Icon, Text } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { Image } from "expo-image";
import { Pressable } from "react-native";

import { getVideoImageUrl } from "~/features/bilibili";
import type { Playlist } from "~/features/playlist";

export interface PlaylistItemProps {
  item: Playlist;
  grid?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * 歌单列表项（列表行 / 网格卡片两种形态），由 v2
 * `apps/mobile/components/playlist-item.tsx` 搬运；骨架屏分支未迁移
 * （v2 的 Skeleton 无对应 UI 组件，且列表数据就位后才渲染）。
 */
export function PlaylistItem({ item, grid = false, onPress, onLongPress }: PlaylistItemProps) {
  const a11yLabel = `${item.source ? "在线歌单 " : ""}${item.title}，${item.amount} 首歌曲`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="打开歌单详情，长按显示更多操作"
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        flex: grid ? 1 : undefined,
        paddingHorizontal: grid ? 8 : 20,
        paddingVertical: grid ? 8 : 12,
        minWidth: 0,
      })}
    >
      {grid ? <GridView item={item} /> : <RowView item={item} />}
    </Pressable>
  );
}

function RowView({ item }: { item: Playlist }) {
  return (
    <>
      <View flexDirection="row" alignItems="center" gap="$3">
        <SourceMark item={item} />
        <Text flex={1} minWidth={0} color="$text" truncated>
          {item.title}
        </Text>
      </View>
      <Text color="$textMuted" marginTop="$1" marginLeft={36} size="sm">
        {`${item.amount} 首歌曲`}
      </Text>
    </>
  );
}

function GridView({ item }: { item: Playlist }) {
  return (
    <>
      <View width="100%" aspectRatio={1} borderRadius="$4" backgroundColor="$surfaceMuted" overflow="hidden">
        {item.imgUrl ? (
          <Image source={getVideoImageUrl(item.imgUrl)} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : null}
        {item.source ? (
          <View
            position="absolute"
            right={8}
            bottom={8}
            width={26}
            height={26}
            borderRadius="$full"
            alignItems="center"
            justifyContent="center"
            backgroundColor="$surface"
          >
            <Icon name="fa6-solid:cloud" size={14} color={item.color} />
          </View>
        ) : null}
      </View>
      <Text color="$text" size="sm" truncated marginTop="$2">
        {item.title}
      </Text>
      <Text color="$textMuted" size="xs" truncated marginTop="$1">
        {`${item.amount} 首歌曲`}
      </Text>
    </>
  );
}

function SourceMark({ item }: { item: Playlist }) {
  return (
    <View width={24} height={24} alignItems="center" justifyContent="center">
      {item.source ? (
        <Icon name="fa6-solid:cloud" size={20} color={item.color} />
      ) : (
        <View width={14} height={14} borderRadius="$full" style={{ backgroundColor: item.color }} />
      )}
    </View>
  );
}
