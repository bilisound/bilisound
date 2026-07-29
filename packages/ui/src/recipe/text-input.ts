import { Platform } from "react-native";
import { styled } from "@tamagui/core";
import { Input as TamaguiInput } from "@tamagui/input";

/**
 * Headless Input sets unstyled=true → borderWidth:0 + transparent bg.
 * Visual geometry lives in fieldSize so it wins after that reset.
 */
export const fieldChrome = {
  borderWidth: 1,
  borderColor: "$border",
  borderRadius: 6,
  backgroundColor: "$surface",
  color: "$text",
  fontFamily: "$body",
  fontWeight: "400",
  outlineWidth: 0,
  hoverStyle: {
    borderColor: "$borderHover",
  },
  focusStyle: {
    borderColor: "$focusRing",
  },
  focusVisibleStyle: {
    borderColor: "$focusRing",
    outlineColor: "$focusRing",
    outlineStyle: "solid" as const,
    outlineWidth: 2,
    outlineOffset: -1,
  },
} as const;

export const TextInputFrame = styled(TamaguiInput, {
  name: "BilisoundTextInputFrame",
  minWidth: 0,
  width: "100%",
  // Native EditText padding clips compact fields after the shared Android theme is applied.
  ...(Platform.OS === "android" ? { paddingVertical: 0 } : {}),
  variants: {
    fieldSize: {
      sm: {
        ...fieldChrome,
        height: 32,
        paddingHorizontal: 12,
        fontSize: "$sm",
        lineHeight: "$sm",
      },
      md: {
        ...fieldChrome,
        height: 36,
        paddingHorizontal: 14,
        fontSize: "$sm",
        lineHeight: "$sm",
      },
      lg: {
        ...fieldChrome,
        height: 40,
        paddingHorizontal: 16,
        fontSize: "$base",
        lineHeight: "$base",
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
        color: "$textDisabled",
        cursor: "not-allowed",
        opacity: 0.55,
      },
    },
  } as const,
  defaultVariants: {
    fieldSize: "md",
  },
});

export const TextAreaFrame = styled(TamaguiInput, {
  name: "BilisoundTextAreaFrame",
  minWidth: 0,
  width: "100%",
  height: "auto",
  // web multiline tag; native still uses TextInput via Input impl
  render: "textarea",
  textAlignVertical: "top",
  variants: {
    fieldSize: {
      sm: {
        ...fieldChrome,
        minHeight: 64,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: "$sm",
        lineHeight: "$sm",
      },
      md: {
        ...fieldChrome,
        minHeight: 76,
        paddingHorizontal: 14,
        paddingVertical: 8,
        fontSize: "$sm",
        lineHeight: "$sm",
      },
      lg: {
        ...fieldChrome,
        minHeight: 96,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: "$base",
        lineHeight: "$base",
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
        color: "$textDisabled",
        cursor: "not-allowed",
        opacity: 0.55,
      },
    },
  } as const,
  defaultVariants: {
    fieldSize: "md",
  },
});
