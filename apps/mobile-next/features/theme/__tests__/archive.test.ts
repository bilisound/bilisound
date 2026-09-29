import type { ThemeAsset, UserTheme } from "../types";

const primaryScale = {
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
};

const accentScale = {
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
};

const sampleTheme: UserTheme = {
  id: "user:mint",
  name: "Mint",
  version: 1,
  baseTheme: "classic",
  createdAt: 1,
  updatedAt: 2,
  palette: {
    primary: primaryScale,
    accent: accentScale,
  },
  yuruChara: {
    imageAssetId: "asset-1",
    imageWidth: 480,
    imageHeight: 360,
    align: "right",
    verticalAlign: "bottom",
    originalScale: 100,
    opacity: 0.4,
    offsetX: 12,
    offsetY: -8,
    extractedColors: ["#986846", "#bcbac6", "#f59947"],
  },
};

const files = new Map<string, string>();

const mockFileSystem = {
  cacheDirectory: "cache://",
  makeDirectoryAsync: jest.fn(async () => undefined),
  readAsStringAsync: jest.fn(async (uri: string) => files.get(uri) ?? ""),
  getInfoAsync: jest.fn(async (uri: string) => ({ exists: files.has(uri) })),
  writeAsStringAsync: jest.fn(async (uri: string, value: string) => {
    files.set(uri, value);
  }),
  copyAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
    files.set(to, files.get(from) ?? "");
  }),
};

const mockZipArchive = {
  unzip: jest.fn(async () => "cache://theme-import-1"),
  zip: jest.fn(async () => "cache://user:mint.zip"),
};

jest.mock("expo-file-system/legacy", () => mockFileSystem);
jest.mock("react-native-zip-archive", () => mockZipArchive);

describe("theme archive native", () => {
  beforeEach(() => {
    files.clear();
    jest.clearAllMocks();
  });

  it("imports an extracted manifest and image asset", async () => {
    const { importThemePackage } = require("../archive") as typeof import("../archive");
    files.set(
      "cache://theme-import-1/theme.json",
      JSON.stringify({
        kind: "moe.bilisound.app.theme",
        version: 1,
        name: "Mint Imported",
        baseTheme: "classic",
        palette: sampleTheme.palette,
        yuruChara: {
          image: "corner.jpg",
          imageWidth: 1024,
          imageHeight: 768,
          align: "left",
          verticalAlign: "top",
          originalScale: 100,
          opacity: 0.625,
          offsetX: 1,
          offsetY: 2,
          extractedColors: ["#986846", "#bcbac6"],
        },
      }),
    );
    files.set("cache://theme-import-1/corner.jpg", "jpeg");

    const imported = await importThemePackage({ uri: "file://theme.zip" });

    expect(mockZipArchive.unzip).toHaveBeenCalledWith(
      "file://theme.zip",
      expect.stringMatching(/^cache:\/\/theme-import-/),
    );
    expect(imported.manifest.name).toBe("Mint Imported");
    expect(imported.manifest.yuruChara?.extractedColors).toEqual(["#986846", "#bcbac6"]);
    expect(imported.asset).toEqual({
      fileName: "corner.jpg",
      mimeType: "image/jpeg",
      uri: "cache://theme-import-1/corner.jpg",
    });
  });

  it("converts an Android extraction path to a file URI", async () => {
    const { importThemePackage } = require("../archive") as typeof import("../archive");
    mockZipArchive.unzip.mockResolvedValueOnce("/data/user/0/moe.bilisound.app.dev/cache/theme-import-1");
    files.set(
      "file:///data/user/0/moe.bilisound.app.dev/cache/theme-import-1/theme.json",
      JSON.stringify({
        kind: "moe.bilisound.app.theme",
        version: 1,
        name: "Android Imported",
        baseTheme: "classic",
        palette: sampleTheme.palette,
      }),
    );

    const imported = await importThemePackage({ uri: "content://theme.zip" });

    expect(mockFileSystem.readAsStringAsync).toHaveBeenCalledWith(
      "file:///data/user/0/moe.bilisound.app.dev/cache/theme-import-1/theme.json",
      { encoding: "utf8" },
    );
    expect(imported.manifest.name).toBe("Android Imported");
  });

  it("exports a work directory as a zip package", async () => {
    const { exportThemePackage } = require("../archive") as typeof import("../archive");
    const asset: ThemeAsset = {
      id: "asset-1",
      themeId: "user:mint",
      fileName: "yuru-chara.png",
      mimeType: "image/png",
      uri: "file://asset.png",
    };
    files.set("file://asset.png", "image");

    const output = await exportThemePackage(sampleTheme, asset);
    const manifestUri = [...files.keys()].find(uri => uri.endsWith("/theme.json"));
    const manifest = JSON.parse(files.get(manifestUri ?? "") ?? "null");

    expect(output).toEqual({ uri: "cache://user:mint.zip", mimeType: "application/zip", fileName: "Mint.zip" });
    expect(manifest.yuruChara).toMatchObject({
      image: "yuru-chara.png",
      imageWidth: 480,
      imageHeight: 360,
      align: "right",
      verticalAlign: "bottom",
      originalScale: 100,
      opacity: 0.4,
      offsetX: 12,
      offsetY: -8,
      extractedColors: ["#986846", "#bcbac6", "#f59947"],
    });
    expect(manifest.yuruChara.imageAssetId).toBeUndefined();
    expect(mockFileSystem.copyAsync).toHaveBeenCalledWith({
      from: "file://asset.png",
      to: expect.stringMatching(/\/yuru-chara\.png$/),
    });
    expect(mockZipArchive.zip).toHaveBeenCalledWith(
      expect.stringMatching(/^cache:\/\/theme-export-/),
      "cache://user:mint.zip",
    );
  });

  it("normalizes exported manifest names", async () => {
    const { exportThemePackage } = require("../archive") as typeof import("../archive");

    const output = await exportThemePackage({ ...sampleTheme, name: "  Mint  " });
    const manifestUri = [...files.keys()].find(uri => uri.endsWith("/theme.json"));
    const manifest = JSON.parse(files.get(manifestUri ?? "") ?? "null");

    expect(manifest.name).toBe("Mint");
    expect(output.fileName).toBe("Mint.zip");
  });

  it("rejects exported manifest names that imports would reject", async () => {
    const { exportThemePackage } = require("../archive") as typeof import("../archive");

    await expect(exportThemePackage({ ...sampleTheme, name: "   " })).rejects.toThrow();
  });
});
