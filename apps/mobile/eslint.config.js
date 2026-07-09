const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

const typeScriptConfig = expoConfig.find(config => config.files?.includes("**/*.ts"));

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,

  {
    ignores: ["dist/*", ".expo/**/*"],
  },
  {
    ...typeScriptConfig,
    files: ["scripts/**/*.mts"],
  },
  {
    rules: {
      "react/display-name": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
]);
