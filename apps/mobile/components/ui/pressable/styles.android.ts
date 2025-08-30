import { tva } from "@gluestack-ui/nativewind-utils/tva";

export const pressableStyle = tva({
  base: "data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-indicator-info data-[focus-visible=true]:ring-2 data-[disabled=true]:opacity-40",
  variants: {
    androidRipple: {
      true: "{}-[android_ripple.color]/color:color-background-100",
      false: "",
    },
  },
});
