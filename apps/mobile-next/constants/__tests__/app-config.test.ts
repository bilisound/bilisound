describe("mobile-next API configuration", () => {
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalUrl;
    }
  });

  test.each([undefined, "", "not-a-url", "file:///api"])("rejects missing or invalid API URL: %s", value => {
    if (value === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = value;
    }
    expect(() => jest.isolateModules(() => require("../../app.config"))).toThrow("EXPO_PUBLIC_API_URL");
  });

  test.each(["http://localhost:8787/api", "https://example.com/api"])("accepts an HTTP(S) API URL", value => {
    process.env.EXPO_PUBLIC_API_URL = value;
    jest.isolateModules(() => {
      expect(require("../../app.config").default.android.package).toBe("moe.bilisound.app.next.dev");
    });
  });
});
