"use client";
import React from "react";
import { createButton } from "@gluestack-ui/button";
import { withStyleContext, useStyleContext } from "@gluestack-ui/nativewind-utils/withStyleContext";
import { cssInterop } from "nativewind";
import { ActivityIndicator, Pressable, Text, View, ViewProps } from "react-native";
import type { VariantProps } from "@gluestack-ui/nativewind-utils";
import { PrimitiveIcon, UIIcon } from "@gluestack-ui/icon";
import { twMerge } from "tailwind-merge";
import { boxStyle } from "~/components/ui/box/styles";
import {
  buttonStyle,
  buttonGroupStyle,
  buttonIconStyle,
  buttonTextStyle,
  buttonMonIconStyle,
  buttonMonIconInternalStyle,
} from "./styles";
import { Icon } from "~/components/icon";
import { IS_ANDROID_RIPPLE_ENABLED } from "~/constants/platform";

const SCOPE = "BUTTON";

const Root = withStyleContext(Pressable, SCOPE);

const UIButton = createButton({
  Root: Root,
  Text,
  Group: View,
  Spinner: ActivityIndicator,
  Icon: UIIcon,
});

cssInterop(PrimitiveIcon, {
  className: {
    target: "style",
    nativeStyleToProp: {
      height: true,
      width: true,
      fill: true,
      color: "classNameColor",
      stroke: true,
    },
  },
});

type IButtonProps = Omit<React.ComponentPropsWithoutRef<typeof UIButton>, "context"> &
  VariantProps<typeof buttonStyle> & { className?: string };

const Button = React.forwardRef<React.ElementRef<typeof UIButton>, IButtonProps>(
  (
    { className, variant = "solid", size = "md", action = "primary", icon = false, disabled = false, ...props },
    ref,
  ) => {
    return (
      <UIButton
        ref={ref}
        {...props}
        disabled={disabled}
        className={buttonStyle({ variant, size, action, icon, disabled, class: className })}
        context={{ variant, size, action }}
      />
    );
  },
);

type IButtonTextProps = React.ComponentPropsWithoutRef<typeof UIButton.Text> &
  VariantProps<typeof buttonTextStyle> & { className?: string };

const ButtonText = React.forwardRef<React.ElementRef<typeof UIButton.Text>, IButtonTextProps>(
  ({ className, variant, size, action, ...props }, ref) => {
    const { variant: parentVariant, size: parentSize, action: parentAction } = useStyleContext(SCOPE);

    return (
      <UIButton.Text
        ref={ref}
        {...props}
        className={buttonTextStyle({
          parentVariants: {
            variant: parentVariant,
            size: parentSize,
            action: parentAction,
          },
          variant,
          size,
          action,
          class: className,
        })}
      />
    );
  },
);

const ButtonSpinner = UIButton.Spinner;

type IButtonIcon = React.ComponentPropsWithoutRef<typeof UIButton.Icon> &
  VariantProps<typeof buttonIconStyle> & {
    className?: string | undefined;
    as?: React.ElementType;
    height?: number;
    width?: number;
  };

const ButtonIcon = React.forwardRef<React.ElementRef<typeof UIButton.Icon>, IButtonIcon>(
  ({ className, size, ...props }, ref) => {
    const { variant: parentVariant, size: parentSize, action: parentAction } = useStyleContext(SCOPE);

    if (typeof size === "number") {
      return <UIButton.Icon ref={ref} {...props} className={buttonIconStyle({ class: className })} size={size} />;
    } else if ((props.height !== undefined || props.width !== undefined) && size === undefined) {
      return <UIButton.Icon ref={ref} {...props} className={buttonIconStyle({ class: className })} />;
    }
    return (
      <UIButton.Icon
        {...props}
        className={buttonIconStyle({
          parentVariants: {
            size: parentSize,
            variant: parentVariant,
            action: parentAction,
          },
          size,
          class: className,
        })}
        ref={ref}
      />
    );
  },
);

type IButtonGroupProps = React.ComponentPropsWithoutRef<typeof UIButton.Group> & VariantProps<typeof buttonGroupStyle>;

const ButtonGroup = React.forwardRef<React.ElementRef<typeof UIButton.Group>, IButtonGroupProps>(
  ({ className, space = "md", isAttached = false, flexDirection = "column", ...props }, ref) => {
    return (
      <UIButton.Group
        className={buttonGroupStyle({
          class: className,
          space,
          isAttached,
          flexDirection,
        })}
        {...props}
        ref={ref}
      />
    );
  },
);

type IButtonOuterProps = ViewProps & VariantProps<typeof boxStyle> & { className?: string };

const ButtonOuter = React.forwardRef<React.ElementRef<typeof View>, IButtonOuterProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        {...props}
        className={twMerge(IS_ANDROID_RIPPLE_ENABLED ? "rounded-lg overflow-hidden" : "", className)}
      />
    );
  },
);

type IButtonMonIcon = React.ComponentPropsWithoutRef<typeof View> &
  VariantProps<typeof buttonMonIconStyle> & {
    className?: string | undefined;
    name: string;
    size?: number;
  };

const ButtonMonIcon = React.forwardRef<React.ElementRef<typeof View>, IButtonMonIcon>(
  ({ className, name, size = 16, ...props }, ref) => {
    const { variant: parentVariant, action: parentAction } = useStyleContext(SCOPE);

    return (
      <View
        {...props}
        style={{ width: size, height: size }}
        className={buttonMonIconStyle({
          parentVariants: {
            variant: parentVariant,
            action: parentAction,
          },
          class: className,
        })}
        ref={ref}
      >
        <Icon
          name={name}
          size={size}
          className={buttonMonIconInternalStyle({
            parentVariants: {
              variant: parentVariant,
              action: parentAction,
            },
            class: className,
          })}
        />
      </View>
    );
  },
);

Button.displayName = "Button";
ButtonText.displayName = "ButtonText";
ButtonSpinner.displayName = "ButtonSpinner";
ButtonIcon.displayName = "ButtonIcon";
ButtonGroup.displayName = "ButtonGroup";
ButtonOuter.displayName = "ButtonOuter";
ButtonMonIcon.displayName = "ButtonMonIcon";

export { Button, ButtonText, ButtonSpinner, ButtonIcon, ButtonGroup, ButtonOuter, ButtonMonIcon };
