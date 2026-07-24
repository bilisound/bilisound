import type { ReactNode, Ref } from "react";
import type { View } from "react-native";
import type { GetProps } from "@tamagui/core";

import { CheckboxBox, CheckboxCheck, CheckboxLabel, CheckboxRoot } from "../recipe";

export interface CheckboxProps extends Omit<GetProps<typeof CheckboxRoot>, "children" | "onPress" | "ref"> {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
  ref?: Ref<View>;
}

export function Checkbox({
  checked = false,
  disabled,
  label,
  onCheckedChange,
  ref,
  ...props
}: CheckboxProps) {
  return (
    <CheckboxRoot
      ref={ref}
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      visuallyDisabled={disabled}
      opacity={disabled ? 0.5 : 1}
      onPress={() => {
        if (disabled) {
          return;
        }
        onCheckedChange?.(!checked);
      }}
      {...props}
    >
      <CheckboxBox checked={checked} aria-hidden>{checked ? <CheckboxCheck>✓</CheckboxCheck> : null}</CheckboxBox>
      {label != null && label !== false ? <CheckboxLabel>{label}</CheckboxLabel> : null}
    </CheckboxRoot>
  );
}
