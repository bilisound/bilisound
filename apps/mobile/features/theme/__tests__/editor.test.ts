import { generateTailwindScale } from "../color-scale";
import {
  buildSavedUserTheme,
  clampOriginalScale,
  clampYuruCharaOpacity,
  createYuruCharaRemovalDraft,
  createYuruCharaUploadDraft,
  getMinOriginalScaleForOnePixel,
  getYuruCharaAssetId,
  getYuruCharaRenderMetrics,
  removeYuruCharaFromTheme,
  withYuruCharaDefaults,
} from "../editor";
import type { ThemeAsset, UserTheme } from "../types";

const baseTheme: UserTheme = {
  id: "theme-1",
  name: "Old name",
  version: 1,
  baseTheme: "classic",
  palette: {
    primary: generateTailwindScale("#14b8a6"),
    accent: generateTailwindScale("#3b82f6"),
  },
  createdAt: 100,
  updatedAt: 200,
};

describe("theme editor helpers", () => {
  it("builds a saved user theme from editable name and base colors", () => {
    const saved = buildSavedUserTheme(baseTheme, {
      name: "New name",
      primaryBase: "#ef4444",
      accentBase: "#a855f7",
      updatedAt: 300,
    });

    expect(saved).toMatchObject({
      id: "theme-1",
      name: "New name",
      version: 1,
      baseTheme: "classic",
      createdAt: 100,
      updatedAt: 300,
    });
    expect(saved.palette.primary["500"]).toBe("#ef4444");
    expect(saved.palette.accent["500"]).toBe("#a855f7");
  });

  it("trims theme names before saving", () => {
    const saved = buildSavedUserTheme(baseTheme, {
      name: "  New name  ",
      primaryBase: "#ef4444",
      accentBase: "#a855f7",
      updatedAt: 300,
    });

    expect(saved.name).toBe("New name");
  });

  it("rejects names that theme package import would reject", () => {
    expect(() =>
      buildSavedUserTheme(baseTheme, {
        name: "   ",
        primaryBase: "#ef4444",
        accentBase: "#a855f7",
        updatedAt: 300,
      }),
    ).toThrow("Theme name is required");

    expect(() =>
      buildSavedUserTheme(baseTheme, {
        name: "a".repeat(81),
        primaryBase: "#ef4444",
        accentBase: "#a855f7",
        updatedAt: 300,
      }),
    ).toThrow("Theme name must be at most 80 characters");
  });

  it("uses a stable yuru-chara asset id per theme", () => {
    expect(getYuruCharaAssetId("mint")).toBe("mint-yuru-chara");
    expect(getYuruCharaAssetId("user:mint")).toBe("user:mint-yuru-chara");
  });

  it("adds a revision to replacement yuru-chara asset ids", () => {
    expect(getYuruCharaAssetId("mint", 123)).toBe("mint-yuru-chara-123");
  });

  it("removes yuru-chara layout and extracted colors without changing the palette", () => {
    const themeWithYuruChara: UserTheme = {
      ...baseTheme,
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
        extractedColors: ["#986846", "#bcbac6"],
      },
    };

    const updated = removeYuruCharaFromTheme(themeWithYuruChara, 300);

    expect(updated.yuruChara).toBeUndefined();
    expect(updated.palette).toBe(themeWithYuruChara.palette);
    expect(updated.updatedAt).toBe(300);
  });

  it("creates a yuru-chara removal draft without marking the theme saved", () => {
    const themeWithYuruChara: UserTheme = {
      ...baseTheme,
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
        extractedColors: ["#986846", "#bcbac6"],
      },
    };

    const draft = createYuruCharaRemovalDraft(themeWithYuruChara);

    expect(draft.yuruChara).toBeUndefined();
    expect(draft.updatedAt).toBe(themeWithYuruChara.updatedAt);
    expect(draft.palette).toBe(themeWithYuruChara.palette);
  });

  it("creates a yuru-chara upload draft without marking the theme saved", () => {
    const draft = createYuruCharaUploadDraft(
      {
        ...baseTheme,
        yuruChara: {
          imageAssetId: "asset-1",
          imageWidth: 800,
          imageHeight: 600,
          align: "left",
          verticalAlign: "top",
          originalScale: 125,
          opacity: 0.625,
          offsetX: 12,
          offsetY: -8,
          extractedColors: ["#986846"],
        },
      },
      {
        assetId: "asset-2",
        imageSize: { width: 1200, height: 900 },
        extractedColors: ["#111111", "#222222"],
      },
    );

    expect(draft.updatedAt).toBe(baseTheme.updatedAt);
    expect(draft.palette).toBe(baseTheme.palette);
    expect(draft.yuruChara).toEqual({
      imageAssetId: "asset-2",
      imageWidth: 1200,
      imageHeight: 900,
      align: "left",
      verticalAlign: "top",
      originalScale: 100,
      opacity: 0.625,
      offsetX: 12,
      offsetY: -8,
      extractedColors: ["#111111", "#222222"],
    });
  });

  it("preserves existing yuru-chara values while filling missing layout defaults", () => {
    const layout = withYuruCharaDefaults(
      {
        ...baseTheme,
        yuruChara: {
          imageAssetId: "asset-1",
          align: "left",
          verticalAlign: "top",
          imageWidth: 800,
          imageHeight: 600,
          originalScale: 125,
          opacity: 0.625,
          offsetX: 12,
          offsetY: -8,
        },
      },
      { align: "right" },
    );

    expect(layout).toEqual({
      imageAssetId: "asset-1",
      align: "right",
      verticalAlign: "top",
      imageWidth: 800,
      imageHeight: 600,
      originalScale: 125,
      opacity: 0.625,
      offsetX: 12,
      offsetY: -8,
    });
  });

  it("uses default yuru-chara layout values for a new image", () => {
    const layout = withYuruCharaDefaults(baseTheme, { imageAssetId: "asset-2" });

    expect(layout).toEqual({
      imageAssetId: "asset-2",
      align: "right",
      verticalAlign: "bottom",
      imageWidth: 0,
      imageHeight: 0,
      originalScale: 100,
      opacity: 0.4,
      offsetX: 0,
      offsetY: 0,
    });
    expect(layout).not.toHaveProperty("size");
  });

  it("rounds yuru-chara opacity to 0.005 precision within the slider range", () => {
    expect(clampYuruCharaOpacity(0.627)).toBe(0.625);
    expect(clampYuruCharaOpacity(2)).toBe(1);
    expect(clampYuruCharaOpacity(-1)).toBe(0);
    expect(clampYuruCharaOpacity(Number.NaN)).toBe(0.4);
  });

  it("computes original yuru-chara size from intrinsic dimensions and percent scale", () => {
    const metrics = getYuruCharaRenderMetrics(
      {
        imageAssetId: "asset-1",
        align: "center",
        verticalAlign: "center",
        imageWidth: 800,
        imageHeight: 600,
        originalScale: 25,
        opacity: 0.4,
        offsetX: 0,
        offsetY: 0,
      },
      { width: 390, height: 844 },
    );

    expect(metrics).toEqual({ width: 200, height: 150, contentFit: "fill", usesFullscreenFrame: false });
  });

  it("allows yuru-chara scale down to one rendered pixel", () => {
    expect(getMinOriginalScaleForOnePixel(800, 600)).toBe(0.125);
    expect(clampOriginalScale(0.01, getMinOriginalScaleForOnePixel(800, 600))).toBe(0.125);

    const metrics = getYuruCharaRenderMetrics(
      {
        imageAssetId: "asset-1",
        align: "center",
        verticalAlign: "center",
        imageWidth: 800,
        imageHeight: 600,
        originalScale: 0.01,
        opacity: 0.4,
        offsetX: 0,
        offsetY: 0,
      },
      { width: 390, height: 844 },
    );

    expect(metrics).toEqual({ width: 1, height: 1, contentFit: "fill", usesFullscreenFrame: false });
  });

  it("uses loaded image dimensions when stored original dimensions are missing", () => {
    const metrics = getYuruCharaRenderMetrics(
      {
        imageAssetId: "asset-1",
        align: "center",
        verticalAlign: "center",
        imageWidth: 0,
        imageHeight: 0,
        originalScale: 33,
        opacity: 0.4,
        offsetX: 0,
        offsetY: 0,
      },
      { width: 390, height: 844 },
      { width: 4000, height: 5000 },
    );

    expect(metrics).toEqual({ width: 1320, height: 1650, contentFit: "fill", usesFullscreenFrame: false });
  });

  it("creates a disposable preview URL for web blob assets", () => {
    const { createThemeAssetPreview } = jest.requireActual("../editor") as {
      createThemeAssetPreview?: (
        asset: Pick<ThemeAsset, "uri" | "blob"> | null | undefined,
        createObjectURL: (blob: Blob) => string,
        revokeObjectURL: (url: string) => void,
      ) => { uri: string | null; dispose: () => void };
    };

    if (typeof createThemeAssetPreview !== "function") {
      expect(createThemeAssetPreview).toBeDefined();
      return;
    }

    const blob = new Blob(["preview"], { type: "image/png" });
    const createObjectURL = jest.fn().mockReturnValue("blob:preview");
    const revokeObjectURL = jest.fn();
    const preview = createThemeAssetPreview({ blob }, createObjectURL, revokeObjectURL);

    expect(preview.uri).toBe("blob:preview");
    expect(createObjectURL).toHaveBeenCalledWith(blob);

    preview.dispose();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("uses stored uri previews without requiring object URL support", () => {
    const { createThemeAssetPreview } = jest.requireActual("../editor") as {
      createThemeAssetPreview: (asset: Pick<ThemeAsset, "uri" | "blob"> | null | undefined) => {
        uri: string | null;
        dispose: () => void;
      };
    };
    const originalCreateObjectURL = URL.createObjectURL;

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: undefined,
    });

    try {
      const preview = createThemeAssetPreview({ uri: "file://theme/yuru-chara.png" });

      expect(preview.uri).toBe("file://theme/yuru-chara.png");
      expect(preview.dispose()).toBeUndefined();
    } finally {
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: originalCreateObjectURL,
      });
    }
  });
});
