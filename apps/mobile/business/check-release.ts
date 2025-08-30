import { RELEASE_CHANNEL } from "~/constants/releasing";
import ReactNativeBlobUtil from "react-native-blob-util";
import { BRAND } from "~/constants/branding";
import { getUpdate } from "~/api/bilisound";

export interface CheckLatestVersionReturns {
  isLatest: boolean;
  currentVersion: string;
  latestVersion: string;
  extraInfo: string;
  downloadPage: string;
  downloadUrl: string;
}

export async function checkLatestVersion(currentVersion: string) {
  switch (RELEASE_CHANNEL) {
    case "android_github":
    case "android_github_beta": {
      const { data: result } = await getUpdate();
      return {
        isLatest: currentVersion === result.version,
        currentVersion,
        latestVersion: result.version,
        extraInfo: result.info,
        downloadPage: result.downloadPage,
        downloadUrl: result.downloadUrl,
      };
    }
    default: {
      return {
        isLatest: true,
        currentVersion,
        latestVersion: currentVersion,
        extraInfo: "",
        downloadPage: "",
        downloadUrl: "",
      };
    }
  }
}

export function downloadApk(url: string, version: string) {
  const android = ReactNativeBlobUtil.android;
  return ReactNativeBlobUtil.config({
    addAndroidDownloads: {
      useDownloadManager: true,
      title: ` ${BRAND} 更新`,
      description: `版本 ${version}`,
      mime: "application/vnd.android.package-archive",
      mediaScannable: true,
      notification: true,
    },
  })
    .fetch("GET", url)
    .then(res => android.actionViewIntent(res.path(), "application/vnd.android.package-archive"));
}
