"use client";
import { createModal } from "@gluestack-ui/modal";
import type { VariantProps } from "@gluestack-ui/nativewind-utils";
import { tva } from "@gluestack-ui/nativewind-utils/tva";
import { withStyleContext, useStyleContext } from "@gluestack-ui/nativewind-utils/withStyleContext";
import { withStyleContextAndStates } from "@gluestack-ui/nativewind-utils/withStyleContextAndStates";
import { Motion, AnimatePresence, createMotionAnimatedComponent } from "@legendapp/motion";
import { cssInterop } from "nativewind";
import React from "react";
import { Pressable, View, ScrollView, Platform } from "react-native";

const AnimatedPressable = createMotionAnimatedComponent(Pressable);

const SCOPE = "MODAL";

const UIModal = createModal({
  Root: Platform.OS === "web" ? withStyleContext(View, SCOPE) : withStyleContextAndStates(View, SCOPE),
  Backdrop: AnimatedPressable,
  Content: Motion.View,
  Body: ScrollView,
  CloseButton: Pressable,
  Footer: View,
  Header: View,
  AnimatePresence,
});

cssInterop(UIModal, { className: "style" });
cssInterop(UIModal.Content, { className: "style" });
cssInterop(UIModal.CloseButton, { className: "style" });
cssInterop(UIModal.Header, { className: "style" });
cssInterop(UIModal.Footer, { className: "style" });
cssInterop(UIModal.Body, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
  indicatorClassName: "indicatorStyle",
});
cssInterop(UIModal.Backdrop, { className: "style" });

const ModalStyle = tva({
  base: "group/modal w-full h-full justify-center items-center web:pointer-events-none",
  parentVariants: {
    size: {
      xs: "",
      sm: "",
      md: "",
      lg: "",
      full: "",
    },
  },
});

const ModalContentStyle = tva({
  base: "bg-background-0 rounded-2xl overflow-hidden shadow-xl p-6",
  parentVariants: {
    size: {
      xs: "w-[60%] max-w-[360px]",
      sm: "w-[70%] max-w-[420px]",
      md: "w-[80%] max-w-[510px]",
      lg: "w-[90%] max-w-[640px]",
      full: "w-full",
    },
  },
});

const ModalCloseButtonStyle = tva({
  base: "group/alert-dialog-close-button z-10 rounded-sm p-2 data-[focus-visible=true]:bg-background-100 web:cursor-pointer outline-0",
});

const ModalHeaderStyle = tva({
  base: "justify-between items-center flex-row",
});

const ModalFooterStyle = tva({
  base: "flex-row justify-end items-center gap-3",
});

const ModalBodyStyle = tva({ base: "" });

const ModalBackdropStyle = tva({
  base: "absolute left-0 top-0 right-0 bottom-0 bg-background-dark web:cursor-default",
});

type IModalProps = React.ComponentPropsWithoutRef<typeof UIModal> & VariantProps<typeof ModalStyle>;

type IModalContentProps = React.ComponentPropsWithoutRef<typeof UIModal.Content> &
  VariantProps<typeof ModalContentStyle> & { className?: string };

type IModalCloseButtonProps = React.ComponentPropsWithoutRef<typeof UIModal.CloseButton> &
  VariantProps<typeof ModalCloseButtonStyle>;

type IModalHeaderProps = React.ComponentPropsWithoutRef<typeof UIModal.Header> & VariantProps<typeof ModalHeaderStyle>;

type IModalFooterProps = React.ComponentPropsWithoutRef<typeof UIModal.Footer> & VariantProps<typeof ModalFooterStyle>;

type IModalBodyProps = React.ComponentPropsWithoutRef<typeof UIModal.Body> & VariantProps<typeof ModalBodyStyle>;

type IModalBackdropProps = React.ComponentPropsWithoutRef<typeof UIModal.Backdrop> &
  VariantProps<typeof ModalBackdropStyle> & { className?: string };

const Modal = React.forwardRef<React.ElementRef<typeof UIModal>, IModalProps>(
  ({ className, size = "md", ...props }, ref) => {
    return (
      <UIModal
        ref={ref}
        {...props}
        className={ModalStyle({ class: className })}
        context={{ size }}
        pointerEvents="box-none"
      />
    );
  },
);

const ModalContent = React.forwardRef<React.ElementRef<typeof UIModal.Content>, IModalContentProps>(
  ({ className, size, ...props }, ref) => {
    const { size: parentSize } = useStyleContext(SCOPE);

    return (
      <UIModal.Content
        pointerEvents="auto"
        ref={ref}
        initial={{
          scale: 0.95,
          opacity: 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        exit={{
          scale: 0.95,
          opacity: 0,
        }}
        transition={{
          type: "timing",
          duration: 250,
        }}
        {...props}
        className={ModalContentStyle({
          parentVariants: {
            size: parentSize,
          },
          size,
          class: className,
        })}
      />
    );
  },
);

const ModalCloseButton = React.forwardRef<React.ElementRef<typeof UIModal.CloseButton>, IModalCloseButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <UIModal.CloseButton
        ref={ref}
        {...props}
        className={ModalCloseButtonStyle({
          class: className,
        })}
      />
    );
  },
);

const ModalHeader = React.forwardRef<React.ElementRef<typeof UIModal.Header>, IModalHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <UIModal.Header
        ref={ref}
        {...props}
        className={ModalHeaderStyle({
          class: className,
        })}
      />
    );
  },
);

const ModalFooter = React.forwardRef<React.ElementRef<typeof UIModal.Footer>, IModalFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <UIModal.Footer
        ref={ref}
        {...props}
        className={ModalFooterStyle({
          class: className,
        })}
      />
    );
  },
);

const ModalBody = React.forwardRef<React.ElementRef<typeof UIModal.Body>, IModalBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <UIModal.Body
        ref={ref}
        {...props}
        className={ModalBodyStyle({
          class: className,
        })}
      />
    );
  },
);

const ModalBackdrop = React.forwardRef<React.ElementRef<typeof UIModal.Backdrop>, IModalBackdropProps>(
  ({ className, ...props }, ref) => {
    return (
      <UIModal.Backdrop
        ref={ref}
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 0.7,
        }}
        exit={{
          opacity: 0,
        }}
        transition={{
          type: "timing",
          duration: 250,
        }}
        {...props}
        className={ModalBackdropStyle({
          class: className,
        })}
      />
    );
  },
);

Modal.displayName = "Modal";
ModalContent.displayName = "ModalContent";
ModalCloseButton.displayName = "ModalCloseButton";
ModalHeader.displayName = "ModalHeader";
ModalFooter.displayName = "ModalFooter";
ModalBody.displayName = "ModalBody";
ModalBackdrop.displayName = "ModalBackdrop";

export { Modal, ModalContent, ModalCloseButton, ModalHeader, ModalFooter, ModalBody, ModalBackdrop };
