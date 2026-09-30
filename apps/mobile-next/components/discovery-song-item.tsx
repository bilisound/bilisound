import { Icon, Text } from "@bilisound/ui";
import { useTheme, View } from "@tamagui/core";
import { ActivityIndicator, Pressable } from "react-native";

import { PLACEHOLDER_AUDIO } from "~/constants/playback";
import { useCacheExists } from "~/features/cache";
import * as Player from "~/features/player";
import { useCurrentTrack, useIsPlaying, usePlaybackState } from "~/features/player";
import { formatSecond } from "~/utils/datetime";

/**
 * discovery-song-item — 视频分 P 行（视频详情页）。
 *
 * 行为搬运自 v2 `components/song-item.tsx` 的视频详情使用场景：
 * - 点击当前播放曲目 = 播放/暂停切换；点击其它分 P = 请求播放
 * - 当前播放行以 accent 高亮，并展示缓冲中 / 播放中 / 暂停状态
 * - 已缓存到本地的分 P 展示对勾标记
 * - 长按打开分 P 操作菜单
 */
export interface DiscoverySongItemProps {
  bvid: string;
  /** 分 P 序号（展示用；同时作为播放使用的 episode） */
  page: number;
  title: string;
  duration: number;
  onRequestPlay?: () => void;
  onLongPress?: () => void;
}

export function DiscoverySongItem({ bvid, page, title, duration, onRequestPlay, onLongPress }: DiscoverySongItemProps) {
  const theme = useTheme();
  const activeTrack = useCurrentTrack();
  const isActiveTrack = bvid === activeTrack?.extendedData?.id && page === activeTrack?.extendedData?.episode;
  const cached = useCacheExists(bvid, page);

  const handlePress = () => {
    if (isActiveTrack) {
      // v2 行为：点击正在播放的曲目切换播放/暂停，而不是重新请求播放
      void Player.toggle();
      return;
    }
    onRequestPlay?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`第 ${page} 个分 P，${title}`}
      onLongPress={onLongPress}
      onPress={handlePress}
      style={({ pressed }) => ({ ...styles.row, opacity: pressed ? 0.7 : 1 })}
    >
      <View
        alignItems="center"
        backgroundColor={isActiveTrack ? "$accentSolid" : "$primarySolid"}
        borderRadius="$1.5"
        height={22}
        justifyContent="center"
        minWidth={22}
        paddingHorizontal="$2"
      >
        <Text color={isActiveTrack ? "$accentOnSolid" : "$primaryOnSolid"} size="sm">
          {page}
        </Text>
      </View>
      <View flex={1} gap="$1" minWidth={0}>
        <Text color={isActiveTrack ? "$accentText" : "$text"} semiBold={isActiveTrack} size="sm" truncated>
          {title}
        </Text>
        <View alignItems="center" flexDirection="row" gap="$1">
          {cached ? <Icon color={theme.textMuted.get()} name="ion:checkmark-circle" size={16} /> : null}
          <Text color="$textMuted" size="sm">
            {formatSecond(duration)}
          </Text>
        </View>
      </View>
      {isActiveTrack ? <PlayingIndicator /> : null}
    </Pressable>
  );
}

/**
 * 当前播放状态图标：占位音频（尚未替换成真实地址）与缓冲中都显示转圈，
 * 避免在音频就绪前误显示暂停键。
 */
function PlayingIndicator() {
  const activeTrack = useCurrentTrack();
  const playbackState = usePlaybackState();
  const isPlaying = useIsPlaying();
  const theme = useTheme();
  const accentColor = theme.accentSolid.get();

  const isPlaceholderTrack = activeTrack?.uri === PLACEHOLDER_AUDIO;

  if (playbackState === "STATE_BUFFERING" || isPlaceholderTrack) {
    return (
      <View alignItems="center" justifyContent="center" width={32}>
        <ActivityIndicator color={accentColor} />
      </View>
    );
  }

  return (
    <View alignItems="center" justifyContent="center" width={32}>
      <Icon color={accentColor} name={isPlaying ? "fa6-solid:pause" : "fa6-solid:play"} size={isPlaying ? 24 : 20} />
    </View>
  );
}

const styles = {
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    height: 64,
    minWidth: 0,
    paddingHorizontal: 16,
  },
};
