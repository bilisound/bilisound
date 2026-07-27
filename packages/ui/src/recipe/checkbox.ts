import { styled, Text, View } from "@tamagui/core";

export const CheckboxRoot = styled(View, {
  name: "BilisoundCheckboxRoot",
  flexDirection: "row",
  alignItems: "center",
  cursor: "pointer",
  gap: "$2",
  focusVisibleStyle: {
    outlineColor: "$focusRing",
    outlineStyle: "solid",
    outlineWidth: 2,
    outlineOffset: 2,
  },
  variants: {
    visuallyDisabled: {
      true: {
        cursor: "not-allowed",
        opacity: 0.5,
      },
    },
  } as const,
});

export const CheckboxBox = styled(View, {
  name: "BilisoundCheckboxBox",
  width: 16,
  height: 16,
  borderWidth: 1,
  borderRadius: 3,
  borderColor: "$border",
  backgroundColor: "$surface",
  alignItems: "center",
  justifyContent: "center",
  variants: {
    checked: {
      true: {
        backgroundColor: "$primarySolid",
        borderColor: "$primarySolid",
      },
    },
  } as const,
});

export const CheckboxCheck = styled(Text, {
  name: "BilisoundCheckboxCheck",
  color: "$primaryOnSolid",
  fontSize: 12,
  lineHeight: 14,
  fontWeight: "700",
  userSelect: "none",
});

export const CheckboxLabel = styled(Text, {
  name: "BilisoundCheckboxLabel",
  fontFamily: "$body",
  fontSize: "$sm",
  lineHeight: "$sm",
  fontWeight: "500",
  color: "$text",
  userSelect: "none",
});
