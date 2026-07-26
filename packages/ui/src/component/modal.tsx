import { createContext, forwardRef, useContext } from "react";
import type { ComponentProps, ReactNode } from "react";
import type { TamaguiElement } from "@tamagui/core";
import { Dialog } from "@tamagui/dialog";
import type { DialogHandle, DialogProps } from "@tamagui/dialog";

import {
  ModalBackdropFrame,
  ModalBodyFrame,
  ModalCloseButtonFrame,
  ModalContentFrame,
  ModalDescriptionFrame,
  ModalFooterFrame,
  ModalHeaderFrame,
  ModalTitleFrame,
} from "../recipe/modal";

export type ModalSize = "xs" | "sm" | "md" | "lg" | "full";

export interface ModalProps extends Omit<DialogProps, "children"> {
  children?: ReactNode;
  size?: ModalSize;
}

const ModalSizeContext = createContext<ModalSize>("md");

export const Modal = forwardRef<DialogHandle, ModalProps>(function Modal(
  { children, disableRemoveScroll = true, size = "md", ...props },
  ref,
) {
  return (
    <ModalSizeContext.Provider value={size}>
      <Dialog ref={ref} disableRemoveScroll={disableRemoveScroll} {...props}>
        {children}
      </Dialog>
    </ModalSizeContext.Provider>
  );
});

export type ModalTriggerProps = ComponentProps<typeof Dialog.Trigger>;
export const ModalTrigger = Dialog.Trigger;

export type ModalPortalProps = Omit<ComponentProps<typeof Dialog.Portal>, "unstyled">;
export const ModalPortal = forwardRef<TamaguiElement, ModalPortalProps>(function ModalPortal(props, ref) {
  return (
    <Dialog.Portal
      ref={ref}
      alignItems="center"
      justifyContent="center"
      backgroundColor="transparent"
      borderWidth={0}
      position="absolute"
      top={0}
      right={0}
      bottom={0}
      left={0}
      fullscreen
      margin={0}
      width="100%"
      height="100%"
      maxHeight="100%"
      maxWidth="100%"
      {...props}
      unstyled
    />
  );
});

export type ModalBackdropProps = Omit<ComponentProps<typeof ModalBackdropFrame>, "unstyled">;
export const ModalBackdrop = forwardRef<TamaguiElement, ModalBackdropProps>(function ModalBackdrop(
  {
    animateOnly = ["opacity"],
    enterStyle = { opacity: 0 },
    exitStyle = { opacity: 0 },
    transition = { opacity: "dialog" },
    ...props
  },
  ref,
) {
  return (
    <ModalBackdropFrame
      ref={ref}
      animateOnly={animateOnly}
      enterStyle={enterStyle}
      exitStyle={exitStyle}
      transition={transition}
      {...props}
      unstyled
    />
  );
});

export type ModalContentProps = Omit<ComponentProps<typeof ModalContentFrame>, "dialogSize" | "unstyled"> & {
  size?: ModalSize;
};
export const ModalContent = forwardRef<TamaguiElement, ModalContentProps>(function ModalContent(
  {
    animateOnly = ["opacity", "transform"],
    enterStyle = { opacity: 0, scale: 0.95 },
    exitStyle = { opacity: 0, scale: 0.95 },
    size,
    transition = "dialog",
    ...props
  },
  ref,
) {
  const parentSize = useContext(ModalSizeContext);

  return (
    <ModalContentFrame
      ref={ref}
      animateOnly={animateOnly}
      dialogSize={size ?? parentSize}
      enterStyle={enterStyle}
      exitStyle={exitStyle}
      pointerEvents="auto"
      transition={transition}
      {...props}
      unstyled
    />
  );
});

export type ModalCloseProps = ComponentProps<typeof Dialog.Close>;
export const ModalClose = Dialog.Close;

export type ModalCloseButtonProps = ComponentProps<typeof ModalCloseButtonFrame>;
export const ModalCloseButton = ModalCloseButtonFrame;

export type ModalHeaderProps = ComponentProps<typeof ModalHeaderFrame>;
export const ModalHeader = ModalHeaderFrame;

export type ModalBodyProps = ComponentProps<typeof ModalBodyFrame>;
export const ModalBody = ModalBodyFrame;

export type ModalFooterProps = ComponentProps<typeof ModalFooterFrame>;
export const ModalFooter = ModalFooterFrame;

export type ModalTitleProps = Omit<ComponentProps<typeof ModalTitleFrame>, "unstyled">;
export const ModalTitle = forwardRef<TamaguiElement, ModalTitleProps>(function ModalTitle(props, ref) {
  return <ModalTitleFrame ref={ref} {...props} unstyled />;
});

export type ModalDescriptionProps = Omit<ComponentProps<typeof ModalDescriptionFrame>, "unstyled">;
export const ModalDescription = forwardRef<TamaguiElement, ModalDescriptionProps>(
  function ModalDescription(props, ref) {
    return <ModalDescriptionFrame ref={ref} {...props} unstyled />;
  },
);
