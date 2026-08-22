export const VERSION = require("~/package.json").version;

export const RELEASE_CHANNEL = process.env.EXPO_PUBLIC_RELEASE_CHANNEL as ReleaseChannel;

export type ReleaseChannel =
  "android_github" | "android_github_beta" | "android_github_stg" | "web_beta" | "web" | "unknown";
