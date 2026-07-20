import { styled } from "@tamagui/core";
import { Slider as TamaguiSlider } from "@tamagui/slider";

export const sliderRootRecipe = {
  width: "100%",
  height: "$8",
  justifyContent: "center",
} as const;

export const SliderTrack = styled(TamaguiSlider.Track, {
  name: "BilisoundSliderTrack",
  position: "absolute",
  top: "50%",
  left: 0,
  y: -2,
  width: "100%",
  height: "$1",
  overflow: "hidden",
  borderRadius: "$full",
  backgroundColor: "$sliderTrack",
});

export const SliderRange = styled(TamaguiSlider.TrackActive, {
  name: "BilisoundSliderRange",
  height: "100%",
  borderRadius: "$full",
  backgroundColor: "$sliderRange",
});

export const SliderThumb = styled(TamaguiSlider.Thumb, {
  name: "BilisoundSliderThumb",
  position: "absolute",
  borderWidth: 2,
  borderColor: "$sliderThumbBorder",
  borderRadius: "$full",
  backgroundColor: "$sliderThumb",
  hoverStyle: {
    borderColor: "$primaryBorderHover",
  },
  pressStyle: {
    backgroundColor: "$surfaceMuted",
  },
  focusVisibleStyle: {
    outlineColor: "$focusRing",
    outlineStyle: "solid",
    outlineWidth: 3,
  },
});

export const sliderThumbSize = "$5" as const;
