import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, Ref, SetStateAction } from "react";
import { Animated, Easing } from "react-native";
import type { View, ViewProps } from "react-native";
import { isWeb } from "@tamagui/core";
import type { GetProps } from "@tamagui/core";
import { useSwitch } from "@tamagui/switch-headless";
import type {
  SwitchExtraProps as HeadlessSwitchExtraProps,
  SwitchProps as HeadlessSwitchProps,
} from "@tamagui/switch-headless";

import { SwitchControl, switchAnimationDuration, switchStyles, switchThumbTravel, useSwitchColors } from "../recipe";

const webButtonProps: Record<string, unknown> = isWeb ? { type: "button" } : {};

export interface SwitchVisualProps extends Omit<ViewProps, "children"> {
  checked: boolean;
  disabled?: boolean;
  ref?: Ref<View>;
}

export type SwitchProps = Omit<
  GetProps<typeof SwitchControl>,
  "children" | "onPress" | "ref" | "render" | "type" | "visuallyDisabled" | keyof HeadlessSwitchExtraProps
> &
  HeadlessSwitchExtraProps & {
    ref?: Ref<View>;
  };

export function SwitchVisual({ checked, disabled, ref, style, ...props }: SwitchVisualProps) {
  const { thumb: thumbColor, track, trackChecked } = useSwitchColors();
  const progress = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [track, trackChecked],
  });
  const thumbTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, switchThumbTravel],
  });

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: checked ? 1 : 0,
      duration: switchAnimationDuration,
      easing: Easing.cubic,
      useNativeDriver: false,
    });

    animation.start();
    return () => animation.stop();
  }, [checked, progress]);

  return (
    <Animated.View
      {...props}
      ref={ref}
      accessible={false}
      accessibilityElementsHidden
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[switchStyles.track, style, disabled && switchStyles.disabled, { backgroundColor: trackColor }]}
    >
      <Animated.View
        style={[switchStyles.thumb, { backgroundColor: thumbColor, transform: [{ translateX: thumbTranslateX }] }]}
      />
    </Animated.View>
  );
}

export function Switch({
  checked: checkedProp,
  defaultChecked = false,
  disabled,
  labeledBy,
  name,
  onCheckedChange,
  ref,
  required,
  value,
  ...props
}: SwitchProps) {
  const [checked, setChecked] = useControllableChecked(checkedProp, defaultChecked, onCheckedChange);
  const setCheckedFromInteraction = useCallback<Dispatch<SetStateAction<boolean>>>(
    nextChecked => {
      if (!disabled) {
        setChecked(nextChecked);
      }
    },
    [disabled, setChecked],
  );
  const { bubbleInput, switchProps, switchRef } = useSwitch(
    {
      "aria-labelledby": props["aria-labelledby"],
      checked,
      disabled,
      labeledBy,
      name,
      required,
      value,
    } satisfies HeadlessSwitchProps,
    [checked, setCheckedFromInteraction],
    ref ?? null,
  );

  return (
    <>
      <SwitchControl
        {...props}
        {...switchProps}
        ref={switchRef}
        render="button"
        {...webButtonProps}
        accessibilityRole="switch"
        aria-label={props["aria-label"] ?? props.accessibilityLabel}
        accessibilityState={{ ...props.accessibilityState, checked, disabled }}
        disabled={disabled}
        hitSlop={props.hitSlop ?? 8}
        visuallyDisabled={disabled}
      >
        <SwitchVisual checked={checked} disabled={disabled} />
      </SwitchControl>
      {bubbleInput}
    </>
  );
}

function useControllableChecked(
  checkedProp: boolean | undefined,
  defaultChecked: boolean,
  onCheckedChange: ((checked: boolean) => void) | undefined,
): [boolean, Dispatch<SetStateAction<boolean>>] {
  const controlled = checkedProp !== undefined;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const uncontrolledCheckedRef = useRef(uncontrolledChecked);
  uncontrolledCheckedRef.current = uncontrolledChecked;
  const checked = checkedProp ?? uncontrolledChecked;

  const setChecked = useCallback<Dispatch<SetStateAction<boolean>>>(
    nextChecked => {
      const currentChecked = controlled ? (checkedProp as boolean) : uncontrolledCheckedRef.current;
      const resolvedChecked = typeof nextChecked === "function" ? nextChecked(currentChecked) : nextChecked;

      if (resolvedChecked === currentChecked) {
        return;
      }

      if (!controlled) {
        uncontrolledCheckedRef.current = resolvedChecked;
        setUncontrolledChecked(resolvedChecked);
      }
      onCheckedChange?.(resolvedChecked);
    },
    [checkedProp, controlled, onCheckedChange],
  );

  return [checked, setChecked];
}
