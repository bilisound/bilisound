import { ScrollView } from "react-native";
import { styled, View } from "@tamagui/core";
import { Dialog } from "@tamagui/dialog";

export const ModalBackdropFrame = styled(Dialog.Overlay, {
  name: "BilisoundModalBackdrop",
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: "$black",
  opacity: 0.7,
  cursor: "default",
});

export const ModalContentFrame = styled(Dialog.Content, {
  name: "BilisoundModalContent",
  position: "relative",
  zIndex: 2,
  overflow: "hidden",
  width: "80%",
  maxWidth: 510,
  padding: "$6",
  backgroundColor: "$surface",
  borderRadius: "$4",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",

  variants: {
    dialogSize: {
      xs: {
        width: "60%",
        maxWidth: 360,
      },
      sm: {
        width: "70%",
        maxWidth: 420,
      },
      md: {
        width: "80%",
        maxWidth: 510,
      },
      lg: {
        width: "90%",
        maxWidth: 640,
      },
      full: {
        width: "100%",
        maxWidth: "100%",
      },
    },
  } as const,

  defaultVariants: {
    dialogSize: "md",
  },
});

export const ModalCloseButtonFrame = styled(Dialog.Close, {
  name: "BilisoundModalCloseButton",
  zIndex: 3,
  alignItems: "center",
  justifyContent: "center",
  padding: "$2",
  backgroundColor: "transparent",
  borderRadius: "$1",
  cursor: "pointer",
  outlineWidth: 0,
  focusVisibleStyle: {
    backgroundColor: "$surfaceMuted",
    outlineColor: "$focusRing",
    outlineStyle: "solid",
    outlineWidth: 2,
    outlineOffset: 2,
  },
});

export const ModalHeaderFrame = styled(View, {
  name: "BilisoundModalHeader",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
});

export const ModalBodyFrame = styled(ScrollView, {
  name: "BilisoundModalBody",
  marginTop: "$3",
  marginBottom: "$5",
});

export const ModalFooterFrame = styled(View, {
  name: "BilisoundModalFooter",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "$2",
});

export const ModalTitleFrame = styled(Dialog.Title, {
  name: "BilisoundModalTitle",
  color: "$text",
  fontFamily: "$heading",
  fontSize: "$lg",
  lineHeight: "$lg",
  fontWeight: "600",
});

export const ModalDescriptionFrame = styled(Dialog.Description, {
  name: "BilisoundModalDescription",
  color: "$textMuted",
  fontFamily: "$body",
  fontSize: "$sm",
  lineHeight: "$sm",
});
