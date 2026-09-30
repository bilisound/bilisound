const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);
config.server.unstable_serverRoot = workspaceRoot;
config.watchFolders = [workspaceRoot];
// Agent worktrees must not enter the Metro graph or Expo's generated route types.
config.resolver.blockList = [...config.resolver.blockList, /[\\/]\.temp[\\/].*/];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.extraNodeModules = { "@bilisound/player": path.resolve(workspaceRoot, "packages/player") };
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== "svg");
config.resolver.assetExts.push("txt");
config.resolver.sourceExts.push("svg");
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");
module.exports = config;
