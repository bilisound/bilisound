import React from "react";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { textStyle } from "./styles";
import { normalizeWebTextStyle } from "./web-style";

type ITextProps = React.ComponentProps<"span"> & VariantProps<typeof textStyle> & { selectable: any };

const Text = React.forwardRef<React.ElementRef<"span">, ITextProps>(
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
      style,
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
        {...props}
        ref={ref}
      />
    );
  },
);

Text.displayName = "Text";

export { Text };
