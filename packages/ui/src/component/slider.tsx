import type { Ref } from "react";
import type { View } from "react-native";
import { Slider as TamaguiSlider } from "@tamagui/slider";
import type { SliderProps as TamaguiSliderProps } from "@tamagui/slider";

import { SliderRange, SliderThumb, SliderTrack, sliderRootRecipe, sliderThumbSize } from "../recipe";

export interface SliderProps extends Omit<TamaguiSliderProps, "children" | "ref" | "size"> {
  accessibilityLabel?: string;
  ref?: Ref<View>;
  thumbLabels?: readonly string[];
}

export function Slider({ accessibilityLabel, defaultValue, disabled, ref, thumbLabels, value, ...props }: SliderProps) {
  const thumbCount = Math.max(1, value?.length ?? defaultValue?.length ?? 1);

  return (
    <TamaguiSlider
      ref={ref}
      {...sliderRootRecipe}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      opacity={disabled ? 0.45 : 1}
      {...props}
    >
      <SliderTrack unstyled>
        <SliderRange unstyled />
      </SliderTrack>
      {Array.from({ length: thumbCount }, (_, index) => (
        <SliderThumb
          key={index}
          unstyled
          index={index}
          size={sliderThumbSize}
          aria-label={thumbLabels?.[index] ?? accessibilityLabel}
        />
      ))}
    </TamaguiSlider>
  );
}
