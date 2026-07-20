import { Button as TamaguiButton } from "@tamagui/button";
import { styled } from "@tamagui/core";

export const ButtonFrame = styled(TamaguiButton, {
  name: "BilisoundButtonFrame",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  borderWidth: 1,
  borderRadius: "$2",
  cursor: "pointer",
  focusVisibleStyle: {
    outlineColor: "$focusRing",
    outlineStyle: "solid",
    outlineWidth: 3,
  },
  variants: {
    tone: {
      primary: {
        backgroundColor: "$primaryBackground",
        borderColor: "$primaryBorder",
        hoverStyle: {
          backgroundColor: "$primaryBackgroundHover",
          borderColor: "$primaryBorderHover",
        },
        pressStyle: {
          backgroundColor: "$primaryBackgroundPress",
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
    },
    controlSize: {
      sm: {
        minHeight: "$8",
        paddingHorizontal: "$3",
      },
      md: {
        minHeight: "$10",
        paddingHorizontal: "$4",
      },
      lg: {
        minHeight: "$12",
        paddingHorizontal: "$5",
      },
    },
    visuallyDisabled: {
      true: {
        cursor: "not-allowed",
        opacity: 0.45,
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
    },
    controlSize: {
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
    },
  } as const,
  defaultVariants: {
    tone: "primary",
    controlSize: "md",
  },
});
