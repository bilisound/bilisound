/**
 * Native accessibility regression project (jest-expo's android preset) — the RN
 * view of the app, which the web project in `jest.web.config.js` cannot see.
 *
 * Only runs the tests under `a11y-native/`; the app's default jest-expo project
 * (`pnpm -C apps/mobile-next test`) never picks these up.
 *
 *   pnpm -C apps/mobile-next exec jest --config jest.native-a11y.config.js --runInBand
 *
 * `@bilisound/ui` resolves to the real workspace source (packages/ui/src) via its
 * `react-native` export condition — the same code Metro bundles.
 */
const androidPreset = require("jest-expo/android/jest-preset.js");

module.exports = {
  ...androidPreset,
  roots: ["<rootDir>/a11y-native"],
  testMatch: ["**/*.test.tsx"],
  testEnvironmentOptions: {
    ...(androidPreset.testEnvironmentOptions || {}),
    // Pick the react-native export condition for @tamagui/* and friends.
    // NOTE: do not list "import" here — jest-circus' `dedent` would then resolve
    // its ESM build (import key precedes require in its exports map) and crash.
    customExportConditions: ["react-native", "require", "default"],
  },
  moduleNameMapper: {
    ...(androidPreset.moduleNameMapper || {}),
    // Metro's svg-transformer turns `.svg` imports into components; jest needs a stand-in.
    "\\.svg$": "<rootDir>/a11y-native/svg-file.tsx",
  },
  // Tamagui (and some deps) ship ESM-in-.mjs; babel-jest only claims .js by default.
  transform: {
    ...androidPreset.transform,
    "^.+\\.mjs$": androidPreset.transform["\\.[jt]sx?$"],
  },
  // On Windows + pnpm the usual "/node_modules/(?!(...))" allowlist breaks: paths
  // contain a second node_modules segment ("...\.pnpm\<pkg>\node_modules\<pkg>\..."),
  // so the "ignore" pattern matches there and the ESM builds are never transformed.
  // This project runs one focused suite; transform everything instead.
  transformIgnorePatterns: [],
};
