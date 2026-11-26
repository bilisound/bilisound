import type React from "react";
import { styled } from "nativewind";

/**
 * `styled(Component, { className: "style" })` that keeps the component's own prop types.
 *
 * styled() derives every dot-path of the props for type checking; for Reanimated and
 * legend-motion components that union is too large for TypeScript to represent.
 */
export function withClassName<P>(Component: React.ComponentType<P>) {
  return styled(Component as React.ComponentType<{ style?: unknown }>, {
    className: "style",
  }) as unknown as React.ComponentType<P & { className?: string }>;
}
