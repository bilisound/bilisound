import { logger, consoleTransport, configLoggerType } from "react-native-logs";

const transport: Partial<
  configLoggerType<any, "debug" | "info" | "warn" | "error">
> = {
  transport: [consoleTransport],
};

const config = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  severity: "debug",
  async: true,
  dateFormat: "time",
  printLevel: true,
  printDate: true,
  enabled: true,
  ...transport,
};

const log = logger.createLogger(config);

export default log;
