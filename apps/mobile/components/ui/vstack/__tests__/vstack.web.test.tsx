/// <reference types="jest" />
import React from "react";

import { VStack } from "../index.web";

jest.mock("../styles", () => ({
  vstackStyle: () => "vstack-class",
}));

function renderVStackElement(props: React.ComponentProps<typeof VStack>) {
  return (
    VStack as unknown as {
      render: (
        props: React.ComponentProps<typeof VStack>,
        ref: React.Ref<React.ComponentRef<typeof VStack>> | null,
      ) => React.ReactElement<Record<string, unknown>>;
    }
  ).render(props, null);
}

describe("web VStack", () => {
  it("flattens React Native style arrays before rendering a div", () => {
    const element = renderVStackElement({
      style: [{ padding: 16 }, false, { flexDirection: "row" }] as React.ComponentProps<typeof VStack>["style"],
      children: "content",
    });

    expect(element.type).toBe("div");
    expect(element.props.style).toEqual({
      padding: 16,
      flexDirection: "row",
    });
  });
});
