import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import {
  getRepeatMode,
  next,
  prev,
  RepeatMode,
  setRepeatMode,
  toggle,
  useCurrentTrack,
  useIsPlaying,
} from "@bilisound/player";
import { useRepeatMode } from "@bilisound/player/build/hooks/useRepeatMode";
import { useQueuePlayingMode } from "~/storage/queue";
import { usePlaylistRestoreLoopOnceFlag } from "~/storage/playlist";
import React, { useState } from "react";
import { isLoading } from "~/components/main-bottom-sheet/utils";
import { useProgressSecond } from "~/hooks/useProgressSecond";
import Toast from "react-native-toast-message";
import { DEBUG_COLOR, REPEAT_MODE } from "~/components/main-bottom-sheet/constants";
import { setMode } from "~/business/playlist/shuffle";
import { View } from "react-native";
import { Button, ButtonOuter } from "~/components/ui/button";
import { Monicon } from "@monicon/native";
import { PlayButtonIcon } from "./play-button-icon";

export function PlayerControlButtons() {
  const { colorValue } = useRawThemeValues();
  const isPlaying = useIsPlaying();
  const repeatModeRaw = useRepeatMode();
  const [queuePlayingMode] = useQueuePlayingMode();
  const [restoreLoopOnceFlag] = usePlaylistRestoreLoopOnceFlag();
  const repeatMode = restoreLoopOnceFlag ? RepeatMode.ONE : repeatModeRaw;

  const [layoutWidth, setLayoutWidth] = useState(384);
  const isNarrow = layoutWidth < 384;

  const iconSize = isNarrow ? 24 : 28;
  const iconJumpSize = isNarrow ? 38 : 44;
  const iconToolSize = 24;

  const buttonSize = isNarrow ? "w-14 h-14" : "w-16 h-16";
  const buttonToolSize = "w-12 h-12";

  const loading = isLoading(useCurrentTrack(), useProgressSecond().duration);
  const buttonDisabled = restoreLoopOnceFlag || loading;

  async function handleChangeRepeatMode() {
    switch (repeatMode) {
      case RepeatMode.OFF:
        await setRepeatMode(RepeatMode.ONE);
        break;
      case RepeatMode.ONE:
        await setRepeatMode(RepeatMode.ALL);
        break;
      case RepeatMode.ALL:
        await setRepeatMode(RepeatMode.OFF);
        break;
    }
    Toast.show({
      type: "info",
      text1: REPEAT_MODE[await getRepeatMode()].toastText,
    });
  }

  async function handleChangeShuffle() {
    const result = await setMode();
    if (result === "normal") {
      Toast.show({
        type: "info",
        text1: "随机模式关闭",
      });
    } else {
      Toast.show({
        type: "info",
        text1: "随机模式开启",
      });
    }
  }

  return (
    <View
      className={`flex-row justify-between items-center pt-2 pb-8 px-4 md:pb-0 ` + DEBUG_COLOR[1]}
      onLayout={e => setLayoutWidth(e.nativeEvent.layout.width)}
    >
      {/* 左侧按钮（循环模式） */}
      <ButtonOuter className={`rounded-full ${buttonToolSize}`}>
        <Button
          aria-label={REPEAT_MODE[repeatMode].name}
          className={`rounded-full ${buttonToolSize}`}
          onPress={() => handleChangeRepeatMode()}
          variant={"ghost"}
          disabled={buttonDisabled}
        >
          <View className={"size-[44px] items-center justify-center"}>
            <Monicon
              name={REPEAT_MODE[repeatMode].icon}
              size={iconToolSize}
              color={colorValue("--color-primary-500")}
            />
          </View>
        </Button>
      </ButtonOuter>

      {/* 中间按钮（播放控制） */}
      <View className={`flex-row justify-center ${isNarrow ? "gap-3" : "gap-4"} ` + DEBUG_COLOR[1]}>
        <ButtonOuter className={`rounded-full ${buttonSize}`}>
          <Button
            aria-label={"上一首"}
            className={`rounded-full ${buttonSize}`}
            onPress={() => prev()}
            variant={"ghost"}
          >
            <View className={"size-[44px] items-center justify-center"}>
              <Monicon name={"ri:skip-back-mini-fill"} size={iconJumpSize} color={colorValue("--color-primary-500")} />
            </View>
          </Button>
        </ButtonOuter>
        <ButtonOuter className={`rounded-full ${buttonSize}`}>
          <Button
            disabled={buttonDisabled}
            aria-label={isPlaying ? "暂停" : "播放"}
            className={"rounded-full " + buttonSize}
            onPress={() => toggle()}
          >
            <PlayButtonIcon size={iconSize} />
          </Button>
        </ButtonOuter>
        <ButtonOuter className={`rounded-full ${buttonSize}`}>
          <Button
            aria-label={"下一首"}
            className={`rounded-full ${buttonSize}`}
            onPress={() => next()}
            variant={"ghost"}
          >
            <View className={"size-[44px] items-center justify-center rotate-180"}>
              <Monicon name={"ri:skip-back-mini-fill"} size={iconJumpSize} color={colorValue("--color-primary-500")} />
            </View>
          </Button>
        </ButtonOuter>
      </View>

      {/* 右侧按钮（随机模式） */}
      <ButtonOuter className={`rounded-full ${buttonToolSize}`}>
        <Button
          aria-label={"循环模式"}
          className={`rounded-full ${buttonToolSize}`}
          onPress={() => handleChangeShuffle()}
          variant={"ghost"}
          disabled={buttonDisabled}
        >
          <View className={"size-[44px] items-center justify-center"}>
            <Monicon
              name={queuePlayingMode === "shuffle" ? "tabler:arrows-shuffle" : "tabler:arrows-right"}
              size={iconToolSize}
              color={colorValue("--color-primary-500")}
            />
          </View>
        </Button>
      </ButtonOuter>
    </View>
  );
}
