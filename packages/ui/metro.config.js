const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const { withStorybook } = require("@storybook/react-native/withStorybook");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

config.server.unstable_serverRoot = workspaceRoot;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.watchFolders = [workspaceRoot];

const defaultAssetExts = config.resolver.assetExts || [];
const defaultSourceExts = config.resolver.sourceExts || [];
config.resolver.assetExts = defaultAssetExts.filter(ext => ext !== "svg");
config.resolver.sourceExts = [...defaultSourceExts, "svg"];
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

module.exports = withStorybook(config, {
  configPath: path.resolve(projectRoot, ".rnstorybook"),
  enabled: process.env.STORYBOOK_ENABLED === "true",
});
