import { styled, View } from "@tamagui/core";

/**
 * Gap scale ported from apps/mobile Gluestack HStack/VStack.
 *
 * The legacy Tailwind `gap-N` utilities (4px per step) map 1:1 onto the
 * Bilisound space tokens. The variant is inlined into each styled call below
 * because Tamagui's `styled` variant extraction requires a literal object at
 * the variant key; referencing an external const drops the variant silently.
 */
export const stackSpaceGap = {
  xs: "$1",
  sm: "$2",
  md: "$3",
  lg: "$4",
  xl: "$5",
  "2xl": "$6",
  "3xl": "$7",
  "4xl": "$8",
} as const;

export const HStackFrame = styled(View, {
  name: "BilisoundHStackFrame",
  flexDirection: "row",
  variants: {
    // Variant is named `spacing` rather than `space` to avoid clashing with
    // Tamagui's built-in (deprecated) `space` prop, which inserts spacer
    // children instead of setting `gap`. The public component prop stays
    // `space` to match the Gluestack API.
    spacing: {
      xs: { gap: "$1" },
      sm: { gap: "$2" },
      md: { gap: "$3" },
      lg: { gap: "$4" },
      xl: { gap: "$5" },
      "2xl": { gap: "$6" },
      "3xl": { gap: "$7" },
      "4xl": { gap: "$8" },
    },
    reversed: {
      true: {
        flexDirection: "row-reverse",
      },
    },
  } as const,
});

export const VStackFrame = styled(View, {
  name: "BilisoundVStackFrame",
  flexDirection: "column",
  variants: {
    spacing: {
      xs: { gap: "$1" },
      sm: { gap: "$2" },
      md: { gap: "$3" },
      lg: { gap: "$4" },
      xl: { gap: "$5" },
      "2xl": { gap: "$6" },
      "3xl": { gap: "$7" },
      "4xl": { gap: "$8" },
    },
    reversed: {
      true: {
        flexDirection: "column-reverse",
      },
    },
  } as const,
});
