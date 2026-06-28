import React from "react";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { textStyle } from "./styles";
import { normalizeWebTextStyle } from "./web-style";

type NativeAccessibilityProps = {
  accessible?: boolean;
  accessibilityElementsHidden?: boolean;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  accessibilityRole?: unknown;
  accessibilityState?: unknown;
  importantForAccessibility?: unknown;
};

type ITextProps = React.ComponentProps<"span"> &
  VariantProps<typeof textStyle> & { selectable?: any } & NativeAccessibilityProps;

const Text = React.forwardRef<React.ComponentRef<"span">, ITextProps>(
  (
    {
      className,
      isTruncated,
      bold,
      underline,
      strikeThrough,
      size = "md",
      sub,
      italic,
      highlight,
      selectable, // 在 Web 端过滤掉这个属性
      accessible,
      accessibilityElementsHidden,
      accessibilityHint,
      accessibilityLabel,
      accessibilityRole,
      accessibilityState,
      importantForAccessibility,
      style,
      "aria-label": ariaLabel,
      ...props
    }: { className?: string } & ITextProps,
    ref,
  ) => {
    return (
      <span
        className={textStyle({
          isTruncated,
          bold,
          underline,
          strikeThrough,
          size,
          sub,
          italic,
          highlight,
          class: className,
        })}
        style={normalizeWebTextStyle(style)}
        aria-label={ariaLabel ?? accessibilityLabel}
        {...props}
        ref={ref}
      />
    );
  },
);

Text.displayName = "Text";

export { Text };
