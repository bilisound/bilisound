import React from "react";
import { StyleSheet } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import { withYuruCharaDefaults } from "~/features/theme/editor";
import type { UserTheme } from "~/features/theme/types";

import { EDITOR_MASCOT_PORTAL_HOST, EditorMascotBackground } from "../editor-mascot-background";

const mockWindowSize = { width: 390, height: 844 };

jest.mock(
  "@gorhom/portal",
  () => {
    const React = require("react");
    const { View } = require("react-native");
    return {
      Portal: ({ children, hostName }: { children: React.ReactNode; hostName?: string }) => (
        <View testID="editor-mascot-portal" hostName={hostName}>
          {children}
        </View>
      ),
    };
  },
  { virtual: true },
);
jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: (props: Record<string, unknown>) => <View {...props} testID="editor-mascot-image" />,
  };
});
jest.mock("~/hooks/useWindowSize", () => ({
  useWindowSize: () => mockWindowSize,
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");

  function createGestureMock() {
    const mock = {
      minDistance: () => mock,
      maxPointers: () => mock,
      onStart: () => mock,
      onChange: () => mock,
      onEnd: () => mock,
    };
    return mock;
  }

  return {
    Gesture: {
      Pan: createGestureMock,
      Pinch: createGestureMock,
      Simultaneous: () => ({}),
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) => <View testID="gesture-detector">{children}</View>,
  };
});
jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: {
    View: require("react-native").View,
  },
  useSharedValue: (initial: number) => ({ value: initial }),
  useAnimatedStyle: (factory: () => Record<string, unknown>) => factory(),
  runOnJS: (fn: unknown) => fn,
}));
jest.mock("~/components/ui/button", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  function Button({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
    return (
      <Pressable testID="mock-button" onPress={onPress}>
        {children}
      </Pressable>
    );
  }

  return {
    Button,
    ButtonMonIcon: () => <View testID="mock-button-icon" />,
    ButtonOuter: ({ children }: { children: React.ReactNode }) => <View testID="mock-button-outer">{children}</View>,
    ButtonText: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
  };
});
jest.mock("~/components/ui/text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { Text: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text> };
});

describe("EditorMascotBackground", () => {
  it("renders above the editor through a portal using original image dimensions", async () => {
    const layout = withYuruCharaDefaults({} as UserTheme, { imageWidth: 800, imageHeight: 600, opacity: 0.625 });
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<EditorMascotBackground layout={layout} uri="file://theme/yuru-chara.png" />);
    });

    const portal = renderer.root.findByProps({ testID: "editor-mascot-portal" });
    expect(portal.props.hostName).toBe(EDITOR_MASCOT_PORTAL_HOST);
    const overlay = portal.props.children;
    expect(overlay.props.pointerEvents).toBe("none");
    expect(overlay.props.className).toBe("absolute inset-0 z-[100]");
    expect(StyleSheet.flatten(overlay.props.style)).toMatchObject({ elevation: 100 });

    const image = renderer.root.findByProps({ testID: "editor-mascot-image" });
    expect(image.props).toMatchObject({
      source: { uri: "file://theme/yuru-chara.png" },
      contentFit: "fill",
    });
    const frame = renderer.root.findAll(node => StyleSheet.flatten(node.props.style)?.width === 800)[0];
    expect(frame.props.className).toContain("absolute z-10");
    expect(frame.props.className).toContain("right-0");
    expect(frame.props.className).toContain("bottom-0");
    expect(StyleSheet.flatten(frame.props.style)).toMatchObject({
      width: 800,
      height: 600,
    });
    expect(image.props.className).toBe("h-full w-full");
    expect(StyleSheet.flatten(image.props.style)).toMatchObject({ opacity: 0.625 });
    expect(renderer.root.findAllByProps({ testID: "editor-mascot-edit-hint" })).toHaveLength(0);
  });

  it("enters editable mode with gesture detector and edit controls", async () => {
    const layout = withYuruCharaDefaults({} as UserTheme, {
      align: "right",
      verticalAlign: "bottom",
      opacity: 0.625,
    });
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <EditorMascotBackground
          layout={layout}
          uri="file://theme/yuru-chara.png"
          editable
          onCancel={jest.fn()}
          onReset={jest.fn()}
        />,
      );
    });

    const portal = renderer.root.findByProps({ testID: "editor-mascot-portal" });
    const overlay = portal.props.children;
    expect(overlay.props.pointerEvents).toBe("auto");

    const gestureDetector = renderer.root.findByProps({ testID: "gesture-detector" });
    expect(gestureDetector).toBeTruthy();

    const anchorBadge = renderer.root.findByProps({ testID: "editor-mascot-anchor-badge" });
    expect(anchorBadge).toBeTruthy();

    const hint = renderer.root.findByProps({ testID: "editor-mascot-edit-hint" });
    expect(hint.props.pointerEvents).toBe("none");
    expect(renderer.root.findByProps({ children: "调整位置和大小" })).toBeTruthy();
    expect(renderer.root.findByProps({ children: "单指拖动，两指缩放" })).toBeTruthy();

    const buttons = renderer.root.findAllByProps({ testID: "mock-button" });
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
