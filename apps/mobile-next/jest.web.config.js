/* global __dirname */
/**
 * Web accessibility regression project (the react-native-web view of the app).
 *
 * Only runs the tests under `a11y-web/`; the app's default jest-expo project
 * (`pnpm -C apps/mobile-next test`) never picks these up.
 *
 *   pnpm -C apps/mobile-next exec jest --config jest.web.config.js --runInBand
 */
const webPreset = require("jest-expo/web/jest-preset.js");

module.exports = {
  ...webPreset,
  rootDir: __dirname,
  testMatch: ["**/a11y-web/**/*.test.web.[jt]s?(x)"],
  setupFilesAfterEnv: ["<rootDir>/a11y-web/setup.ts"],
  moduleNameMapper: {
    ...webPreset.moduleNameMapper,
    // The browser server build needs MessageChannel; the node build streams without it.
    "^react-dom/server$": "react-dom/server.node",
    // Metro's svg-transformer turns `.svg` imports into components; jest needs a stand-in.
    "\\.svg$": "<rootDir>/a11y-web/stubs/svg-file.tsx",
  },
  // Tamagui resolves its ESM builds under the web export conditions; babel-jest
  // only transforms .js/.ts/.tsx out of the box.
  transform: {
    ...webPreset.transform,
    "^.+\\.mjs$": webPreset.transform["\\.[jt]sx?$"],
  },
  // jest-expo's allowlist does not cover the workspace packages; without this the
  // Tamagui ESM output inside `.pnpm` is skipped by both transform rules.
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|@tamagui|tamagui|@bilisound))",
    "/node_modules/react-native-reanimated/plugin/",
    "/node_modules/@react-native/babel-preset/",
  ],
};
