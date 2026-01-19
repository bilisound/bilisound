const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

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
