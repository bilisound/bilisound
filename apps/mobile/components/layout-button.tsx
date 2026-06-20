import React from "react";
import { StyleSheet } from "react-native";
import { Button, ButtonOuter } from "~/components/ui/button";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { Pressable } from "~/components/ui/pressable";
import { Icon } from "~/components/icon";

export interface LayoutButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  iconSize?: number;
  iconName: string;
}

export const LayoutButton = ({
  iconSize = 20,
  iconName,
  ref,
  ...props
}: LayoutButtonProps & { ref?: React.Ref<React.ElementRef<typeof Button>> }) => {
  const { colorValue } = useRawThemeValues();

  return (
    <ButtonOuter>
      <Pressable {...props} style={styles.pressable} ref={ref}>
        <Icon size={iconSize} color={colorValue("--color-primary-500")} name={iconName} />
      </Pressable>
    </ButtonOuter>
  );
};

LayoutButton.displayName = "LayoutButton";

const styles = StyleSheet.create({
  pressable: {
    width: 44,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
