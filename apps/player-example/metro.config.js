// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const moduleRoot = path.resolve(workspaceRoot, "packages", "player");

const config = getDefaultConfig(projectRoot);

// Avoid resolving duplicate React/React Native from the module's own node_modules.
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  new RegExp(path.resolve(moduleRoot, "node_modules", "react")),
  new RegExp(path.resolve(moduleRoot, "node_modules", "react-native")),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.extraNodeModules = {
  "@bilisound/player": moduleRoot,
};

config.watchFolders = [workspaceRoot, moduleRoot];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
