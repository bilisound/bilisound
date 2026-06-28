import React from "react";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { vstackStyle } from "./styles";

type IVStackProps = Omit<React.ComponentProps<"div">, "style"> &
  VariantProps<typeof vstackStyle> & {
    style?: StyleProp<ViewStyle>;
  };

const VStack = React.forwardRef<React.ComponentRef<"div">, IVStackProps>(
  ({ className, space, reversed, style, ...props }, ref) => {
    return (
      <div
        className={vstackStyle({ space, reversed, class: className })}
        style={StyleSheet.flatten(style) as React.CSSProperties | undefined}
        {...props}
        ref={ref}
      />
    );
  },
);

VStack.displayName = "VStack";

export { VStack };
