const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
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

// SVG transformer configuration
const defaultAssetExts = config.resolver.assetExts || [];
const defaultSourceExts = config.resolver.sourceExts || [];
config.resolver.assetExts = defaultAssetExts.filter((ext) => ext !== "svg");
config.resolver.assetExts.push("txt");
config.resolver.sourceExts = [...defaultSourceExts, "svg"];
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

const configWithNativeWind = withNativeWind(config, { input: "./global.css", inlineRem: 16 });

module.exports = configWithNativeWind;
