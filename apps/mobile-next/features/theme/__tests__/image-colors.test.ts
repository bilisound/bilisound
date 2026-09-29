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

    expect(colors.debugColors).toEqual(["#111111", "#222222", "#333333", "#444444", "#555555", "#666666"]);
  });
});
