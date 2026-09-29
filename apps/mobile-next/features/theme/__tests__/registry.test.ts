import { findUserTheme, getUserThemeSettingId } from "../registry";

jest.mock("../storage", () => ({
  themeStorage: {
    listThemes: jest.fn(),
    saveTheme: jest.fn(),
    deleteTheme: jest.fn(),
  },
}));

const palette = {
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

describe("findUserTheme", () => {
  it("matches user theme ids with or without user prefix", () => {
    const prefixedTheme = {
      id: "user:mint",
      name: "Mint",
      version: 1,
      baseTheme: "classic",
      palette,
      createdAt: 1,
      updatedAt: 1,
    } as const;
    const bareTheme = {
      ...prefixedTheme,
      id: "rose",
      name: "Rose",
    };

    expect(findUserTheme([prefixedTheme, bareTheme], "user:mint")).toBe(prefixedTheme);
    expect(findUserTheme([prefixedTheme, bareTheme], "user:rose")).toBe(bareTheme);
  });

  it("matches accidentally double-prefixed user theme ids", () => {
    const prefixedTheme = {
      id: "user:mint",
      name: "Mint",
      version: 1,
      baseTheme: "classic",
      palette,
      createdAt: 1,
      updatedAt: 1,
    } as const;

    expect(findUserTheme([prefixedTheme], "user:user:mint")).toBe(prefixedTheme);
  });
});

describe("getUserThemeSettingId", () => {
  it("uses exactly one user prefix for persisted setting ids", () => {
    expect(getUserThemeSettingId("mint")).toBe("user:mint");
    expect(getUserThemeSettingId("user:mint")).toBe("user:mint");
  });
});
