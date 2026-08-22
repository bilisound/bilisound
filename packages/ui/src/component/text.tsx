import type { ReactNode, Ref } from "react";
import type { Text as ReactNativeText } from "react-native";
import type { GetProps } from "@tamagui/core";

import { TextFrame } from "../recipe";

export interface TextProps extends Omit<GetProps<typeof TextFrame>, "children" | "ref"> {
  children?: ReactNode;
  ref?: Ref<ReactNativeText>;
}

/**
 * General-purpose text primitive ported from apps/mobile Gluestack Text.
 *
 * Base color is the muted body tone (`textMuted`), matching the legacy
 * `text-typography-700` base; pass e.g. `color="$text"` for primary text,
 * the same way the original was overridden with className utilities.
 */
export function Text({ children, ref, ...props }: TextProps) {
  return (
    <TextFrame ref={ref} {...props}>
      {children}
    </TextFrame>
  );
}
