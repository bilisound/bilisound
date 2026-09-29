import type { ThemeAsset, UserTheme } from "../types";

let themeStorage: typeof import("../storage.web").themeStorage;

const mockThemeProfiles = new Map<string, UserTheme>();
const mockThemeAssets = new Map<string, ThemeAsset>();
let mockThemeAssetPutError: Error | null = null;

const createCursor = (items: ThemeAsset[], index = 0): IDBCursorWithValue | null => {
  const item = items[index];
  if (!item) return null;
  return {
    delete: jest.fn(async () => {
      mockThemeAssets.delete(item.id);
    }),
    continue: jest.fn(async () => createCursor(items, index + 1)),
    value: item,
  } as unknown as IDBCursorWithValue;
};

const mockIdb = {
  getAll: jest.fn(async () => [...mockThemeProfiles.values()]),
  get: jest.fn(async (store: string, id: string) => {
    if (store === "themeProfile") return mockThemeProfiles.get(id);
    return mockThemeAssets.get(id);
  }),
  put: jest.fn(async (store: string, value: UserTheme | ThemeAsset) => {
    if (store === "themeProfile") mockThemeProfiles.set(value.id, value as UserTheme);
    if (store === "themeAsset") {
      if (mockThemeAssetPutError) throw mockThemeAssetPutError;
      mockThemeAssets.set(value.id, value as ThemeAsset);
    }
  }),
  delete: jest.fn(async (_store: string, id: string) => {
    mockThemeProfiles.delete(id);
  }),
  transaction: jest.fn(() => ({
    store: {
      put: jest.fn(async (value: ThemeAsset) => {
        if (mockThemeAssetPutError) throw mockThemeAssetPutError;
        mockThemeAssets.set(value.id, value);
      }),
      index: jest.fn(() => ({
        openCursor: jest.fn(async (themeId: string) =>
          createCursor([...mockThemeAssets.values()].filter(asset => asset.themeId === themeId)),
        ),
      })),
    },
    done: Promise.resolve(),
  })),
};
const mockInitDatabase = jest.fn(async () => mockIdb);

jest.mock("~/storage/sqlite/init-web", () => ({
  idb: undefined,
  initDatabase: () => mockInitDatabase(),
}));

beforeAll(() => {
  themeStorage = require("../storage.web").themeStorage;
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
};

describe("themeStorage web", () => {
  beforeEach(() => {
    mockThemeProfiles.clear();
    mockThemeAssets.clear();
    mockThemeAssetPutError = null;
    jest.clearAllMocks();
  });

  it("initializes IndexedDB before reading theme profiles", async () => {
    await expect(themeStorage.listThemes()).resolves.toEqual([]);

    expect(mockInitDatabase).toHaveBeenCalledTimes(1);
    expect(mockIdb.getAll).toHaveBeenCalledWith("themeProfile");
  });

  it("persists user themes in IndexedDB", async () => {
    await themeStorage.saveTheme(sampleTheme);

    await expect(themeStorage.getTheme("user:mint")).resolves.toEqual(sampleTheme);
    await expect(themeStorage.listThemes()).resolves.toEqual([sampleTheme]);
  });

  it("stores web theme assets as blobs", async () => {
    const blob = new Blob(["image"], { type: "image/png" });

    const stored = await themeStorage.saveThemeAsset("user:mint", {
      id: "asset-1",
      fileName: "corner.png",
      mimeType: "image/png",
      blob,
    });

    expect(stored).toMatchObject({
      id: "asset-1",
      themeId: "user:mint",
      fileName: "corner.png",
      mimeType: "image/png",
    });
    expect(
      await themeStorage.getThemeAsset({
        ...sampleTheme,
        yuruChara: {
          imageAssetId: "asset-1",
          imageWidth: 480,
          imageHeight: 360,
          align: "right",
          verticalAlign: "bottom",
          originalScale: 100,
          opacity: 0.4,
          offsetX: 0,
          offsetY: 0,
        },
      }),
    ).toEqual(stored);
  });

  it("deletes web theme assets for a theme without deleting the theme profile", async () => {
    await themeStorage.saveTheme(sampleTheme);
    await themeStorage.saveThemeAsset("user:mint", {
      id: "asset-1",
      fileName: "corner.png",
      mimeType: "image/png",
      blob: new Blob(["image"], { type: "image/png" }),
    });

    await themeStorage.deleteThemeAsset("user:mint");

    await expect(themeStorage.getTheme("user:mint")).resolves.toEqual(sampleTheme);
    expect(mockThemeAssets.has("asset-1")).toBe(false);
  });

  it("deletes previous web assets after replacement", async () => {
    await themeStorage.saveThemeAsset("user:mint", {
      id: "old-asset",
      fileName: "old.png",
      mimeType: "image/png",
      blob: new Blob(["old"], { type: "image/png" }),
    });

    await themeStorage.saveThemeAsset("user:mint", {
      id: "asset-1",
      fileName: "corner.png",
      mimeType: "image/png",
      blob: new Blob(["new"], { type: "image/png" }),
    });

    expect(mockThemeAssets.has("old-asset")).toBe(false);
    expect(mockThemeAssets.has("asset-1")).toBe(true);
  });

  it("keeps existing web assets when put replacement fails", async () => {
    await themeStorage.saveThemeAsset("user:mint", {
      id: "old-asset",
      fileName: "old.png",
      mimeType: "image/png",
      blob: new Blob(["old"], { type: "image/png" }),
    });
    const oldAsset = mockThemeAssets.get("old-asset");
    mockThemeAssetPutError = new Error("put failed");

    await expect(
      themeStorage.saveThemeAsset("user:mint", {
        id: "asset-1",
        fileName: "corner.png",
        mimeType: "image/png",
        blob: new Blob(["new"], { type: "image/png" }),
      }),
    ).rejects.toThrow("put failed");

    expect(mockThemeAssets.get("old-asset")).toBe(oldAsset);
    expect(mockThemeAssets.has("asset-1")).toBe(false);
  });

  it("does not delete the newly written web asset id", async () => {
    await themeStorage.saveThemeAsset("user:mint", {
      id: "old-asset",
      fileName: "old.png",
      mimeType: "image/png",
      blob: new Blob(["old"], { type: "image/png" }),
    });

    await themeStorage.saveThemeAsset("user:mint", {
      id: "asset-1",
      fileName: "corner.png",
      mimeType: "image/png",
      blob: new Blob(["new"], { type: "image/png" }),
    });

    expect(mockThemeAssets.has("old-asset")).toBe(false);
    expect(mockThemeAssets.has("asset-1")).toBe(true);
  });

  it("loads web theme assets by theme id", async () => {
    const themeWithAsset = {
      ...sampleTheme,
      yuruChara: {
        imageAssetId: "asset-1",
        imageWidth: 480,
        imageHeight: 360,
        align: "right",
        verticalAlign: "bottom",
        originalScale: 100,
        opacity: 0.4,
        offsetX: 0,
        offsetY: 0,
      },
    } satisfies UserTheme;

    await themeStorage.saveTheme(themeWithAsset);
    const stored = await themeStorage.saveThemeAsset("user:mint", {
      id: "asset-1",
      fileName: "corner.png",
      mimeType: "image/png",
      blob: new Blob(["image"], { type: "image/png" }),
    });

    await expect(themeStorage.getThemeAsset("user:mint")).resolves.toEqual(stored);
  });

  it("deletes assets belonging to deleted web themes", async () => {
    await themeStorage.saveTheme(sampleTheme);
    await themeStorage.saveThemeAsset("user:mint", {
      id: "asset-1",
      fileName: "corner.png",
      mimeType: "image/png",
      blob: new Blob(["image"], { type: "image/png" }),
    });

    await themeStorage.deleteTheme("user:mint");

    await expect(themeStorage.getTheme("user:mint")).resolves.toBeNull();
    expect(mockThemeAssets.has("asset-1")).toBe(false);
  });

  it("rejects web theme assets without a blob", async () => {
    await expect(
      themeStorage.saveThemeAsset("user:mint", {
        id: "asset-1",
        fileName: "corner.png",
        mimeType: "image/png",
      }),
    ).rejects.toThrow("Web theme assets require a blob");
  });
});
