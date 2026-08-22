import { styled, Text } from "@tamagui/core";

/**
 * Shared typography variants ported from apps/mobile Gluestack Text/Heading.
 *
 * `size` maps to the font token scale; Heading additionally shifts the tag
 * (H1-H6) via `render`, mirroring the legacy size-to-tag table.
 */
export const textVariants = {
  size: {
    "2xs": {
      fontSize: "$2xs",
      lineHeight: "$2xs",
    },
    xs: {
      fontSize: "$xs",
      lineHeight: "$xs",
    },
    sm: {
      fontSize: "$sm",
      lineHeight: "$sm",
    },
    md: {
      fontSize: "$base",
      lineHeight: "$base",
    },
    lg: {
      fontSize: "$lg",
      lineHeight: "$lg",
    },
    xl: {
      fontSize: "$xl",
      lineHeight: "$xl",
    },
    "2xl": {
      fontSize: "$2xl",
      lineHeight: "$2xl",
    },
    "3xl": {
      fontSize: "$3xl",
      lineHeight: "$3xl",
    },
    "4xl": {
      fontSize: "$4xl",
      lineHeight: "$4xl",
    },
    "5xl": {
      fontSize: "$5xl",
      lineHeight: "$5xl",
    },
    "6xl": {
      fontSize: "$6xl",
      lineHeight: "$6xl",
    },
  },
  bold: {
    true: {
      fontWeight: "700",
    },
  },
  semiBold: {
    true: {
      fontWeight: "600",
    },
  },
  italic: {
    true: {
      fontStyle: "italic",
    },
  },
  underline: {
    true: {
      textDecorationLine: "underline",
    },
  },
  strikeThrough: {
    true: {
      textDecorationLine: "line-through",
    },
  },
  highlight: {
    true: {
      // Legacy highlight used bg-yellow-500; mapped onto the accent scale so it
      // follows the active semantic theme instead of a fixed color.
      backgroundColor: "$accentTintHover",
      color: "$black",
    },
  },
} as const;

export const textTruncateStyle = {
  maxWidth: "100%",
  overflow: "hidden",
} as const;

export const TextFrame = styled(Text, {
  name: "BilisoundTextFrame",
  fontFamily: "$body",
  // Legacy base was text-typography-700; textMuted is its semantic equivalent.
  color: "$textMuted",
  ...textTruncateStyle,
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
    size: "md",
  },
});
