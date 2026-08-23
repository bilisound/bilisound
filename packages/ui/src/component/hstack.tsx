import type { ReactNode, Ref } from "react";
import type { View as ReactNativeView } from "react-native";
import type { GetProps } from "@tamagui/core";

import { HStackFrame } from "../recipe";

export type HStackSpace = NonNullable<GetProps<typeof HStackFrame>["spacing"]>;
export interface HStackProps extends Omit<GetProps<typeof HStackFrame>, "children" | "ref" | "spacing"> {
  children?: ReactNode;
  ref?: Ref<ReactNativeView>;
  /**
   * Gap between children, ported from Gluestack's `space`. Maps the legacy
   * 4-point scale (xs-4xl) onto Bilisound space tokens; resolved as CSS `gap`
   * rather than spacer children.
   */
  space?: HStackSpace;
}

/**
 * Horizontal layout primitive ported from apps/mobile Gluestack HStack.
 *
 * `space` applies the shared 4-point gap scale; `reversed` flips the visual
 * order via `row-reverse` without reordering children in the tree.
 */
export function HStack({ children, ref, space, ...props }: HStackProps) {
  return (
    <HStackFrame ref={ref} spacing={space} {...props}>
      {children}
    </HStackFrame>
  );
}
