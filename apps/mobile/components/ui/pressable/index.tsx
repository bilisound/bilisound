"use client";
import React from "react";
import { createPressable } from "@gluestack-ui/core/pressable/creator";
import { Pressable as RNPressable, Platform } from "react-native";

import { withStyleContext } from "@gluestack-ui/utils/nativewind-utils";
import { withStyleContextAndStates } from "~/components/ui/utils/with-style-context-and-states";
import { cssInterop } from "nativewind";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";
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
