import React from "react";
import { StyleSheet } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import { UserTheme } from "~/features/theme/types";

import { YuruChara } from "../yuru-chara";

const mockGetThemeAsset = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
let mockThemes: UserTheme[] = [];
let mockWindowSize = { width: 390, height: 844 };

jest.mock("~/assets/images/bg-corner-classic.svg", () => {
  const React = require("react");
  const { View } = require("react-native");
  return (props: Record<string, unknown>) => <View {...props} testID="bg-corner-classic" />;
});
jest.mock("~/assets/images/bg-corner-red.svg", () => {
  const React = require("react");
  const { View } = require("react-native");
  return (props: Record<string, unknown>) => <View {...props} testID="bg-corner-red" />;
});
jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: (props: Record<string, unknown>) => <View {...props} testID="theme-yuru-image" />,
  };
});
jest.mock("~/features/theme/storage", () => ({
  themeStorage: {
    listThemes: jest.fn(),
    saveTheme: jest.fn(),
    deleteTheme: jest.fn(),
    getThemeAsset: (...args: unknown[]) => mockGetThemeAsset(...args),
  },
}));
jest.mock("~/features/theme/registry", () => {
  const actual = jest.requireActual("~/features/theme/registry");
  return {
    ...actual,
    useThemeRegistry: (selector: (state: { themes: UserTheme[]; loaded: boolean }) => unknown) =>
      selector({ themes: mockThemes, loaded: true }),
  };
});

let mockTheme = "classic";

jest.mock("~/features/config", () => ({
  useAppearanceConfig: () => ({ theme: mockTheme, showYuruChara: true }),
}));
jest.mock("~/hooks/useWindowSize", () => ({
  useWindowSize: () => mockWindowSize,
}));

const palette: UserTheme["palette"] = {
  primary: {
    "50": "#f0fdfa",
    "100": "#ccfbf1",
    "200": "#99f6e4",
    "300": "#5eead4",
    "400": "#2dd4bf",
    "500": "#14b8a6",
    "600": "#0d9488",
    "700": "#0f766e",
    "800": "#115e59",
    "900": "#134e4a",
    "950": "#042f2e",
  },
  accent: {
    "50": "#eff6ff",
    "100": "#dbeafe",
    "200": "#bfdbfe",
    "300": "#93c5fd",
    "400": "#60a5fa",
    "500": "#3b82f6",
    "600": "#2563eb",
    "700": "#1d4ed8",
    "800": "#1e40af",
    "900": "#1e3a8a",
    "950": "#172554",
  },
};

function createUserTheme(theme: Partial<UserTheme>): UserTheme {
  return {
    id: "mint",
    name: "Mint",
    version: 1,
    baseTheme: "classic",
    palette,
    createdAt: 1,
    updatedAt: 1,
    ...theme,
  };
}

describe("YuruChara", () => {
  beforeEach(() => {
    mockTheme = "classic";
    mockThemes = [];
    mockWindowSize = { width: 390, height: 844 };
    mockGetThemeAsset.mockReset().mockResolvedValue(null);
    mockCreateObjectURL.mockReset().mockReturnValue("blob:theme-yuru");
    mockRevokeObjectURL.mockReset();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: mockCreateObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: mockRevokeObjectURL,
    });
  });

  it("renders the built-in classic mascot for the classic theme", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<YuruChara />);
    });

    expect(renderer.root.findByProps({ testID: "bg-corner-classic" }).props).toMatchObject({
      width: "240px",
      height: "240px",
    });
  });

  it("renders the built-in red mascot for the red theme", async () => {
    mockTheme = "red";

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<YuruChara />);
    });

    expect(renderer.root.findByProps({ testID: "bg-corner-red" }).props).toMatchObject({
      width: "240px",
      height: "240px",
    });
    expect(renderer.root.findAllByProps({ testID: "bg-corner-classic" })).toHaveLength(0);
  });

  it("renders a user theme mascot from the stored asset and layout", async () => {
    const userTheme = createUserTheme({
      yuruChara: {
        imageAssetId: "asset-1",
        imageWidth: 800,
        imageHeight: 600,
        align: "left",
        verticalAlign: "top",
        originalScale: 100,
        opacity: 0.625,
        offsetX: 7,
        offsetY: -3,
      },
    });
    mockTheme = "user:mint";
    mockThemes = [userTheme];
    mockGetThemeAsset.mockResolvedValue({
      id: "asset-1",
      themeId: "mint",
      fileName: "yuru-chara.png",
      mimeType: "image/png",
      uri: "file://theme/yuru-chara.png",
    });

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<YuruChara />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const image = renderer.root.findByProps({ testID: "theme-yuru-image" });
    expect(mockGetThemeAsset).toHaveBeenCalledWith(userTheme);
    expect(image.props).toMatchObject({
      source: { uri: "file://theme/yuru-chara.png" },
      contentFit: "fill",
    });
    expect(StyleSheet.flatten(image.props.style)).toMatchObject({ opacity: 0.625 });
    const container = renderer.toJSON();
    expect(container && !Array.isArray(container) ? StyleSheet.flatten(container.props.style) : null).toMatchObject({
      position: "absolute",
      width: 800,
      height: 600,
      left: 0,
      top: 0,
      transform: [{ translateX: 7 }, { translateY: -3 }],
    });
  });

  it("sizes original user theme mascots from intrinsic dimensions and scale", async () => {
    const userTheme = createUserTheme({
      yuruChara: {
        imageAssetId: "asset-1",
        imageWidth: 800,
        imageHeight: 600,
        align: "center",
        verticalAlign: "center",
        originalScale: 25,
        opacity: 0.4,
        offsetX: 0,
        offsetY: 0,
      },
    });
    mockTheme = "user:mint";
    mockThemes = [userTheme];
    mockGetThemeAsset.mockResolvedValue({
      id: "asset-1",
      themeId: "mint",
      fileName: "yuru-chara.png",
      mimeType: "image/png",
      uri: "file://theme/yuru-chara.png",
    });

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<YuruChara />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(renderer.root.findByProps({ testID: "theme-yuru-image" }).props.contentFit).toBe("fill");
    const container = renderer.toJSON();
    expect(container && !Array.isArray(container) ? StyleSheet.flatten(container.props.style) : null).toMatchObject({
      width: 200,
      height: 150,
      left: "50%",
      top: "50%",
      marginLeft: -100,
      marginTop: -75,
    });
  });

  it("uses loaded image dimensions for original user theme mascots with missing stored dimensions", async () => {
    const userTheme = createUserTheme({
      yuruChara: {
        imageAssetId: "asset-1",
        imageWidth: 0,
        imageHeight: 0,
        align: "center",
        verticalAlign: "center",
        originalScale: 25,
        opacity: 0.4,
        offsetX: 0,
        offsetY: 0,
      },
    });
    mockTheme = "user:mint";
    mockThemes = [userTheme];
    mockGetThemeAsset.mockResolvedValue({
      id: "asset-1",
      themeId: "mint",
      fileName: "yuru-chara.png",
      mimeType: "image/png",
      uri: "file://theme/yuru-chara.png",
    });

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<YuruChara />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      renderer.root.findByProps({ testID: "theme-yuru-image" }).props.onLoad({ source: { width: 800, height: 600 } });
    });

    const container = renderer.toJSON();
    expect(container && !Array.isArray(container) ? StyleSheet.flatten(container.props.style) : null).toMatchObject({
      width: 200,
      height: 150,
      marginLeft: -100,
      marginTop: -75,
    });
  });

  it("creates and revokes an object URL for web blob assets", async () => {
    const blob = new Blob(["theme image"], { type: "image/png" });
    const userTheme = createUserTheme({
      yuruChara: {
        imageAssetId: "asset-1",
        imageWidth: 800,
        imageHeight: 600,
        align: "right",
        verticalAlign: "bottom",
        originalScale: 100,
        opacity: 0.4,
        offsetX: 0,
        offsetY: 0,
      },
    });
    mockTheme = "user:mint";
    mockThemes = [userTheme];
    mockGetThemeAsset.mockResolvedValue({
      id: "asset-1",
      themeId: "mint",
      fileName: "yuru-chara.png",
      mimeType: "image/png",
      blob,
    });

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<YuruChara />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
    expect(renderer.root.findByProps({ testID: "theme-yuru-image" }).props.source).toEqual({ uri: "blob:theme-yuru" });

    await act(async () => {
      renderer.unmount();
    });

    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:theme-yuru");
  });

  it("renders nothing when a selected user theme is not resolved from the registry", async () => {
    mockTheme = "user:missing";
    mockThemes = [];

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<YuruChara />);
    });

    expect(renderer.toJSON()).toBeNull();
  });

  it("renders nothing for a user theme without an image asset", async () => {
    mockTheme = "user:plain";
    mockThemes = [createUserTheme({ id: "plain", yuruChara: undefined })];

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<YuruChara />);
    });

    expect(renderer.toJSON()).toBeNull();
  });
});
