import React from "react";
import { Button, ButtonOuter } from "~/components/ui/button";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { Pressable } from "~/components/ui/pressable";
import { twMerge } from "tailwind-merge";
import { Icon } from "~/components/icon";

export interface LayoutButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  iconSize?: number;
  iconName: string;
  className?: string;
}

export const LayoutButton = ({
  iconSize = 20,
  iconName,
  className,
  ref,
  ...props
}: LayoutButtonProps & { ref?: React.Ref<React.ElementRef<typeof Button>> }) => {
  const { colorValue } = useRawThemeValues();

  return (
    <ButtonOuter>
      <Pressable
        {...props}
        className={twMerge("w-[2.75rem] h-[2.75rem] rounded-lg px-0 items-center justify-center", className)}
        ref={ref}
      >
        <Icon size={iconSize} color={colorValue("--color-primary-500")} name={iconName} />
      </Pressable>
    </ButtonOuter>
  );
};

LayoutButton.displayName = "LayoutButton";
