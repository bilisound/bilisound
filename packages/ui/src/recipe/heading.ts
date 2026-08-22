import { styled, Text } from "@tamagui/core";

import { textVariants } from "./text";

/**
 * Heading recipe ported from apps/mobile Gluestack Heading.
 *
 * The legacy component rendered H1-H6 semantic tags from `size`:
 *
 * ```txt
 * 5xl/4xl/3xl -> H1   2xl -> H2   xl -> H3   lg -> H4 (default)   sm/xs -> H6
 * ```
 *
 * `render: "h1"` is the same mechanism Tamagui's own TextArea uses to swap the
 * DOM tag on web; on native it falls back to RN Text, so accessibility roles
 * are applied in the component instead.
 */
export const headingRenderTags = {
  "6xl": "h1",
  "5xl": "h1",
  "4xl": "h1",
  "3xl": "h1",
  "2xl": "h2",
  xl: "h3",
  lg: "h4",
  md: "h5",
  sm: "h6",
  xs: "h6",
  "2xs": "h6",
} as const;

export const HeadingFrame = styled(Text, {
  name: "BilisoundHeadingFrame",
  render: "h4",
  fontFamily: "$body",
  color: "$text",
  fontWeight: "700",
  letterSpacing: "$sm",
  variants: {
    ...textVariants,
    truncated: {
      true: {
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        numberOfLines: 1,
      },
    },
    selectable: {
      false: {
        userSelect: "none",
      },
      true: {
        userSelect: "auto",
      },
    },
  } as const,
  defaultVariants: {
    size: "lg",
  },
});
