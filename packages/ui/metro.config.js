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

module.exports = withStorybook(config, {
  configPath: path.resolve(projectRoot, ".rnstorybook"),
});
