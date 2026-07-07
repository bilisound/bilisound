const mockImageColors = {
  getColors: jest.fn(),
};

jest.mock("react-native-image-colors", () => mockImageColors);

describe("extractThemeBaseColors native", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns debug rows for all native color roles that are present", async () => {
    const { extractThemeBaseColors } = require("../image-colors") as typeof import("../image-colors");
    mockImageColors.getColors.mockResolvedValue({
      platform: "android",
      vibrant: "#111111",
      dominant: "#222222",
      average: "#333333",
      primary: "#444444",
      secondary: "#555555",
      detail: "#666666",
    });

    const colors = await extractThemeBaseColors({ uri: "file://avatar.png" });

    expect(colors.debugColors).toEqual([
      { label: "vibrant", color: "#111111", selectedAs: "primary" },
      { label: "dominant", color: "#222222" },
      { label: "average", color: "#333333", selectedAs: "accent" },
      { label: "primary", color: "#444444" },
      { label: "secondary", color: "#555555" },
      { label: "detail", color: "#666666" },
    ]);
  });
});
