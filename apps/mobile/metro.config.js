const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const packagesRoot = path.resolve(workspaceRoot, "packages");
const moduleRoot = path.resolve(packagesRoot, "player");
const config = getDefaultConfig(projectRoot);

// Keep the server root at the workspace to allow pnpm store paths.
config.server.unstable_serverRoot = workspaceRoot;

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

config.resolver.extraNodeModules = {
  "@bilisound/player": moduleRoot,
};

config.watchFolders = [workspaceRoot];

// SVG transformer configuration
const defaultAssetExts = config.resolver.assetExts || [];
const defaultSourceExts = config.resolver.sourceExts || [];
config.resolver.assetExts = defaultAssetExts.filter(ext => ext !== "svg");
config.resolver.assetExts.push("txt");
config.resolver.sourceExts = [...defaultSourceExts, "svg"];
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

const configWithNativeWind = withNativeWind(config, { input: "./global.css", inlineRem: 16 });

module.exports = configWithNativeWind;
