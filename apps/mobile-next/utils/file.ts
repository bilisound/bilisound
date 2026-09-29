import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Player from "@bilisound/player";

import log from "~/utils/logger";
import { Platform } from "react-native";

export async function saveTextFile(name: string, content: string, mimeType = "text/plain") {
  const filePath = FileSystem.cacheDirectory + `/shared_text_file_${new Date().getTime()}`;
  const fileFullPath = `${filePath}/${name}`;
  await FileSystem.makeDirectoryAsync(filePath, {
    intermediates: true,
  });
  await FileSystem.writeAsStringAsync(fileFullPath, content);

  if (Platform.OS === "android") {
    await Player.saveFile(uriToPath(fileFullPath), mimeType, name);
    return;
  }

  log.debug("分享文件：" + fileFullPath);
  await Sharing.shareAsync(fileFullPath, {
    mimeType,
  });
  log.debug("分享文件流程结束");
}

export async function saveBinaryFile(uri: string, mimeType: string, name: string) {
  if (Platform.OS === "android") {
    await Player.saveFile(uriToPath(uri), mimeType, name);
    return;
  }

  await Sharing.shareAsync(uri, { mimeType });
}

/**
 * 保存文件到「本地」
 * @param location
 * @param replaceFileName
 */
export async function saveAudioFile(location: string, replaceFileName: string) {
  log.debug(`尝试保存文件到本地。location: ${location}, replaceFileName: ${replaceFileName}`);
  let targetLocation = "";

  if (Platform.OS === "android") {
    await Player.saveFile(location, "audio/mp4", replaceFileName);
    return;
  }

  if (replaceFileName) {
    const targetDir = `${FileSystem.cacheDirectory}/sharing-${new Date().getTime()}`;
    targetLocation = `${targetDir}/${replaceFileName}`;
    await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
    await FileSystem.copyAsync({
      from: pathToUri(location),
      to: targetLocation,
    });
  }
  await Sharing.shareAsync(targetLocation, {
    mimeType: "application/octet-stream",
  });
  if (targetLocation) {
    await FileSystem.deleteAsync(targetLocation);
  }
  return true;
}

export function uriToPath(uri: string) {
  return decodeURI(uri.slice(7));
}

export function pathToUri(path: string) {
  return `file://${encodeURI(path)}`;
}
