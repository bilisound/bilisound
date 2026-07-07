import JSZip from "jszip";

import { exportThemePackage, importThemePackage } from "../archive.web";
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

describe("theme archive web", () => {
  it("exports a zip with manifest and image asset", async () => {
    const asset: ThemeAsset = {
      id: "asset-1",
      themeId: "user:mint",
      fileName: "yuru-chara.png",
      mimeType: "image/png",
      blob: new TextEncoder().encode("image") as unknown as Blob,
    };

    const output = await exportThemePackage(sampleTheme, asset);
    const zip = await JSZip.loadAsync(await output.blob.arrayBuffer());
    const manifest = JSON.parse((await zip.file("theme.json")?.async("text")) ?? "null");

    expect(output).toMatchObject({ mimeType: "application/zip", fileName: "Mint.zip" });
    expect(manifest).toMatchObject({
      kind: "moe.bilisound.app.theme",
      version: 1,
      name: "Mint",
      baseTheme: "classic",
      palette: sampleTheme.palette,
      yuruChara: {
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
      },
    });
    expect(manifest.yuruChara.imageAssetId).toBeUndefined();
    await expect(zip.file("yuru-chara.png")?.async("text")).resolves.toBe("image");
  });

  it("normalizes exported manifest names", async () => {
    const output = await exportThemePackage({ ...sampleTheme, name: "  Mint  " });
    const zip = await JSZip.loadAsync(await output.blob.arrayBuffer());
    const manifest = JSON.parse((await zip.file("theme.json")?.async("text")) ?? "null");

    expect(manifest.name).toBe("Mint");
    expect(output.fileName).toBe("Mint.zip");
  });

  it("rejects exported manifest names that imports would reject", async () => {
    await expect(exportThemePackage({ ...sampleTheme, name: "   " })).rejects.toThrow();
  });

  it("imports the exact exported zip blob", async () => {
    const asset: ThemeAsset = {
      id: "asset-1",
      themeId: "user:mint",
      fileName: "yuru-chara.png",
      mimeType: "image/png",
      blob: new TextEncoder().encode("image") as unknown as Blob,
    };

    const exported = await exportThemePackage(sampleTheme, asset);
    const imported = await importThemePackage({ file: exported.blob });

    expect(imported.manifest.name).toBe(sampleTheme.name);
    expect(imported.manifest.palette).toEqual(sampleTheme.palette);
    expect(imported.manifest.yuruChara).toMatchObject({
      image: "yuru-chara.png",
      align: "right",
      verticalAlign: "bottom",
      opacity: 0.4,
      offsetX: 12,
      offsetY: -8,
      extractedColors: ["#986846", "#bcbac6", "#f59947"],
    });
    expect(imported.asset).toMatchObject({
      fileName: "yuru-chara.png",
      mimeType: "image/png",
    });
    expect(new TextDecoder().decode(await imported.asset!.blob!.arrayBuffer())).toBe("image");
  });

  it("imports a zip manifest and image asset", async () => {
    const zip = new JSZip();
    zip.file(
      "theme.json",
      JSON.stringify({
        kind: "moe.bilisound.app.theme",
        version: 1,
        name: "Mint Imported",
        baseTheme: "classic",
        palette: sampleTheme.palette,
        yuruChara: {
          image: "corner.webp",
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
    zip.file("corner.webp", "webp");

    const imported = await importThemePackage({
      file: new Blob([await zip.generateAsync({ type: "arraybuffer" })], { type: "application/zip" }),
    });

    expect(imported.manifest.name).toBe("Mint Imported");
    expect(imported.manifest.yuruChara?.extractedColors).toEqual(["#986846", "#bcbac6"]);
    expect(imported.asset).toMatchObject({
      fileName: "corner.webp",
      mimeType: "image/webp",
    });
    expect(imported.asset).not.toHaveProperty("id");
    expect(imported.asset?.blob).toBeDefined();
    expect(new TextDecoder().decode(await imported.asset!.blob!.arrayBuffer())).toBe("webp");
  });

  it("rejects packages whose declared image is missing", async () => {
    const zip = new JSZip();
    zip.file(
      "theme.json",
      JSON.stringify({
        kind: "moe.bilisound.app.theme",
        version: 1,
        name: "Broken",
        baseTheme: "classic",
        palette: sampleTheme.palette,
        yuruChara: {
          image: "missing.png",
          imageWidth: 1024,
          imageHeight: 768,
          align: "center",
          verticalAlign: "bottom",
          originalScale: 100,
          opacity: 0.4,
          offsetX: 0,
          offsetY: 0,
        },
      }),
    );

    await expect(
      importThemePackage({
        file: new Blob([await zip.generateAsync({ type: "arraybuffer" })], { type: "application/zip" }),
      }),
    ).rejects.toThrow("Theme package image is missing");
  });
});
