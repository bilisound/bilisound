import { Button as TamaguiButton } from "@tamagui/button";
import { styled } from "@tamagui/core";

export const ButtonFrame = styled(TamaguiButton, {
  name: "BilisoundButtonFrame",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  borderWidth: 0,
  borderRadius: 6,
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
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
        shadowOpacity: 0,
        elevation: 0,
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
        shadowOpacity: 0,
        elevation: 0,
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
        shadowOpacity: 0,
        elevation: 0,
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
        height: 32,
        paddingHorizontal: 12,
      },
      md: {
        borderWidth: 1,
        height: 36,
        paddingHorizontal: 16,
      },
      lg: {
        borderWidth: 1,
        height: 40,
        paddingHorizontal: 20,
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
