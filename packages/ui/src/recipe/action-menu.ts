import { Button as TamaguiButton } from "@tamagui/button";
import { styled, Text, View } from "@tamagui/core";
import { Sheet } from "@tamagui/sheet";

export const ActionMenuOverlay = styled(Sheet.Overlay, {
  name: "BilisoundActionMenuOverlay",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  position: "absolute",
  zIndex: 99_999,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
});
export const ActionMenuBottomSurface = styled(View, {
  name: "BilisoundActionMenuBottomSurface",
  position: "absolute",
  right: 0,
  bottom: 0,
  left: 0,
  height: "$16",
  backgroundColor: "$surface",
  pointerEvents: "none",
});

export const ActionMenuFrame = styled(Sheet.Frame, {
  name: "BilisoundActionMenuFrame",
  width: "100%",
  maxWidth: 768,
  maxHeight: "90%",
  alignSelf: "center",
  marginHorizontal: "auto",
  alignItems: "center",
  padding: "$2",
  backgroundColor: "$surface",
  borderWidth: 1,
  borderBottomWidth: 0,
  borderColor: "$border",
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
});

export const ActionMenuHandle = styled(Sheet.Handle, {
  name: "BilisoundActionMenuHandle",
  zIndex: 10,
  width: "$16",
  height: "$1",
  minHeight: "$1",
  marginVertical: "$1",
  padding: 0,
  borderRadius: "$full",
  backgroundColor: "$textDisabled",
});

export const ActionMenuList = styled(View, {
  name: "BilisoundActionMenuList",
  width: "100%",
  flexDirection: "row",
  flexWrap: "wrap",
});

export const ActionMenuCell = styled(View, {
  name: "BilisoundActionMenuCell",
  flexBasis: "100%",
  maxWidth: "100%",
  $gtSm: {
    flexBasis: "50%",
    maxWidth: "50%",
  },
});

export const ActionMenuItemFrame = styled(TamaguiButton, {
  name: "BilisoundActionMenuItemFrame",
  width: "100%",
  minHeight: 44,
  height: "auto",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "$2",
  padding: "$3",
  borderWidth: 0,
  borderRadius: "$2",
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
    visuallyDisabled: {
      true: {
        cursor: "not-allowed",
        opacity: 0.4,
      },
    },
  } as const,
});

export const ActionMenuIconSlot = styled(View, {
  name: "BilisoundActionMenuIconSlot",
  width: "$6",
  height: "$6",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
});

export const ActionMenuItemText = styled(Text, {
  name: "BilisoundActionMenuItemText",
  color: "$text",
  fontFamily: "$body",
  fontSize: "$sm",
  lineHeight: "$sm",
  textAlign: "left",
  fontWeight: "400",
  userSelect: "none",
});
