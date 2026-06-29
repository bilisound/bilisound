import { tva } from "@gluestack-ui/utils/nativewind-utils";
import { IS_ANDROID_RIPPLE_ENABLED } from "~/constants/platform";

const baseClassList = [
  !IS_ANDROID_RIPPLE_ENABLED ? "bg-transparent hover:bg-background-50 active:bg-background-100" : "",
  "data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-indicator-info data-[focus-visible=true]:ring-2 data-[disabled=true]:opacity-40",
];

export const pressableStyle = tva({
  base: baseClassList.filter(Boolean).join(" "),
  variants: {
    androidRipple: {
      true: "",
      false: "",
    },
  },
});
