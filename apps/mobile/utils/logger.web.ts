import { logger, consoleTransport } from "react-native-logs";

const config = {
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
  transport: consoleTransport,
};

const log = logger.createLogger(config);

export default log;

export async function getLogList() {}

export async function getLog() {}

export async function shareLog() {}

export async function deleteLogContent() {}
