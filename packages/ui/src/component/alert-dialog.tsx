import { createContext, forwardRef, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Animated, StyleSheet } from "react-native";
import { AnimatedView, useAnimatedNumber, useAnimatedNumberStyle } from "@tamagui/animations-react-native";
import type { TamaguiElement } from "@tamagui/core";
import { AlertDialog as TamaguiAlertDialog } from "@tamagui/alert-dialog";
import type { AlertDialogProps as TamaguiAlertDialogProps } from "@tamagui/alert-dialog";

import {
  AlertDialogBackdropFrame,
  AlertDialogBodyFrame,
  AlertDialogCloseButtonFrame,
  AlertDialogContentFrame,
  AlertDialogDescriptionFrame,
  AlertDialogFooterFrame,
  AlertDialogHeaderFrame,
  AlertDialogTitleFrame,
} from "../recipe/alert-dialog";

export type AlertDialogSize = "xs" | "sm" | "md" | "lg" | "full";

export interface AlertDialogProps extends Omit<TamaguiAlertDialogProps, "children"> {
  children?: ReactNode;
  size?: AlertDialogSize;
}

const AlertDialogSizeContext = createContext<AlertDialogSize>("md");
const AlertDialogAnimationContext = createContext(false);
const alertDialogAnimationDuration = 250;
const alertDialogUnmountDelay = alertDialogAnimationDuration + 50;

export function AlertDialog({
  children,
  defaultOpen = false,
  disableRemoveScroll = true,
  onOpenChange,
  open: controlledOpen,
  size = "md",
  ...props
}: AlertDialogProps) {
  const controlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const requestedOpen = controlled ? controlledOpen : uncontrolledOpen;
  const [primitiveOpen, setPrimitiveOpen] = useState(requestedOpen);
  const [visualOpen, setVisualOpen] = useState(requestedOpen);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeout.current !== null) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  }, []);

  const showContent = useCallback(() => {
    clearCloseTimeout();
    setPrimitiveOpen(true);
    setVisualOpen(true);
  }, [clearCloseTimeout]);

  const hideContent = useCallback(() => {
    clearCloseTimeout();
    setVisualOpen(false);
    closeTimeout.current = setTimeout(() => {
      setPrimitiveOpen(false);
      closeTimeout.current = null;
    }, alertDialogUnmountDelay);
  }, [clearCloseTimeout]);

  useEffect(() => {
    if (requestedOpen) {
      showContent();
    } else {
      hideContent();
    }
  }, [hideContent, requestedOpen, showContent]);

  useEffect(() => clearCloseTimeout, [clearCloseTimeout]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!controlled) setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [controlled, onOpenChange],
  );

  return (
    <AlertDialogSizeContext.Provider value={size}>
      <AlertDialogAnimationContext.Provider value={visualOpen}>
        <TamaguiAlertDialog
          disableRemoveScroll={disableRemoveScroll}
          open={primitiveOpen}
          onOpenChange={handleOpenChange}
          {...props}
        >
          {children}
        </TamaguiAlertDialog>
      </AlertDialogAnimationContext.Provider>
    </AlertDialogSizeContext.Provider>
  );
}
AlertDialog.displayName = "AlertDialog";

export type AlertDialogTriggerProps = ComponentProps<typeof TamaguiAlertDialog.Trigger>;
export const AlertDialogTrigger = TamaguiAlertDialog.Trigger;

export type AlertDialogPortalProps = Omit<ComponentProps<typeof TamaguiAlertDialog.Portal>, "unstyled">;
export function AlertDialogPortal({ children, ...props }: AlertDialogPortalProps) {
  const open = useContext(AlertDialogAnimationContext);
  const size = useContext(AlertDialogSizeContext);

  return (
    <TamaguiAlertDialog.Portal
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
    >
      <AlertDialogSizeContext.Provider value={size}>
        <AlertDialogAnimationContext.Provider value={open}>{children}</AlertDialogAnimationContext.Provider>
      </AlertDialogSizeContext.Provider>
    </TamaguiAlertDialog.Portal>
  );
}
AlertDialogPortal.displayName = "AlertDialogPortal";

export type AlertDialogBackdropProps = Omit<
  ComponentProps<typeof AlertDialogBackdropFrame>,
  "animateOnly" | "enterStyle" | "exitStyle" | "render" | "transition" | "unstyled"
>;
export const AlertDialogBackdrop = forwardRef<TamaguiElement, AlertDialogBackdropProps>(
  function AlertDialogBackdrop(props, ref) {
    const open = useContext(AlertDialogAnimationContext);
    const animationProgress = useAnimatedNumber(0);
    const animationStyle = useAnimatedNumberStyle(animationProgress, getAlertDialogBackdropAnimationStyle);

    useEffect(() => {
      animationProgress.setValue(open ? 1 : 0, {
        type: "timing",
        duration: alertDialogAnimationDuration,
      });
    }, [animationProgress, open]);

    return (
      <AnimatedView pointerEvents="box-none" style={[styles.backdropAnimation, animationStyle]}>
        <AlertDialogBackdropFrame ref={ref} {...props} unstyled />
      </AnimatedView>
    );
  },
);
AlertDialogBackdrop.displayName = "AlertDialogBackdrop";

export type AlertDialogContentProps = Omit<
  ComponentProps<typeof AlertDialogContentFrame>,
  "animateOnly" | "dialogSize" | "enterStyle" | "exitStyle" | "render" | "transition" | "unstyled"
> & {
  size?: AlertDialogSize;
};
export const AlertDialogContent = forwardRef<TamaguiElement, AlertDialogContentProps>(function AlertDialogContent(
  { scope, size, ...props },
  ref,
) {
  const open = useContext(AlertDialogAnimationContext);
  const parentSize = useContext(AlertDialogSizeContext);
  const animationProgress = useAnimatedNumber(0);
  const animationStyle = useAnimatedNumberStyle(animationProgress, getAlertDialogAnimationStyle);

  useEffect(() => {
    animationProgress.setValue(open ? 1 : 0, {
      type: "timing",
      duration: alertDialogAnimationDuration,
    });
  }, [animationProgress, open]);

  return (
    <AnimatedView pointerEvents="box-none" style={[styles.contentAnimation, animationStyle]}>
      <AlertDialogContentFrame
        ref={ref}
        dialogSize={size ?? parentSize}
        pointerEvents="auto"
        scope={scope}
        {...props}
        unstyled
      />
    </AnimatedView>
  );
});
AlertDialogContent.displayName = "AlertDialogContent";

function getAlertDialogBackdropAnimationStyle(value: number) {
  return {
    opacity: value as unknown as Animated.Value,
  };
}

function getAlertDialogAnimationStyle(value: number) {
  const animatedValue = value as unknown as Animated.Value;

  return {
    opacity: animatedValue,
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
    ],
  };
}

export type AlertDialogActionProps = ComponentProps<typeof TamaguiAlertDialog.Action>;
export const AlertDialogAction = TamaguiAlertDialog.Action;

export type AlertDialogCancelProps = ComponentProps<typeof TamaguiAlertDialog.Cancel>;
export const AlertDialogCancel = TamaguiAlertDialog.Cancel;

export type AlertDialogCloseButtonProps = ComponentProps<typeof AlertDialogCloseButtonFrame>;
export const AlertDialogCloseButton = AlertDialogCloseButtonFrame;

export type AlertDialogHeaderProps = ComponentProps<typeof AlertDialogHeaderFrame>;
export const AlertDialogHeader = AlertDialogHeaderFrame;

export type AlertDialogBodyProps = ComponentProps<typeof AlertDialogBodyFrame>;
export const AlertDialogBody = AlertDialogBodyFrame;

export type AlertDialogFooterProps = ComponentProps<typeof AlertDialogFooterFrame>;
export const AlertDialogFooter = AlertDialogFooterFrame;

export type AlertDialogTitleProps = Omit<ComponentProps<typeof AlertDialogTitleFrame>, "unstyled">;
export const AlertDialogTitle = forwardRef<TamaguiElement, AlertDialogTitleProps>(
  function AlertDialogTitle(props, ref) {
    return <AlertDialogTitleFrame ref={ref} {...props} unstyled />;
  },
);
AlertDialogTitle.displayName = "AlertDialogTitle";

export type AlertDialogDescriptionProps = Omit<ComponentProps<typeof AlertDialogDescriptionFrame>, "unstyled">;
export const AlertDialogDescription = forwardRef<TamaguiElement, AlertDialogDescriptionProps>(
  function AlertDialogDescription(props, ref) {
    return <AlertDialogDescriptionFrame ref={ref} {...props} unstyled />;
  },
);
AlertDialogDescription.displayName = "AlertDialogDescription";

const styles = StyleSheet.create({
  backdropAnimation: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  contentAnimation: {
    width: "100%",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
});
