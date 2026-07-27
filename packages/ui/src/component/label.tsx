import type { ReactNode, Ref } from "react";
import type { Text as ReactNativeText, View as ReactNativeView } from "react-native";
import { type GetProps, useTheme } from "@tamagui/core";

import { LabelErrorFrame, LabelErrorText, LabelFrame, LabelRequiredMark } from "../recipe";
import { Icon } from "./icon";

export interface LabelProps extends Omit<GetProps<typeof LabelFrame>, "children" | "ref"> {
  children: ReactNode;
  htmlFor?: string;
  ref?: Ref<ReactNativeText>;
  required?: boolean;
}

export interface LabelErrorProps extends Omit<GetProps<typeof LabelErrorFrame>, "children" | "ref"> {
  children: ReactNode;
  ref?: Ref<ReactNativeView>;
}

export function Label({ children, htmlFor, ref, required = false, ...props }: LabelProps) {
  return (
    <LabelFrame ref={ref} {...(htmlFor ? ({ htmlFor } as object) : null)} {...props}>
      {children}
      {required ? <LabelRequiredMark aria-hidden> *</LabelRequiredMark> : null}
    </LabelFrame>
  );
}

export function LabelError({ children, ref, ...props }: LabelErrorProps) {
  const theme = useTheme();

  return (
    <LabelErrorFrame ref={ref} role="alert" accessibilityLiveRegion="polite" {...props}>
      <Icon aria-hidden name="ion:alert-circle" size={16} color={theme.danger.get()} />
      <LabelErrorText>{children}</LabelErrorText>
    </LabelErrorFrame>
  );
}
