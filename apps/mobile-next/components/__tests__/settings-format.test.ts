import {
  formatDownloadStatusText,
  formatLogDisplayName,
  formatOpacityPercent,
  formatScalePercent,
  getDownloadProgressRatio,
  getDownloadSpeed,
  summarizeDownloadManager,
  summarizeDownloadTasks,
} from "../settings-format";

function makeSource(overrides: Partial<Parameters<typeof getDownloadSpeed>[0]> = {}) {
  return {
    progress: { totalBytesExpectedToWrite: 2000, totalBytesWritten: 1200 },
    progressOld: { totalBytesExpectedToWrite: 2000, totalBytesWritten: 1000 },
    status: 1 as const,
    updateTime: 10_000,
    updateTimeOld: 9_000,
    ...overrides,
  };
}

describe("settings-format", () => {
  describe("download status", () => {
    it("computes speed from the last two samples", () => {
      expect(getDownloadSpeed(makeSource())).toBe(200);
    });

    it("returns zero speed when no time has passed", () => {
      expect(getDownloadSpeed(makeSource({ updateTime: 9_000 }))).toBe(0);
      expect(getDownloadSpeed(makeSource({ updateTime: 8_000 }))).toBe(0);
    });

    it("labels queued, processing and failed states", () => {
      expect(formatDownloadStatusText(makeSource({ status: 0 }))).toBe("排队中");
      expect(formatDownloadStatusText(makeSource({ status: 2 }))).toBe("本地处理中");
      expect(formatDownloadStatusText(makeSource({ status: 3 }))).toBe("下载失败");
    });

    it("formats running downloads with a per-second speed", () => {
      const text = formatDownloadStatusText(makeSource());
      expect(text.endsWith("/s")).toBe(true);
      expect(text).toContain("200");
    });

    it("clamps the progress ratio into 0..1", () => {
      expect(getDownloadProgressRatio({ totalBytesExpectedToWrite: 0, totalBytesWritten: 10 })).toBe(0);
      expect(getDownloadProgressRatio({ totalBytesExpectedToWrite: 100, totalBytesWritten: 50 })).toBe(0.5);
      expect(getDownloadProgressRatio({ totalBytesExpectedToWrite: 100, totalBytesWritten: 250 })).toBe(1);
    });
  });

  describe("download summaries", () => {
    it("describes the settings entry subtitle", () => {
      expect(summarizeDownloadTasks([])).toEqual({ inProgress: 0, total: 0, text: "尚无任务正在进行" });
      expect(summarizeDownloadTasks([{ status: 0 }, { status: 1 }, { status: 3 }])).toEqual({
        inProgress: 2,
        total: 3,
        text: "2 个任务进行中",
      });
    });

    it("describes the download manager header", () => {
      expect(summarizeDownloadManager([])).toBe("无下载任务");
      expect(summarizeDownloadManager([{ status: 0 }, { status: 1 }, { status: 3 }])).toBe("当前有 1 / 3 个任务进行中");
    });
  });

  describe("log names", () => {
    it("formats versioned log names", () => {
      expect(formatLogDisplayName("bilisound_log_3.0.0-dev.1_30-9-2026.log")).toBe("2026-09-30（版本 3.0.0-dev.1）");
    });

    it("formats legacy log names without a version", () => {
      expect(formatLogDisplayName("bilisound_log_30-9-2026.log")).toBe("2026-09-30");
    });

    it("falls back for unknown names", () => {
      expect(formatLogDisplayName("random.log")).toBe("未知日志");
    });
  });

  describe("editor labels", () => {
    it("formats opacity and scale percentages", () => {
      expect(formatOpacityPercent(0.4)).toBe("40%");
      expect(formatOpacityPercent(0.005)).toBe("0.5%");
      expect(formatScalePercent(120.4)).toBe("120%");
    });
  });
});
