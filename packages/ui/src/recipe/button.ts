import { Button as TamaguiButton } from "@tamagui/button";
import { getVariableValue, styled, useTheme } from "@tamagui/core";

export const buttonIconSize = {
  sm: 14,
  md: 16,
  lg: 18,
} as const;

export function useButtonIconColor(tone: "primary" | "secondary" | "ghost" | "link") {
  const theme = useTheme();

  switch (tone) {
    case "primary":
      return String(getVariableValue(theme.primaryForeground));
    case "secondary":
      return String(getVariableValue(theme.secondaryForeground));
    case "link":
      return String(getVariableValue(theme.primaryBackground));
    default:
      return String(getVariableValue(theme.text));
  }
}

export const ButtonFrame = styled(TamaguiButton, {
  name: "BilisoundButtonFrame",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  borderWidth: 0,
  cursor: "pointer",
  focusVisibleStyle: {
    outlineColor: "$focusRing",
    outlineStyle: "solid",
    outlineWidth: 2,
    outlineOffset: 2,
  },
  variants: {
    tone: {
      primary: {
        backgroundColor: "$primaryBackground",
        borderColor: "$primaryBackground",
        hoverStyle: {
          backgroundColor: "$primaryBackgroundHover",
          borderColor: "$primaryBackgroundHover",
        },
        pressStyle: {
          backgroundColor: "$primaryBackgroundPress",
          borderColor: "$primaryBackgroundPress",
        },
      },
      secondary: {
        backgroundColor: "$secondaryBackground",
        borderColor: "$secondaryBorder",
        hoverStyle: {
          backgroundColor: "$secondaryBackgroundHover",
          borderColor: "$secondaryBorderHover",
        },
        pressStyle: {
          backgroundColor: "$secondaryBackgroundPress",
        },
      },
      // same footprint as solid buttons; fill only appears on hover/focus/press
      ghost: {
        backgroundColor: "transparent",
        borderWidth: 0,
        borderColor: "transparent",
        hoverStyle: {
          backgroundColor: "$surfaceMuted",
        },
        pressStyle: {
          backgroundColor: "$surfaceMuted",
          opacity: 0.92,
        },
        focusVisibleStyle: {
          backgroundColor: "$surfaceMuted",
          outlineColor: "$focusRing",
          outlineStyle: "solid",
          outlineWidth: 2,
          outlineOffset: 2,
        },
      },
      // inline text action (guestbook 「回复」)
      link: {
        backgroundColor: "transparent",
        borderWidth: 0,
        borderColor: "transparent",
        alignSelf: "flex-start",
        justifyContent: "flex-start",
        paddingHorizontal: 0,
        paddingVertical: 0,
        minHeight: 0,
        height: "auto",
        hoverStyle: {
          backgroundColor: "transparent",
        },
        pressStyle: {
          backgroundColor: "transparent",
          opacity: 0.7,
        },
      },
    },
    controlSize: {
      sm: {
        borderWidth: 1,
        height: "$8",
        paddingHorizontal: "$3",
      },
      md: {
        borderWidth: 1,
        height: "$9",
        paddingHorizontal: "$4",
      },
      lg: {
        borderWidth: 1,
        height: "$10",
        paddingHorizontal: "$5",
      },
    },
    shape: {
      default: {
        borderRadius: "$1.5",
      },
      rounded: {
        borderRadius: "$full",
      },
    },
    hasIconAndLabel: {
      true: {
        gap: "$2",
      },
    },
    iconOnly: {
      true: {
        aspectRatio: 1,
        paddingHorizontal: 0,
      },
    },
    visuallyDisabled: {
      true: {
        cursor: "not-allowed",
        opacity: 0.5,
      },
    },
  } as const,
  defaultVariants: {
    tone: "primary",
    controlSize: "md",
    shape: "default",
  },
});

export const ButtonLabel = styled(TamaguiButton.Text, {
  name: "BilisoundButtonLabel",
  fontFamily: "$body",
  fontWeight: "600",
  userSelect: "none",
  variants: {
    tone: {
      primary: {
        color: "$primaryForeground",
      },
      secondary: {
        color: "$secondaryForeground",
      },
      ghost: {
        color: "$text",
      },
      link: {
        color: "$primaryBackground",
        fontWeight: "400",
        hoverStyle: {
          textDecorationLine: "underline",
        },
      },
    },
    controlSize: {
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
  } as const,
  defaultVariants: {
    tone: "primary",
    controlSize: "md",
  },
});
