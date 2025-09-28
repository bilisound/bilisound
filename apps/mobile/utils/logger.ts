import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { consoleTransport, fileAsyncTransport, logger } from "react-native-logs";

import { BILISOUND_LOG_URI } from "~/constants/file";
import { VERSION } from "~/constants/releasing";
import { matchOldRegex, matchRegex } from "~/utils/logger-common";

const log = logger.createLogger({
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  severity: "info",
  async: true,
  dateFormat: "time",
  printLevel: true,
  printDate: true,
  enabled: true,
  transport: [fileAsyncTransport, consoleTransport],
  transportOptions: {
    // @ts-ignore
    FS: FileSystem,
    fileName: `bilisound_log_${VERSION}_{date-today}.log`,
    filePath: BILISOUND_LOG_URI,
  },
});

export default log;

export async function getLogList() {
  return (await FileSystem.readDirectoryAsync(BILISOUND_LOG_URI)).reverse();
}

export async function getLog(name: string) {
  return FileSystem.readAsStringAsync(BILISOUND_LOG_URI + "/" + name);
}

export async function shareLog(name: string) {
  await Sharing.shareAsync(BILISOUND_LOG_URI + "/" + name, {
    mimeType: "text/plain",
  });
}

export async function deleteLogContent() {
  const fileList = await FileSystem.readDirectoryAsync(BILISOUND_LOG_URI);
  const now = new Date();
  const matchRegex = new RegExp(`^bilisound_log_(.+)_${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}.log$`);
  for (let i = 0; i < fileList.length; i++) {
    const e = fileList[i];
    if (!matchRegex.test(e)) {
      await FileSystem.deleteAsync(`${BILISOUND_LOG_URI}/${e}`, { idempotent: true });
    }
  }
}

export async function deleteOldLogContent() {
  const fileList = await FileSystem.readDirectoryAsync(BILISOUND_LOG_URI);
  const now = new Date();
  for (let i = 0; i < fileList.length; i++) {
    const e = fileList[i];
    const test = matchRegex.exec(e);
    const testOld = matchOldRegex.test(e);
    const logName = `${BILISOUND_LOG_URI}/${e}`;
    if (testOld) {
      await FileSystem.deleteAsync(logName, { idempotent: true });
    }
    if (test) {
      const rawDate = new Date();
      rawDate.setHours(0, 0, 0, 0);
      rawDate.setFullYear(Number(test[4]), Number(test[3]) - 1, Number(test[2]));
      // 删除超过 14 天的日志
      if (now.getTime() - rawDate.getTime() >= 14 * 86400 * 1000) {
        await FileSystem.deleteAsync(logName, { idempotent: true });
      }
    }
  }
}
