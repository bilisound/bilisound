import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";

import { exportThemePackage, importThemePackage } from "~/features/theme/archive";
import { getYuruCharaAssetId } from "~/features/theme/editor";
import { themeStorage } from "~/features/theme/storage";
import type { UserTheme } from "~/features/theme/types";
import { saveBinaryFile } from "~/utils/file";

/**
 * 主题包导入 / 导出的文件层：把平台分叉（原生 zip / Web Blob）与文件保存
 * 收敛到一处，页面只负责提示与错误处理。
 */

type ThemeArchiveOutput =
  | Awaited<ReturnType<typeof exportThemePackage>>
  | {
      blob: Blob;
      mimeType: "application/zip";
      fileName: string;
    };

/** 导出主题包；原生端走系统分享/保存，Web 端触发浏览器下载。 */
export async function exportUserTheme(item: UserTheme): Promise<void> {
  const asset = await themeStorage.getThemeAsset(item);
  const output = (await exportThemePackage(item, asset ?? undefined)) as ThemeArchiveOutput;
  if ("uri" in output) {
    await saveBinaryFile(output.uri, output.mimeType, output.fileName);
    return;
  }
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(output.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = output.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }
  throw new Error("Theme export did not return a native file uri");
}

/** 让用户选择并解析一个主题包；取消选择时返回 null。 */
export async function pickUserTheme(): Promise<UserTheme | null> {
  const pickResult = await DocumentPicker.getDocumentAsync({
    type: ["application/zip", "application/x-zip-compressed"],
  });
  const picked = pickResult.assets?.[0];
  if (!picked) {
    return null;
  }

  const imported = await importThemePackage(
    (Platform.OS === "web" && picked.file ? { file: picked.file } : { uri: picked.uri }) as never,
  );
  const now = Date.now();
  const id = `${now}`;
  const storedAsset = imported.asset
    ? await themeStorage.saveThemeAsset(id, { ...imported.asset, id: getYuruCharaAssetId(id) })
    : undefined;

  return {
    id,
    name: imported.manifest.name,
    version: 1,
    baseTheme: "classic",
    palette: imported.manifest.palette,
    yuruChara: imported.manifest.yuruChara
      ? { ...imported.manifest.yuruChara, imageAssetId: storedAsset?.id }
      : undefined,
    createdAt: now,
    updatedAt: now,
  };
}
