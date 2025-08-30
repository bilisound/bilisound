import { useCurrentTrack } from "@bilisound/player";
import { useProgressSecond } from "~/hooks/useProgressSecond";
import { formatSecond } from "~/utils/datetime";
import { PLACEHOLDER_AUDIO } from "~/constants/playback";
import { View } from "react-native";
import { DEBUG_COLOR } from "~/components/main-bottom-sheet/constants";
import { Text } from "~/components/ui/text";
import React from "react";

export function PlayerProgressTimer() {
  // 播放状态
  const activeTrack = useCurrentTrack();
  const { position } = useProgressSecond();

  let from = formatSecond(position);
  let to = activeTrack ? formatSecond(activeTrack.duration || 0) : "--:--";

  if (activeTrack?.uri === PLACEHOLDER_AUDIO) {
    from = "00:00";
  }

  return (
    <View className={"flex-row justify-between px-8 " + DEBUG_COLOR[1]}>
      <Text
        className={"text-sm text-typography-500 tabular-nums"}
        style={{
          fontFamily: "Roboto_400Regular",
        }}
      >
        {from}
      </Text>
      <Text
        className={"text-sm text-typography-500 tabular-nums"}
        style={{
          fontFamily: "Roboto_400Regular",
        }}
      >
        {to}
      </Text>
    </View>
  );
}
