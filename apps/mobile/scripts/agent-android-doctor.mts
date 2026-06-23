#!/usr/bin/env tsx

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(mobileRoot, "../..");

const androidPackage = process.env.ANDROID_PACKAGE ?? "moe.bilisound.app.dev";

const nativeSensitivePaths = [
  "apps/mobile/app.config.ts",
  "apps/mobile/plugins",
  "apps/mobile/android",
  "packages/player/android",
  "packages/player/ios",
  "packages/player/expo-module.config.json",
  "packages/player/src/BilisoundPlayerModule.ts",
  "packages/player/src/events.ts",
  "packages/player/src/player.ts",
  "packages/player/src/types/module.ts",
  "pnpm-lock.yaml",
];

function tryRun(
  command: string,
  args: string[],
  cwd = repoRoot,
): { ok: true; stdout: string } | { ok: false; error: string } {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status === 0) {
    return { ok: true, stdout: result.stdout.trim() };
  }
  return { ok: false, error: (result.stderr || result.stdout || `${command} exited with ${result.status}`).trim() };
}

function parseAndroidLocalTime(value: string): Date | undefined {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) {
    return undefined;
  }
  const [, year, month, day, hour, minute, second] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

function format(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(" ");
}

function getInstalledUpdateTime(): { raw: string; date: Date } | undefined {
  const dumpsys = tryRun("adb", ["shell", "dumpsys", "package", androidPackage]);
  if (!dumpsys.ok) {
    throw new Error(`Failed to inspect Android package ${androidPackage}:\n${dumpsys.error}`);
  }

  const match = dumpsys.stdout.match(/lastUpdateTime=([^\n\r]+)/);
  if (!match) {
    return undefined;
  }

  const raw = match[1]!.trim();
  const date = parseAndroidLocalTime(raw);
  if (!date) {
    throw new Error(`Could not parse lastUpdateTime from adb: ${raw}`);
  }
  return { raw, date };
}

function getLatestNativeCommit(): { hash: string; subject: string; date: Date } | undefined {
  const output = tryRun("git", ["log", "-1", "--format=%H%x00%ct%x00%s", "--", ...nativeSensitivePaths]);
  if (!output.ok || !output.stdout) {
    return undefined;
  }

  const [hash, timestamp, subject] = output.stdout.split("\0");
  if (!hash || !timestamp || !subject) {
    return undefined;
  }
  return { hash, subject, date: new Date(Number(timestamp) * 1000) };
}

function getDirtyNativeChanges(): string[] {
  const output = tryRun("git", ["status", "--porcelain", "--", ...nativeSensitivePaths]);
  if (!output.ok || !output.stdout) {
    return [];
  }
  return output.stdout.split("\n").filter(Boolean);
}

function main() {
  const installed = getInstalledUpdateTime();
  if (!installed) {
    console.error(`Android package ${androidPackage} is not installed.`);
    console.error("Install the current dev client first:");
    console.error("pnpm -C apps/mobile exec expo run:android --no-bundler");
    process.exit(1);
  }

  const latestCommit = getLatestNativeCommit();
  const dirtyChanges = getDirtyNativeChanges();

  console.log(`Android package: ${androidPackage}`);
  console.log(`Installed APK:   ${installed.raw}`);

  if (latestCommit) {
    console.log(
      `Latest native:   ${format(latestCommit.date)} ${latestCommit.hash.slice(0, 7)} ${latestCommit.subject}`,
    );
  } else {
    console.log("Latest native:   unavailable");
  }

  if (dirtyChanges.length > 0) {
    console.error("\nNative-sensitive working tree changes detected:");
    dirtyChanges.forEach(change => console.error(change));
    console.error("\nReinstall the dev client after these changes are finalized:");
    console.error("pnpm -C apps/mobile exec expo run:android --no-bundler");
    process.exit(1);
  }

  if (latestCommit && latestCommit.date.getTime() > installed.date.getTime()) {
    console.error("\nAndroid dev client is stale: the latest native-sensitive commit is newer than the installed APK.");
    console.error("Reinstall the dev client:");
    console.error("pnpm -C apps/mobile exec expo run:android --no-bundler");
    process.exit(1);
  }

  console.log("\nAndroid dev client looks fresh for committed native-sensitive changes.");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
