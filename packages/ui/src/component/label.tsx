import type { ReactNode, Ref } from "react";
import type { Text as ReactNativeText } from "react-native";
import type { GetProps } from "@tamagui/core";

import { LabelFrame, LabelRequiredMark } from "../recipe";

export interface LabelProps extends Omit<GetProps<typeof LabelFrame>, "children" | "ref"> {
  children: ReactNode;
  htmlFor?: string;
  ref?: Ref<ReactNativeText>;
  required?: boolean;
}

export function Label({ children, htmlFor, ref, required = false, ...props }: LabelProps) {
  return (
    <LabelFrame ref={ref} {...(htmlFor ? ({ htmlFor } as object) : null)} {...props}>
      {children}
      {required ? <LabelRequiredMark aria-hidden> *</LabelRequiredMark> : null}
    </LabelFrame>
  );
}
