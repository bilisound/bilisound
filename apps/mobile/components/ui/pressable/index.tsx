"use client";
import React from "react";
import { createPressable } from "@gluestack-ui/pressable";
import { Pressable as RNPressable, Platform } from "react-native";

import { withStyleContext } from "@gluestack-ui/nativewind-utils/withStyleContext";
import { withStyleContextAndStates } from "@gluestack-ui/nativewind-utils/withStyleContextAndStates";
import { cssInterop } from "nativewind";
import type { VariantProps } from "@gluestack-ui/nativewind-utils";
import { pressableStyle } from "./styles";

const UIPressable = createPressable({
  Root: Platform.OS === "web" ? withStyleContext(RNPressable) : withStyleContextAndStates(RNPressable),
});

cssInterop(UIPressable, { className: "style" });

type IPressableProps = Omit<React.ComponentProps<typeof UIPressable>, "context"> & VariantProps<typeof pressableStyle>;
const Pressable = React.forwardRef<React.ElementRef<typeof UIPressable>, IPressableProps>(
  ({ className, androidRipple = true, ...props }, ref) => {
    return (
      <UIPressable
        {...props}
        ref={ref}
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
