import type React from "react";
import { UIIcon } from "@gluestack-ui/core/icon/creator";
import { styled } from "nativewind";

// PrimitiveIcon reads `classNameColor` at runtime but UIIcon's public type omits it.
type UIIconProps = React.ComponentProps<typeof UIIcon> & { classNameColor?: string };

/**
 * UIIcon with className support. Size and SVG paint come from className, and the
 * text color is routed to `classNameColor` so an explicit `color` prop still wins
 * inside PrimitiveIcon.
 */
export const StyledUIIcon = styled(UIIcon as React.ComponentType<UIIconProps>, {
  className: {
    target: "style",
    nativeStyleMapping: {
      height: true,
      width: true,
      fill: true,
      color: "classNameColor",
      stroke: true,
    },
  },
});
