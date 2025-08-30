import Toast from "react-native-toast-message";
import log from "~/utils/logger";
import { importHelper } from "~/utils/exchange/import-helper";
import { addToPlaylist, exportAllPlaylist, exportPlaylist, insertPlaylistMeta } from "~/storage/sqlite/playlist";
import { stringify } from "smol-toml";
import { BRAND } from "~/constants/branding";
export async function exportPlaylistToFile(id?: number) {
  let output;
  let name;
  if (typeof id === "number") {
    output = await exportPlaylist(id);
  } else {
    output = await exportAllPlaylist();
  }
  const doc = stringify(output);
  if (output.meta.length > 1) {
    name = output.meta.length + " 个歌单导出";
  } else {
    name = output.meta[0].title;
  }
  const fileName = `[${BRAND} 歌单] ${name}.toml`;

  const url = window.URL.createObjectURL(new Blob([doc]));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 0);

  Toast.show({
    type: "success",
    text1: "文件已保存",
    text2: fileName,
  });
}

function readPlaylistFromFile() {
  return new Promise<string>((resolve, reject) => {
    const el = document.createElement("input");
    el.type = "file";
    el.accept = ".toml";
    el.onchange = event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const content = reader.result as string;
          el.remove();
          resolve(content);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsText(file);
    };
    el.click();
  });
}

export async function importPlaylistFromFile() {
  try {
    const migratePlan = importHelper(await readPlaylistFromFile());
    for (let i = 0; i < migratePlan.length; i++) {
      const e = migratePlan[i];
      const { lastInsertRowId } = await insertPlaylistMeta({ ...e.meta, amount: e.detail.length });
      await addToPlaylist(
        lastInsertRowId,
        e.detail.map(f => ({ ...f, playlistId: lastInsertRowId })),
      );
    }
    Toast.show({
      type: "success",
      text1: "歌单导入成功",
      text2: `导入了 ${migratePlan.length} 个歌单`,
    });
  } catch (e) {
    log.error(`歌单导入失败：${e}`);
    Toast.show({
      type: "error",
      text1: "歌单导入失败",
      text2: "无法读取选择的文件",
    });
    if (process.env.NODE_ENV !== "production") {
      throw e;
    }
  }
  return true;
}
