import { useCallback, useMemo, useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { useWindowDimensions } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { Popover } from "@tamagui/popover";

import {
  DropdownSelectChevronSlot,
  DropdownSelectContentFrame,
  DropdownSelectOptionFrame,
  DropdownSelectOptionIndicator,
  DropdownSelectOptionText,
  DropdownSelectOptionsFrame,
  DropdownSelectRootFrame,
  DropdownSelectTriggerFrame,
  DropdownSelectValueText,
} from "../recipe";
import { ActionMenu } from "./action-menu";
import type { ActionMenuItem } from "./action-menu";
import type { ControlSize } from "./button";
import { Icon } from "./icon";

const COMPACT_BREAKPOINT = 640;

type TriggerFrameProps = ComponentProps<typeof DropdownSelectTriggerFrame>;

export interface DropdownSelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface DropdownSelectProps extends Omit<
  TriggerFrameProps,
  | "children"
  | "disabled"
  | "fieldSize"
  | "onPress"
  | "opened"
  | "size"
  | "unstyled"
  | "validation"
  | "value"
  | "visuallyDisabled"
> {
  actionMenuHeader?: ReactNode;
  defaultOpen?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  invalid?: boolean;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: string) => void;
  open?: boolean;
  options: readonly DropdownSelectOption[];
  placeholder?: string;
  size?: ControlSize;
  value?: string | null;
}

export function DropdownSelect({
  accessibilityState,
  actionMenuHeader,
  defaultOpen = false,
  defaultValue,
  disabled = false,
  invalid = false,
  onOpenChange,
  onValueChange,
  open: openProp,
  options,
  placeholder = "Select an option",
  size = "md",
  value: valueProp,
  ...triggerProps
}: DropdownSelectProps) {
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;
  const [triggerWidth, setTriggerWidth] = useState<number>();
  const handleValueChange = useCallback(
    (nextValue: string | null) => {
      if (nextValue !== null) {
        onValueChange?.(nextValue);
      }
    },
    [onValueChange],
  );
  const [value, setValue] = useControllableState<string | null>(valueProp, defaultValue ?? null, handleValueChange);
  const [open, setOpen] = useControllableState(openProp, defaultOpen, onOpenChange);
  const selectedOption = options.find(option => option.value === value);
  const handleTriggerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setTriggerWidth(currentWidth => (currentWidth === nextWidth ? currentWidth : nextWidth));
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!disabled || !nextOpen) {
        setOpen(nextOpen);
      }
    },
    [disabled, setOpen],
  );

  const handleOptionPress = useCallback(
    (option: DropdownSelectOption) => {
      if (disabled || option.disabled) {
        return;
      }
      setValue(option.value);
      setOpen(false);
    },
    [disabled, setOpen, setValue],
  );

  const actionMenuItems = useMemo<readonly ActionMenuItem[]>(
    () =>
      options.map(option => ({
        action: () => handleOptionPress(option),
        disabled: option.disabled,
        icon: "fa6-solid:check",
        iconSize: 14,
        id: option.value,
        selected: option.value === value,
        text: option.label,
      })),
    [handleOptionPress, options, value],
  );

  const renderTrigger = (onPress?: TriggerFrameProps["onPress"]) => (
    <DropdownSelectTriggerFrame
      {...triggerProps}
      unstyled
      accessibilityState={{
        ...accessibilityState,
        disabled,
        expanded: open,
      }}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-invalid={invalid || undefined}
      disabled={disabled}
      fieldSize={size}
      opened={open}
      validation={invalid ? "invalid" : undefined}
      visuallyDisabled={disabled}
      onPress={onPress}
    >
      <DropdownSelectValueText fieldSize={size} placeholder={!selectedOption} visuallyDisabled={disabled}>
        {selectedOption?.label ?? placeholder}
      </DropdownSelectValueText>
      <DropdownSelectChevronSlot>
        <Icon name="fa6-solid:angle-down" size={14} aria-hidden />
      </DropdownSelectChevronSlot>
    </DropdownSelectTriggerFrame>
  );

  if (compact) {
    return (
      <DropdownSelectRootFrame onLayout={handleTriggerLayout}>
        {renderTrigger(() => handleOpenChange(true))}
        <ActionMenu header={actionMenuHeader} menuItems={actionMenuItems} open={open} onOpenChange={handleOpenChange} />
      </DropdownSelectRootFrame>
    );
  }

  return (
    <DropdownSelectRootFrame onLayout={handleTriggerLayout}>
      <Popover
        allowFlip
        offset={4}
        open={open}
        placement="bottom-start"
        resize
        stayInFrame={{ padding: 8 }}
        onOpenChange={handleOpenChange}
      >
        <Popover.Trigger asChild>{renderTrigger()}</Popover.Trigger>
        <Popover.FocusScope loop trapped focusOnIdle>
          <DropdownSelectContentFrame
            unstyled
            aria-label={triggerProps["aria-label"]}
            width={triggerWidth === undefined ? undefined : Math.min(Math.max(triggerWidth, 240), 360)}
          >
            <DropdownSelectOptionsFrame role="menu">
              {options.map(option => {
                const selected = option.value === value;

                return (
                  <DropdownSelectOptionFrame
                    unstyled
                    aria-checked={selected}
                    disabled={option.disabled}
                    key={option.value}
                    role="menuitem"
                    selected={selected}
                    visuallyDisabled={option.disabled}
                    onPress={() => handleOptionPress(option)}
                  >
                    <DropdownSelectOptionText>{option.label}</DropdownSelectOptionText>
                    <DropdownSelectOptionIndicator>
                      {selected ? <Icon name="fa6-solid:check" size={14} aria-hidden /> : null}
                    </DropdownSelectOptionIndicator>
                  </DropdownSelectOptionFrame>
                );
              })}
            </DropdownSelectOptionsFrame>
          </DropdownSelectContentFrame>
        </Popover.FocusScope>
      </Popover>
    </DropdownSelectRootFrame>
  );
}

function useControllableState<T>(
  controlledValue: T | undefined,
  defaultValue: T,
  onChange: ((value: T) => void) | undefined,
): [T, (value: T) => void] {
  const controlled = controlledValue !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const uncontrolledValueRef = useRef(uncontrolledValue);
  uncontrolledValueRef.current = uncontrolledValue;
  const value = controlled ? (controlledValue as T) : uncontrolledValue;

  const setValue = useCallback(
    (nextValue: T) => {
      const currentValue = controlled ? (controlledValue as T) : uncontrolledValueRef.current;
      if (Object.is(nextValue, currentValue)) {
        return;
      }
      if (!controlled) {
        uncontrolledValueRef.current = nextValue;
        setUncontrolledValue(nextValue);
      }
      onChange?.(nextValue);
    },
    [controlled, controlledValue, onChange],
  );

  return [value, setValue];
}
