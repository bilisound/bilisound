/// <reference types="jest" />

import { hexFromCssColor, normalizeThemeManifest, rgbStringFromCssColor } from "../package-schema";

const fullScale = {
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

describe("theme package schema", () => {
  it("normalizes a valid theme manifest", () => {
    const manifest = normalizeThemeManifest({
      kind: "moe.bilisound.app.theme",
      version: 1,
      name: "Mint Test",
      baseTheme: "classic",
      palette: {
        primary: fullScale,
        accent: fullScale,
        primaryBase: "rgb(20 184 166)",
        accentBase: "#0fa",
      },
      yuruChara: {
        image: "yuru-chara.png",
        imageWidth: 800,
        imageHeight: 600,
        align: "right",
        verticalAlign: "bottom",
        originalScale: 125,
        opacity: 0.625,
        offsetX: 12,
        offsetY: -8,
      },
    });

    expect(manifest.name).toBe("Mint Test");
    expect(manifest.baseTheme).toBe("classic");
    expect(manifest.palette.primary["500"]).toBe("#14b8a6");
    expect(manifest.palette.primaryBase).toBe("#14b8a6");
    expect(manifest.palette.accentBase).toBe("#00ffaa");
    expect(manifest.yuruChara?.image).toBe("yuru-chara.png");
    expect(manifest.yuruChara?.imageWidth).toBe(800);
    expect(manifest.yuruChara?.imageHeight).toBe(600);
    expect(manifest.yuruChara?.originalScale).toBe(125);
    expect(manifest.yuruChara?.opacity).toBe(0.625);
  });

  it("requires original image dimensions for yuru-chara manifests", () => {
    expect(() =>
      normalizeThemeManifest({
        kind: "moe.bilisound.app.theme",
        version: 1,
        name: "Broken",
        baseTheme: "classic",
        palette: {
          primary: fullScale,
          accent: fullScale,
        },
        yuruChara: {
          image: "yuru-chara.png",
          align: "right",
          verticalAlign: "bottom",
          originalScale: 100,
          opacity: 0.4,
          offsetX: 0,
          offsetY: 0,
        },
      }),
    ).toThrow();
  });

  it("allows sub-percent yuru-chara scale for one-pixel rendering", () => {
    const manifest = normalizeThemeManifest({
      kind: "moe.bilisound.app.theme",
      version: 1,
      name: "Tiny Mascot",
      baseTheme: "classic",
      palette: {
        primary: fullScale,
        accent: fullScale,
      },
      yuruChara: {
        image: "yuru-chara.png",
        imageWidth: 800,
        imageHeight: 600,
        align: "right",
        verticalAlign: "bottom",
        originalScale: 0.125,
        opacity: 0.625,
        offsetX: 12,
        offsetY: -8,
      },
    });

    expect(manifest.yuruChara?.originalScale).toBe(0.125);
  });

  it("rejects manifests with missing shades", () => {
    expect(() =>
      normalizeThemeManifest({
        kind: "moe.bilisound.app.theme",
        version: 1,
        name: "Broken",
        baseTheme: "classic",
        palette: {
          primary: { "500": "#14b8a6" },
          accent: fullScale,
        },
      }),
    ).toThrow();
  });

  it("normalizes CSS color values", () => {
    expect(hexFromCssColor("#0fa")).toBe("#00ffaa");
    expect(hexFromCssColor("rgb(20 184 166)")).toBe("#14b8a6");
    expect(rgbStringFromCssColor("#14b8a6")).toBe("20 184 166");
  });
});
