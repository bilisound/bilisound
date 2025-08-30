import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import React, { useEffect, useState } from "react";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { seek, useCurrentTrack } from "@bilisound/player";
import { useProgressSecond } from "~/hooks/useProgressSecond";
import { isLoading } from "~/components/main-bottom-sheet/utils";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeViewGestureHandler } from "react-native-gesture-handler";
import { Slider } from "@miblanchard/react-native-slider";

export function PlayerProgressBar() {
  const { colorValue } = useRawThemeValues();

  const [value, setValue] = useState(0);
  const [holding, setHolding] = useState(false);

  // 进度提示
  const [glowTotalWidth, setGlowTotalWidth] = useState(0);
  const glowWidth = glowTotalWidth * 1.5;
  const glowPosition = useSharedValue<number>(0);

  useEffect(() => {
    glowPosition.value = withRepeat(
      withTiming(glowTotalWidth + glowWidth, { duration: 1000 }),
      -1,
      false,
      () => {},
      ReduceMotion.System,
    );
  }, [glowPosition, glowTotalWidth, glowWidth]);

  // 播放状态
  const activeTrack = useCurrentTrack();
  const { position, buffered, duration } = useProgressSecond();

  useEffect(() => {
    if (!holding) {
      setValue(position);
    }
  }, [holding, position]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glowPosition.value - glowWidth }],
  }));

  if (isLoading(activeTrack, duration)) {
    return (
      <View
        onLayout={e => setGlowTotalWidth(e.nativeEvent.layout.width - 20)}
        className="h-4 justify-center flex-1 relative px-2"
      >
        <View className="h-[0.1875rem] rounded-full overflow-hidden bg-primary-100 dark:bg-primary-100">
          <Animated.View style={[{ width: glowWidth, height: 3 }, animatedStyle]}>
            <LinearGradient
              colors={[
                colorValue("--color-primary-100"),
                colorValue("--color-primary-400"),
                colorValue("--color-primary-100"),
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full"
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <NativeViewGestureHandler disallowInterruption={true}>
      <View className="h-4 justify-center flex-1 relative">
        <View className="left-[8px] right-[8px] top-[6.5px] h-[0.1875rem] rounded-full absolute overflow-hidden bg-background-50">
          <View
            style={{
              width: activeTrack?.extendedData?.isLoaded ? "100%" : `${(buffered / duration) * 100}%`,
            }}
            className="h-full absolute bg-background-200"
          />
          <View style={{ width: `${(value / duration) * 100}%` }} className="h-full absolute bg-primary-500" />
        </View>
        <View className="absolute px-2 w-full">
          <Slider
            value={value}
            onValueChange={([v]) => setValue(v)}
            onSlidingStart={() => {
              setValue(position);
              setHolding(true);
            }}
            onSlidingComplete={async val => {
              await seek(val[0]);
              setHolding(false);
            }}
            minimumValue={0}
            maximumValue={duration}
            containerStyle={{ width: "100%" }}
            trackStyle={{
              backgroundColor: "transparent",
            }}
            minimumTrackStyle={{
              backgroundColor: "transparent",
            }}
            renderThumbComponent={() => <View className="w-4 h-4 bg-primary-500 rounded-full" />}
          />
        </View>
      </View>
    </NativeViewGestureHandler>
  );
}
