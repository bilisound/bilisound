import type { SvgProps } from "react-native-svg";
import { useTheme } from "@tamagui/core";

import { iconMap } from "./icon-map.generated";
import type { IconName } from "./icon-map.generated";
export type { IconName } from "./icon-map.generated";

export interface IconProps extends Omit<SvgProps, "height" | "width"> {
  name: IconName;
  size?: number;
}

export function Icon({ color, name, size = 24, ...props }: IconProps) {
  const theme = useTheme();
  const SvgIcon = iconMap[name];

  return <SvgIcon width={size} height={size} color={color ?? theme.text.get()} {...props} />;
}
