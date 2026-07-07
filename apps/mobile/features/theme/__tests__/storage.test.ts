import type { ThemeAsset, UserTheme } from "../types";

let themeStorage: typeof import("../storage").themeStorage;

const mockInsertedRows: unknown[] = [];
const mockDeletedIds: unknown[] = [];
const mockSelectedRows: unknown[] = [];
const mockMigrationQueries: unknown[] = [];

jest.mock("~/storage/sqlite/main", () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn(row => {
        mockInsertedRows.push(row);
        return {
          onConflictDoUpdate: jest.fn(async ({ set }) => {
            mockInsertedRows.push(set);
          }),
        };
      }),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(async condition => {
        mockDeletedIds.push(condition);
      }),
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(async () => mockSelectedRows),
      })),
    })),
    transaction: jest.fn(callback => callback({ run: jest.fn(query => mockMigrationQueries.push(query)) })),
  },
}));

const mockFileSystem = {
  documentDirectory: "file:///documents/",
  makeDirectoryAsync: jest.fn(async () => undefined),
  copyAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
  readDirectoryAsync: jest.fn(async () => ["asset-1.png"]),
};

jest.mock("expo-file-system/legacy", () => mockFileSystem);

beforeAll(() => {
  themeStorage = require("../storage").themeStorage;
});

const sampleTheme: UserTheme = {
  id: "user:mint",
  name: "Mint",
  version: 1,
  baseTheme: "classic",
  createdAt: 1,
  updatedAt: 2,
  palette: {
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
  },
  yuruChara: {
    imageAssetId: "asset-1",
    imageWidth: 480,
    imageHeight: 360,
    align: "right",
    verticalAlign: "bottom",
    originalScale: 100,
    opacity: 0.4,
    offsetX: 4,
    offsetY: -8,
    extractedColors: ["#986846", "#bcbac6", "#f59947"],
  },
};

describe("themeStorage native", () => {
  beforeEach(() => {
    mockInsertedRows.length = 0;
    mockDeletedIds.length = 0;
    mockSelectedRows.length = 0;
    mockMigrationQueries.length = 0;
    jest.clearAllMocks();
  });

  it("serializes user themes into SQLite rows", async () => {
    await themeStorage.saveTheme(sampleTheme);

    expect(mockMigrationQueries).toHaveLength(1);
    expect(mockInsertedRows[0]).toMatchObject({
      id: "user:mint",
      name: "Mint",
      createdAt: 1,
      updatedAt: 2,
      imageAssetId: "asset-1",
    });
    expect((mockInsertedRows[0] as { paletteJson: string }).paletteJson).toBe(JSON.stringify(sampleTheme.palette));
    expect((mockInsertedRows[0] as { yuruCharaJson: string }).yuruCharaJson).toBe(
      JSON.stringify(sampleTheme.yuruChara),
    );
  });

  it("copies native theme assets into the persistent theme directory", async () => {
    const asset: Omit<ThemeAsset, "themeId"> = {
      id: "asset-1",
      fileName: "corner.png",
      mimeType: "image/png",
      uri: "file:///source/corner.png",
    };

    const stored = await themeStorage.saveThemeAsset("user:mint", asset);

    expect(mockFileSystem.makeDirectoryAsync).toHaveBeenCalledWith("file:///documents/themes/user:mint", {
      intermediates: true,
    });
    expect(mockFileSystem.copyAsync).toHaveBeenCalledWith({
      from: "file:///source/corner.png",
      to: "file:///documents/themes/user:mint/asset-1.png",
    });
    expect(stored).toMatchObject({ themeId: "user:mint", uri: "file:///documents/themes/user:mint/asset-1.png" });
  });

  it("deletes native theme assets for a theme without deleting the theme row", async () => {
    await themeStorage.deleteThemeAsset("user:mint");

    expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith("file:///documents/themes/user:mint", {
      idempotent: true,
    });
    expect(mockDeletedIds).toHaveLength(0);
  });

  it("deletes an existing native asset with the same id after replacement", async () => {
    mockFileSystem.readDirectoryAsync.mockResolvedValueOnce(["asset-1.png", "other.png"]);

    await themeStorage.saveThemeAsset("user:mint", {
      id: "asset-1",
      fileName: "corner.webp",
      mimeType: "image/webp",
      uri: "file:///source/corner.webp",
    });

    expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith("file:///documents/themes/user:mint/asset-1.png", {
      idempotent: true,
    });
    expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith("file:///documents/themes/user:mint/other.png", {
      idempotent: true,
    });
    expect(mockFileSystem.copyAsync).toHaveBeenCalledWith({
      from: "file:///source/corner.webp",
      to: "file:///documents/themes/user:mint/asset-1.webp",
    });
    expect(mockFileSystem.copyAsync.mock.invocationCallOrder[0]).toBeLessThan(
      mockFileSystem.deleteAsync.mock.invocationCallOrder[0],
    );
  });

  it("keeps existing native assets when copy replacement fails", async () => {
    mockFileSystem.readDirectoryAsync.mockResolvedValueOnce(["asset-1.png", "other.png"]);
    mockFileSystem.copyAsync.mockRejectedValueOnce(new Error("copy failed"));

    await expect(
      themeStorage.saveThemeAsset("user:mint", {
        id: "asset-1",
        fileName: "corner.webp",
        mimeType: "image/webp",
        uri: "file:///source/corner.webp",
      }),
    ).rejects.toThrow("copy failed");

    expect(mockFileSystem.deleteAsync).not.toHaveBeenCalled();
  });

  it("does not delete the newly copied native asset", async () => {
    mockFileSystem.readDirectoryAsync.mockResolvedValueOnce(["asset-1.png", "old-asset.png"]);

    await themeStorage.saveThemeAsset("user:mint", {
      id: "asset-1",
      fileName: "corner.png",
      mimeType: "image/png",
      uri: "file:///source/corner.png",
    });

    expect(mockFileSystem.deleteAsync).not.toHaveBeenCalledWith("file:///documents/themes/user:mint/asset-1.png", {
      idempotent: true,
    });
    expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith("file:///documents/themes/user:mint/old-asset.png", {
      idempotent: true,
    });
  });

  it("deletes previous native assets with different ids after replacement", async () => {
    mockFileSystem.readDirectoryAsync.mockResolvedValueOnce(["old-asset.png"]);

    await themeStorage.saveThemeAsset("user:mint", {
      id: "asset-1",
      fileName: "corner.png",
      mimeType: "image/png",
      uri: "file:///source/corner.png",
    });

    expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith("file:///documents/themes/user:mint/old-asset.png", {
      idempotent: true,
    });
  });

  it("rejects native theme assets without a source uri", async () => {
    await expect(
      themeStorage.saveThemeAsset("user:mint", {
        id: "asset-1",
        fileName: "corner.png",
        mimeType: "image/png",
      }),
    ).rejects.toThrow("Native theme assets require a source uri");
  });

  it("loads native theme assets by theme id", async () => {
    mockSelectedRows.push({
      id: sampleTheme.id,
      name: sampleTheme.name,
      createdAt: sampleTheme.createdAt,
      updatedAt: sampleTheme.updatedAt,
      paletteJson: JSON.stringify(sampleTheme.palette),
      yuruCharaJson: JSON.stringify(sampleTheme.yuruChara),
      imageAssetId: sampleTheme.yuruChara?.imageAssetId ?? null,
    });

    await expect(themeStorage.getThemeAsset("user:mint")).resolves.toMatchObject({
      id: "asset-1",
      themeId: "user:mint",
      fileName: "asset-1.png",
      uri: "file:///documents/themes/user:mint/asset-1.png",
    });
  });
});
