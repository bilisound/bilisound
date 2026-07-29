import { Button as TamaguiButton } from "@tamagui/button";
import { styled, Text, View } from "@tamagui/core";
import { Popover } from "@tamagui/popover";

import { fieldChrome } from "./text-input";

export const DropdownSelectRootFrame = styled(View, {
  name: "BilisoundDropdownSelectRootFrame",
  minWidth: 0,
  width: "100%",
});

export const DropdownSelectTriggerFrame = styled(TamaguiButton, {
  name: "BilisoundDropdownSelectTriggerFrame",
  minWidth: 0,
  width: "100%",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "$2",
  cursor: "pointer",
  variants: {
    fieldSize: {
      sm: {
        ...fieldChrome,
        height: 32,
        paddingInlineStart: 12,
        paddingInlineEnd: 8,
      },
      md: {
        ...fieldChrome,
        height: 36,
        paddingInlineStart: 14,
        paddingInlineEnd: 8,
      },
      lg: {
        ...fieldChrome,
        height: 40,
        paddingInlineStart: 16,
        paddingInlineEnd: 8,
      },
    },
    validation: {
      invalid: {
        borderColor: "$danger",
        hoverStyle: {
          borderColor: "$danger",
        },
        focusStyle: {
          borderColor: "$danger",
        },
        focusVisibleStyle: {
          borderColor: "$danger",
          outlineColor: "$danger",
        },
      },
    },
    visuallyDisabled: {
      true: {
        cursor: "not-allowed",
        opacity: 0.55,
      },
    },
    opened: {
      true: {
        borderColor: "$focusRing",
      },
    },
  } as const,
  defaultVariants: {
    fieldSize: "md",
  },
});

export const DropdownSelectValueText = styled(Text, {
  name: "BilisoundDropdownSelectValueText",
  minWidth: 0,
  flex: 1,
  color: "$text",
  fontFamily: "$body",
  fontWeight: "400",
  textAlign: "left",
  numberOfLines: 1,
  userSelect: "none",
  variants: {
    fieldSize: {
      sm: {
        fontSize: "$sm",
        lineHeight: "$sm",
      },
      md: {
        fontSize: "$sm",
        lineHeight: "$sm",
      },
      lg: {
        fontSize: "$base",
        lineHeight: "$base",
      },
    },
    placeholder: {
      true: {
        color: "$placeholder",
      },
    },
    visuallyDisabled: {
      true: {
        color: "$textDisabled",
      },
    },
  } as const,
  defaultVariants: {
    fieldSize: "md",
  },
});

export const DropdownSelectChevronSlot = styled(View, {
  name: "BilisoundDropdownSelectChevronSlot",
  width: "$5",
  height: "$5",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
});

export const DropdownSelectContentFrame = styled(Popover.Content, {
  name: "BilisoundDropdownSelectContentFrame",
  minWidth: 240,
  maxWidth: 360,
  maxHeight: 320,
  padding: "$1",
  overflow: "hidden",
  backgroundColor: "$surface",
  borderWidth: 1,
  borderColor: "$border",
  borderRadius: 6,
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
});

export const DropdownSelectOptionsFrame = styled(Popover.ScrollView, {
  name: "BilisoundDropdownSelectOptionsFrame",
  width: "100%",
  maxHeight: 310,
});

export const DropdownSelectOptionFrame = styled(TamaguiButton, {
  name: "BilisoundDropdownSelectOptionFrame",
  width: "100%",
  minHeight: 36,
  height: "auto",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "$2",
  paddingHorizontal: 10,
  paddingVertical: "$2",
  borderWidth: 0,
  borderRadius: "$1",
  backgroundColor: "transparent",
  cursor: "pointer",
  hoverStyle: {
    backgroundColor: "$surfaceMuted",
  },
  pressStyle: {
    backgroundColor: "$surfaceMuted",
    opacity: 0.8,
  },
  focusVisibleStyle: {
    backgroundColor: "$surfaceMuted",
    outlineColor: "$focusRing",
    outlineStyle: "solid",
    outlineWidth: 2,
    outlineOffset: -2,
  },
  variants: {
    selected: {
      true: {
        backgroundColor: "$surfaceMuted",
      },
    },
    visuallyDisabled: {
      true: {
        cursor: "not-allowed",
        opacity: 0.45,
      },
    },
  } as const,
});

export const DropdownSelectOptionText = styled(Text, {
  name: "BilisoundDropdownSelectOptionText",
  minWidth: 0,
  flex: 1,
  color: "$text",
  fontFamily: "$body",
  fontSize: "$sm",
  lineHeight: "$sm",
  textAlign: "left",
  fontWeight: "400",
  userSelect: "none",
});

export const DropdownSelectOptionIndicator = styled(View, {
  name: "BilisoundDropdownSelectOptionIndicator",
  width: "$5",
  height: "$5",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
});
