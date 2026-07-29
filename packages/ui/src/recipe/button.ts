import { Button as TamaguiButton } from "@tamagui/button";
import { getVariableValue, styled, useTheme } from "@tamagui/core";

export const buttonIconSize = {
  sm: 14,
  md: 16,
  lg: 18,
} as const;

export type ButtonColor = "primary" | "accent" | "neutral" | "positive" | "negative";
export type ButtonVariant = "solid" | "outline" | "ghost" | "link";

interface ButtonColorScheme {
  solid: string;
  solidHover: string;
  solidPress: string;
  onSolid: string;
  text: string;
  outline: string;
  outlineHover: string;
  tintHover: string;
  tintPress: string;
}

const buttonColorSchemes = {
  primary: {
    solid: "$primarySolid",
    solidHover: "$primarySolidHover",
    solidPress: "$primarySolidPress",
    onSolid: "$primaryOnSolid",
    text: "$primaryText",
    outline: "$primaryOutline",
    outlineHover: "$primaryOutlineHover",
    tintHover: "$primaryTintHover",
    tintPress: "$primaryTintPress",
  },
  accent: {
    solid: "$accentSolid",
    solidHover: "$accentSolidHover",
    solidPress: "$accentSolidPress",
    onSolid: "$accentOnSolid",
    text: "$accentText",
    outline: "$accentOutline",
    outlineHover: "$accentOutlineHover",
    tintHover: "$accentTintHover",
    tintPress: "$accentTintPress",
  },
  neutral: {
    solid: "$neutralSolid",
    solidHover: "$neutralSolidHover",
    solidPress: "$neutralSolidPress",
    onSolid: "$neutralOnSolid",
    text: "$neutralText",
    outline: "$neutralOutline",
    outlineHover: "$neutralOutlineHover",
    tintHover: "$neutralTintHover",
    tintPress: "$neutralTintPress",
  },
  positive: {
    solid: "$positiveSolid",
    solidHover: "$positiveSolidHover",
    solidPress: "$positiveSolidPress",
    onSolid: "$positiveOnSolid",
    text: "$positiveText",
    outline: "$positiveOutline",
    outlineHover: "$positiveOutlineHover",
    tintHover: "$positiveTintHover",
    tintPress: "$positiveTintPress",
  },
  negative: {
    solid: "$negativeSolid",
    solidHover: "$negativeSolidHover",
    solidPress: "$negativeSolidPress",
    onSolid: "$negativeOnSolid",
    text: "$negativeText",
    outline: "$negativeOutline",
    outlineHover: "$negativeOutlineHover",
    tintHover: "$negativeTintHover",
    tintPress: "$negativeTintPress",
  },
} as const satisfies Record<ButtonColor, ButtonColorScheme>;

export function getButtonColorScheme(color: ButtonColor): ButtonColorScheme {
  return buttonColorSchemes[color];
}

export function useButtonIconColor(color: ButtonColor, variant: ButtonVariant) {
  const theme = useTheme();
  const scheme = getButtonColorScheme(color);
  const tokenRef = variant === "solid" ? scheme.onSolid : variant === "link" ? scheme.solid : scheme.text;
  return String(getVariableValue(theme[tokenRef.slice(1) as keyof typeof theme]));
}

/**
 * Frame styles per variant. Spread onto ButtonFrame *before* controlSize so the
 * size variant keeps winning shared keys (padding/height/borderWidth) for
 * icon-only link buttons, matching the previous tone-based recipes.
 */
export function getButtonFrameStyles(variant: ButtonVariant, scheme: ButtonColorScheme) {
  switch (variant) {
    case "outline":
      return {
        backgroundColor: "transparent",
        borderColor: scheme.outline,
        hoverStyle: {
          backgroundColor: scheme.tintHover,
          borderColor: scheme.outlineHover,
        },
        pressStyle: {
          backgroundColor: scheme.tintPress,
        },
      } as const;
    case "ghost":
      return {
        backgroundColor: "transparent",
        borderColor: "transparent",
        hoverStyle: {
          backgroundColor: scheme.tintHover,
        },
        pressStyle: {
          backgroundColor: scheme.tintPress,
          opacity: 0.92,
        },
        focusVisibleStyle: {
          backgroundColor: scheme.tintHover,
          outlineColor: "$focusRing",
          outlineStyle: "solid",
          outlineWidth: 2,
          outlineOffset: 2,
        },
      } as const;
    case "link":
      return {
        backgroundColor: "transparent",
        borderColor: "transparent",
        borderWidth: 0,
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
      } as const;
    default:
      return {
        backgroundColor: scheme.solid,
        borderColor: scheme.solid,
        hoverStyle: {
          backgroundColor: scheme.solidHover,
          borderColor: scheme.solidHover,
        },
        pressStyle: {
          backgroundColor: scheme.solidPress,
          borderColor: scheme.solidPress,
        },
      } as const;
  }
}

export function getButtonLabelStyles(variant: ButtonVariant, scheme: ButtonColorScheme) {
  if (variant === "link") {
    return {
      color: scheme.solid,
      fontWeight: "400",
      hoverStyle: {
        textDecorationLine: "underline",
      },
    } as const;
  }

  return {
    color: variant === "solid" ? scheme.onSolid : scheme.text,
  };
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
    controlSize: "md",
  },
});
