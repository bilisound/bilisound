import type { ReactNode, Ref } from "react";
import type { View as ReactNativeView } from "react-native";
import type { GetProps } from "@tamagui/core";

import { VStackFrame } from "../recipe";

export type VStackSpace = NonNullable<GetProps<typeof VStackFrame>["spacing"]>;
export interface VStackProps extends Omit<GetProps<typeof VStackFrame>, "children" | "ref" | "spacing"> {
  children?: ReactNode;
  ref?: Ref<ReactNativeView>;
  /**
   * Gap between children, ported from Gluestack's `space`. Maps the legacy
   * 4-point scale (xs-4xl) onto Bilisound space tokens; resolved as CSS `gap`
   * rather than spacer children.
   */
  space?: VStackSpace;
}

/**
 * Vertical layout primitive ported from apps/mobile Gluestack VStack.
 *
 * `space` applies the shared 4-point gap scale; `reversed` flips the visual
 * order via `column-reverse` without reordering children in the tree.
 */
export function VStack({ children, ref, space, ...props }: VStackProps) {
  return (
    <VStackFrame ref={ref} spacing={space} {...props}>
      {children}
    </VStackFrame>
  );
}
