import { RELEASE_CHANNEL } from "~/constants/releasing";

const NOT_PROD_READY =
  RELEASE_CHANNEL === "android_github_beta" ||
  RELEASE_CHANNEL === "android_github_stg" ||
  process.env.NODE_ENV !== "production";

/**
 * 批量下载歌单或多分 P 视频
 */
export const FEATURE_MASS_DOWNLOAD = true;

/**
 * 下载管理器
 */
export const FEATURE_DOWNLOAD_MANAGER = true;
