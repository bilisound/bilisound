const fs = require("fs");
const path = require("path");
const packageJson = require("../package.json");

if (!process.env.EXPO_VERSION) {
  throw new Error("EXPO_VERSION environment variable is not defined.");
}
if (!process.env.EXPO_VERSION.startsWith("v")) {
  throw new Error("EXPO_VERSION must start with 'v'.");
}

packageJson.version = process.env.EXPO_VERSION.slice(1);

console.log("packageJson.version: " + packageJson.version);

fs.writeFileSync(path.resolve(__dirname, "../package.json"), JSON.stringify(packageJson, null, 2), {
  encoding: "utf8",
});
