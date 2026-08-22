import type { ReactNode, Ref } from "react";
import type { Text as ReactNativeText } from "react-native";
import type { GetProps } from "@tamagui/core";
import { isWeb, useTheme } from "@tamagui/core";

import { headingRenderTags, HeadingFrame } from "../recipe";

export interface HeadingProps extends Omit<GetProps<typeof HeadingFrame>, "children" | "ref"> {
  children?: ReactNode;
  ref?: Ref<ReactNativeText>;
}

/**
 * Semantic heading ported from apps/mobile Gluestack Heading.
 *
 * Web renders real `h1`-`h6` tags via Tamagui's `render`, following the
 * legacy size-to-tag mapping (3xl-5xl -> h1 … sm/xs -> h6). Native has no
 * heading element, so the matching accessibility role is applied instead.
 */
export function Heading({ children, ref, size = "lg", ...props }: HeadingProps) {
  const theme = useTheme();
  const tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" = headingRenderTags[size];

  return (
    <HeadingFrame
      ref={ref}
      size={size}
      render={tag}
      {...(isWeb ? { role: undefined } : { accessibilityRole: "header" })}
      // A resolved value keeps the color reactive when the provider theme changes.
      color={theme.text.get()}
      {...props}
    >
      {children}
    </HeadingFrame>
  );
}
