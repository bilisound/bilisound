#!/usr/bin/env node

// This script aims to fix the problem of "expo export --platform web" not reading .env file

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const expoBinary =
  process.platform === "win32"
    ? path.resolve(__dirname, "../node_modules/.bin/expo.cmd")
    : path.resolve(__dirname, "../node_modules/.bin/expo");

const result = spawnSync(expoBinary, ["export", "--platform", "web"], {
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 0);
