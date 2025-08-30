const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { withMonicon } = require("@monicon/metro");
const { mergeConfig } = require("axios");
const path = require("path");

const config = mergeConfig(getDefaultConfig(__dirname), {
  projectRoot: path.resolve(__dirname, ".."),
  /*resolver: {
        unstable_enableSymlinks: true,
        unstable_enablePackageExports: true,
        unstable_conditionNames: ["browser", "require", "react-native"],
    },*/
});

config.resolver.assetExts.push("txt");

const configWithNativeWind = withNativeWind(config, { input: "./global.css", inlineRem: 16 });

const configWithMonicon = withMonicon(configWithNativeWind, {
  collections: ["fa6-solid"],
  icons: [
    "uil:qrcode-scan",
    "ri:skip-back-mini-fill",
    "tabler:alert-square-rounded",
    "tabler:repeat-off",
    "tabler:repeat",
    "tabler:repeat-once",
    "tabler:arrows-right",
    "tabler:arrows-shuffle",
    "ion:checkmark-circle",
    "ion:information-circle",
    "ion:alert-circle",
    "ion:close-circle",
    "material-symbols:speed-rounded",
    "mingcute:grid-fill",
  ],
});

module.exports = configWithMonicon;
