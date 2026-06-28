/// <reference types="jest" />
import React from "react";

jest.mock("../styles", () => ({
  textStyle: () => "text-class",
}));

import { Text } from "../index.web";
import { normalizeWebTextStyle } from "../web-style";

function renderTextElement(props: React.ComponentProps<typeof Text>) {
  return (
    Text as unknown as {
      render: (
        props: React.ComponentProps<typeof Text>,
        ref: React.Ref<React.ComponentRef<typeof Text>> | null,
      ) => React.ReactElement<Record<string, unknown>>;
    }
  ).render(props, null);
}

describe("web Text", () => {
  it("renders numeric lineHeight as px instead of a unitless CSS multiplier", () => {
    expect(normalizeWebTextStyle({ fontSize: 15, lineHeight: 22.5 })).toMatchObject({
      fontSize: 15,
      lineHeight: "22.5px",
    });
  });

  it("does not forward React Native accessibility props to the DOM", () => {
    const element = renderTextElement({
      accessible: true,
      accessibilityLabel: "设置",
      accessibilityRole: "header",
      role: "heading",
      children: "设置",
    });

    expect(element.type).toBe("span");
    expect(element.props).toMatchObject({
      "aria-label": "设置",
      role: "heading",
    });
    expect(element.props).not.toHaveProperty("accessible");
    expect(element.props).not.toHaveProperty("accessibilityLabel");
    expect(element.props).not.toHaveProperty("accessibilityRole");
  });
});
