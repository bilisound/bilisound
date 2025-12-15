import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

if (!process.env.EXPO_VERSION) {
  throw new Error("EXPO_VERSION environment variable is not defined.");
}
if (!process.env.EXPO_VERSION.startsWith("v")) {
  throw new Error("EXPO_VERSION must start with 'v'.");
}

packageJson.version = process.env.EXPO_VERSION.slice(1);

console.log("packageJson.version: " + packageJson.version);

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), {
  encoding: "utf8",
});
