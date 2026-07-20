import { styled } from "@tamagui/core";
import { Input as TamaguiInput } from "@tamagui/input";

export const TextInputFrame = styled(TamaguiInput, {
  name: "BilisoundTextInputFrame",
  minWidth: 0,
  width: "100%",
  borderWidth: 1,
  borderColor: "$border",
  borderRadius: "$2",
  backgroundColor: "$surface",
  color: "$text",
  fontFamily: "$body",
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
    outlineStyle: "solid",
    outlineWidth: 2,
  },
  variants: {
    fieldSize: {
      sm: {
        height: "$8",
        paddingHorizontal: "$3",
        fontSize: "$sm",
      },
      md: {
        height: "$10",
        paddingHorizontal: "$4",
        fontSize: "$base",
      },
      lg: {
        height: "$12",
        paddingHorizontal: "$4",
        fontSize: "$lg",
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
