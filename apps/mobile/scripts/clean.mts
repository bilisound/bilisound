#!/usr/bin/env tsx

import { rmSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const androidDir = path.join(projectRoot, "android");
const gradlew = os.platform() === "win32" ? "gradlew.bat" : "./gradlew";
const dryRun = process.argv.includes("--dry-run");

function cleanEnv() {
  const env = { ...process.env };
  if (env.PROTO_OFFLINE_TIMEOUT === "") {
    delete env.PROTO_OFFLINE_TIMEOUT;
  }
  return env;
}

function stopGradleDaemon() {
  if (!existsSync(androidDir)) {
    return;
  }

  if (dryRun) {
    console.log(`Would stop Android Gradle daemon in ${path.relative(projectRoot, androidDir)}`);
    return;
  }

  const result = spawnSync(gradlew, ["--stop"], {
    cwd: androidDir,
    env: cleanEnv(),
    shell: os.platform() === "win32",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.warn("Failed to stop the Android Gradle daemon; continuing clean.");
  }
}

function removePath(relativePath: string) {
  const target = path.join(projectRoot, relativePath);
  if (dryRun) {
    console.log(`Would remove ${relativePath}`);
    return;
  }

  rmSync(target, { recursive: true, force: true });
  console.log(`Removed ${relativePath}`);
}

stopGradleDaemon();

removePath("ios");
removePath("android");
removePath(".expo");
removePath(path.join("node_modules", ".cache"));
