import { useCurrentTrack, useIsPlaying } from "@bilisound/player";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import React, { useEffect } from "react";
import { isLoading } from "~/components/main-bottom-sheet/utils";
import { useProgressSecond } from "~/hooks/useProgressSecond";
import { ActivityIndicator, View } from "react-native";
import { Icon } from "~/components/icon";

export function PlayButtonIcon({ size = 28 }: { size?: number }) {
  const duration = 200;
  const isPlaying = useIsPlaying();
  const { colorValue } = useRawThemeValues();

  const pauseScale = useSharedValue(isPlaying ? 1 : 0);
  const pauseOpacity = useSharedValue(isPlaying ? 1 : 0);
  const playScale = useSharedValue(isPlaying ? 0 : 1);
  const playOpacity = useSharedValue(isPlaying ? 0 : 1);

  useEffect(() => {
    pauseScale.value = withTiming(isPlaying ? 1 : 0, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    pauseOpacity.value = withTiming(isPlaying ? 1 : 0, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    playScale.value = withTiming(isPlaying ? 0 : 1, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    playOpacity.value = withTiming(isPlaying ? 0 : 1, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  }, [isPlaying, pauseOpacity, pauseScale, playOpacity, playScale]);

  const pauseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pauseScale.value }],
      opacity: pauseOpacity.value,
    };
  });

  const playAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: playScale.value }],
      opacity: playOpacity.value,
    };
  });

  if (isLoading(useCurrentTrack(), useProgressSecond().duration)) {
    return <ActivityIndicator size={size} className={"size-8"} color={colorValue("--color-background-0")} />;
  }

  return (
    <View className="relative size-8">
      <Animated.View style={pauseAnimatedStyle} className="absolute size-full items-center justify-center">
        <Icon name="fa6-solid:pause" size={size / 0.875} color={colorValue("--color-background-0")} />
      </Animated.View>
      <Animated.View style={playAnimatedStyle} className="absolute size-full items-center justify-center">
        <Icon name="fa6-solid:play" size={size} color={colorValue("--color-background-0")} />
      </Animated.View>
    </View>
  );
}
