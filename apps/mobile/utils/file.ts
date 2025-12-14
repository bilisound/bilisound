import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Player from "@bilisound/player";
import path from "path-browserify";

import { BILISOUND_OFFLINE_URI, BILISOUND_PROCESS_URI } from "~/constants/file";
import { cacheStatusStorage } from "~/storage/cache-status";
// 注意：cleanAudioCache 中直接使用 cacheStatusStorage.remove()，因为 key 是从文件名解析的
import log from "~/utils/logger";
import { getTracks } from "@bilisound/player";
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

interface CheckDirectorySizeOptions {
  fileFilter?: (fileName: string, index: number, fileList: string[]) => boolean;
}

async function checkDirectorySizeByUri(uri: string, options: CheckDirectorySizeOptions = {}) {
  let items = (await FileSystem.readDirectoryAsync(uri)).map(e => {
    return uri + "/" + encodeURI(e);
  });
  if (options.fileFilter) {
    items = items.filter(options.fileFilter);
  }
  let totalSize = 0;
  for (let i = 0; i < items.length; i++) {
    const meta = await FileSystem.getInfoAsync(items[i]);
    if (meta.exists) {
      totalSize += meta.size;
    }
  }
  return totalSize;
}

export async function countSize() {
  if (Platform.OS === "web") {
    return { cacheSize: 0, cacheFreeSize: 0 };
  }

  const tracks = await getTracks();
  const cacheSize = await checkDirectorySizeByUri(BILISOUND_OFFLINE_URI);
  const cacheFreeSize = await checkDirectorySizeByUri(BILISOUND_OFFLINE_URI, {
    fileFilter(fileName) {
      const name = path.parse(uriToPath(fileName)).name;
      return !tracks.find(e => `${e.extendedData!.id}_${e.extendedData!.episode}` === name);
    },
  });
  return { cacheSize, cacheFreeSize };
}

export async function cleanAudioCache() {
  const tracks = await getTracks();
  const items = (await FileSystem.readDirectoryAsync(BILISOUND_OFFLINE_URI))
    .map(e => {
      return BILISOUND_OFFLINE_URI + "/" + encodeURI(e);
    })
    .filter(fileName => {
      const name = path.parse(uriToPath(fileName)).name;
      return !tracks.find(e => `${e.extendedData!.id}_${e.extendedData!.episode}` === name);
    });
  for (let i = 0; i < items.length; i++) {
    const name = path.parse(uriToPath(items[i])).name;
    await FileSystem.deleteAsync(items[i]);
    cacheStatusStorage.remove(name);
  }
}

export function getCacheAudioPath(id: string, episode: number, isTemp = false) {
  if (isTemp) {
    return `${BILISOUND_PROCESS_URI}/${id}_${episode}.tmp`;
  }
  return `${BILISOUND_OFFLINE_URI}/${id}_${episode}.m4a`;
}

export function uriToPath(uri: string) {
  return decodeURI(uri.slice(7));
}

export function pathToUri(path: string) {
  return `file://${encodeURI(path)}`;
}
