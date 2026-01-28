"use client";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { tva, withStyleContext } from "@gluestack-ui/utils/nativewind-utils";
import { withStyleContextAndStates } from "~/components/ui/utils/with-style-context-and-states";
import { createSwitch } from "@gluestack-ui/core/switch/creator";
import { cssInterop } from "nativewind";
import React from "react";
import { Switch as RNSwitch, Platform } from "react-native";

import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";

const SwitchWrapper = React.forwardRef<React.ElementRef<typeof RNSwitch>, React.ComponentProps<typeof RNSwitch>>(
  ({ ...props }, ref) => {
    return <RNSwitch {...props} ref={ref} />;
  },
);

const UISwitch = createSwitch({
  Root: Platform.OS === "web" ? withStyleContext(SwitchWrapper) : withStyleContextAndStates(SwitchWrapper),
});

cssInterop(SwitchWrapper, { className: "style" });

const switchStyle = tva({
  base: "data-[focus=true]:outline-0 data-[focus=true]:ring-2 data-[focus=true]:ring-indicator-primary web:cursor-pointer disabled:cursor-not-allowed data-[disabled=true]:opacity-40 data-[invalid=true]:border-error-700 data-[invalid=true]:rounded-xl data-[invalid=true]:border-2",

  variants: {
    size: {
      sm: "scale-75",
      md: "",
      lg: "scale-125",
    },
  },
});

type ISwitchProps = React.ComponentProps<typeof UISwitch> & VariantProps<typeof switchStyle>;
const Switch = React.forwardRef<React.ElementRef<typeof UISwitch>, ISwitchProps>(
  ({ className, size = "md", ...props }, ref) => {
    const { colorValue, mode } = useRawThemeValues();
    const dark = mode === "dark";

    return (
      <UISwitch
        ref={ref}
        trackColor={{
          false: colorValue(dark ? "--color-primary-50" : "--color-primary-200"),
          true: colorValue(dark ? "--color-primary-400" : "--color-primary-500"),
        }}
        thumbColor={colorValue(dark ? "--color-primary-700" : "--color-primary-50")}
        // @ts-ignore
        activeThumbColor={colorValue(dark ? "--color-primary-700" : "--color-primary-50")}
        ios_backgroundColor={colorValue(dark ? "--color-primary-200" : "--color-primary-200")}
        {...props}
        className={switchStyle({ size, class: className })}
      />
    );
  },
);

Switch.displayName = "Switch";
export { Switch };
