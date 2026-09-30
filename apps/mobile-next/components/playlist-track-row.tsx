import { Icon, Text } from "@bilisound/ui";
import { isWeb, useTheme, View } from "@tamagui/core";
import { ActivityIndicator, Pressable } from "react-native";

import { PLACEHOLDER_AUDIO } from "~/constants/playback";
import { useCacheExists } from "~/features/cache";
import type { SongListItem } from "~/features/playlist";
import * as Player from "~/features/player";
import { useCurrentTrack, useIsPlaying, usePlaybackState } from "~/features/player";
import { formatSecond } from "~/utils/datetime";

export interface PlaylistTrackRowProps {
  data: SongListItem;
  /** 显示序号，缺省时回落到曲目分 P。 */
  index?: number;
  isChecking?: boolean;
  isChecked?: boolean;
  onRequestPlay?: () => void;
  onToggle?: () => void;
  onLongPress?: () => void;
}

/**
 * 歌单曲目行，由 v2 `apps/mobile/components/song-item.tsx` 搬运。
 *
 * 行为保持一致：编辑态点击=切换勾选，点击当前曲目=播放/暂停，其余点击=请求播放，
 * 长按=进入多选（由页面提供的 onLongPress 处理）。
 */
export function PlaylistTrackRow({
  data,
  index,
  isChecking = false,
  isChecked = false,
  onRequestPlay,
  onToggle,
  onLongPress,
}: PlaylistTrackRowProps) {
  const theme = useTheme();
  const activeTrack = useCurrentTrack();
  const isActiveTrack =
    data.bvid === activeTrack?.extendedData?.id && data.episode === activeTrack?.extendedData?.episode;
  const cached = useCacheExists(data.bvid, data.episode);

  const handlePress = () => {
    if (isChecking) {
      onToggle?.();
      return;
    }
    if (isActiveTrack) {
      void Player.toggle();
      return;
    }
    onRequestPlay?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`第 ${typeof index === "number" ? index : data.episode} 首，${data.title}`}
      accessibilityHint={isChecking ? "切换选中状态" : "播放该曲目，长按进入多选"}
      // Web silently drops `accessibilityState`, and `aria-selected` is invalid on
      // a button role; the edit-mode row is a toggle button, so expose the checked
      // state as `aria-pressed`. The plain row stays a plain button (no toggle
      // semantics), while native keeps the existing selected state.
      {...(isChecking
        ? isWeb
          ? ({ "aria-pressed": isChecked } as object)
          : { accessibilityState: { selected: isChecked } }
        : null)}
      onPress={handlePress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        height: 64,
        minWidth: 0,
      })}
    >
      <View
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="$2"
        height={22}
        borderRadius="$1.5"
        backgroundColor={isActiveTrack ? "$accentSolid" : "$primarySolid"}
      >
        <Text color={isActiveTrack ? "$accentOnSolid" : "$primaryOnSolid"} size="sm">
          {typeof index === "number" ? index : data.episode}
        </Text>
      </View>

      <View flex={1} minWidth={0}>
        <Text color={isActiveTrack ? "$accentText" : "$text"} semiBold={isActiveTrack} size="sm" truncated>
          {data.title}
        </Text>
        <View flexDirection="row" alignItems="center" gap="$1" marginTop="$1">
          {cached ? <Icon name="ion:checkmark-circle" size={16} color={theme.textMuted.get()} /> : null}
          <Text color="$textMuted" size="sm">
            {formatSecond(data.duration)}
          </Text>
        </View>
      </View>

      {isChecking ? <SelectionCircle checked={isChecked} color={theme.primaryOnSolid.get()} /> : null}
      {!isChecking && isActiveTrack ? <PlayingIndicator /> : null}
    </Pressable>
  );
}

function SelectionCircle({ checked, color }: { checked: boolean; color: string }) {
  return (
    <View
      width={28}
      height={28}
      borderRadius="$full"
      borderWidth={2}
      borderColor={checked ? "$primarySolid" : "$border"}
      alignItems="center"
      justifyContent="center"
      backgroundColor={checked ? "$primarySolid" : "transparent"}
    >
      <Icon name="fa6-solid:check" size={16} color={checked ? color : "transparent"} />
    </View>
  );
}

function PlayingIndicator() {
  const activeTrack = useCurrentTrack();
  const playbackState = usePlaybackState();
  const isPlaying = useIsPlaying();
  const theme = useTheme();
  const accentColor = theme.accentSolid.get();

  // 与 v2 相同：占位音频尚未被替换时不展示播放状态，避免误显示暂停键。
  const isPlaceholderTrack = activeTrack?.uri === PLACEHOLDER_AUDIO;

  if (playbackState === "STATE_BUFFERING" || isPlaceholderTrack) {
    return (
      <View width={32} alignItems="center" justifyContent="center">
        <ActivityIndicator color={accentColor} />
      </View>
    );
  }

  return (
    <View width={32} alignItems="center" justifyContent="center">
      <Icon name={isPlaying ? "fa6-solid:pause" : "fa6-solid:play"} size={isPlaying ? 24 : 20} color={accentColor} />
    </View>
  );
}
