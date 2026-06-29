"use client";
import React from "react";
import { createPressable } from "@gluestack-ui/core/pressable/creator";
import { Pressable as RNPressable, Platform } from "react-native";

import { withStyleContext } from "@gluestack-ui/utils/nativewind-utils";
import { withStyleContextAndStates } from "~/components/ui/utils/with-style-context-and-states";
import { cssInterop } from "nativewind";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { pressableStyle } from "./styles";
import { createAndroidRipple } from "~/components/ui/android-ripple";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";

const UIPressable = createPressable({
  Root: Platform.OS === "web" ? withStyleContext(RNPressable) : withStyleContextAndStates(RNPressable),
});

cssInterop(UIPressable, { className: "style" });

type IPressableProps = Omit<React.ComponentProps<typeof UIPressable>, "context"> & VariantProps<typeof pressableStyle>;
const Pressable = React.forwardRef<React.ElementRef<typeof UIPressable>, IPressableProps>(
  ({ className, androidRipple = true, android_ripple, ...props }, ref) => {
    const { colorValue } = useRawThemeValues();

    return (
      <UIPressable
        {...props}
        ref={ref}
        android_ripple={android_ripple ?? (androidRipple ? createAndroidRipple(colorValue) : undefined)}
        className={pressableStyle({
          class: className,
          androidRipple,
        })}
      />
    );
  },
);

Pressable.displayName = "Pressable";
export { Pressable };
