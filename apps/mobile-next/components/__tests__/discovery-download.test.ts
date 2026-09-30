import type { DiscoveryDownloadItem } from "~/features/bilibili/discovery";

interface HelperModule {
  cacheEpisodeToLocal: (id: string, episode: number, title: string) => Promise<string>;
  cacheVideoEpisodesToLocal: (items: readonly DiscoveryDownloadItem[]) => { added: number; skipped: number };
}

interface HelperMocks {
  addDownloadTask: jest.Mock;
  downloadResource: jest.Mock;
  isCacheExists: jest.Mock;
  pickDownloadTask: jest.Mock;
}

function createMocks(overrides: Partial<HelperMocks> = {}): HelperMocks {
  return {
    addDownloadTask: jest.fn(() => true),
    downloadResource: jest.fn(async () => undefined),
    isCacheExists: jest.fn(() => false),
    pickDownloadTask: jest.fn(),
    ...overrides,
  };
}

/** 隔离加载 helper，仅依赖 mock 的 features/cache（避免真实 MMKV / 文件系统） */
function loadHelper(mocks: HelperMocks): HelperModule {
  jest.doMock("expo-router", () => ({ router: { navigate: jest.fn() } }));
  jest.doMock("~/features/bilibili", () => ({ getDownloadUrl: jest.fn() }));
  jest.doMock("~/features/cache", () => ({
    addDownloadTask: mocks.addDownloadTask,
    downloadResource: mocks.downloadResource,
    isCacheExists: mocks.isCacheExists,
    pickDownloadTask: mocks.pickDownloadTask,
  }));

  let helper!: HelperModule;
  jest.isolateModules(() => {
    helper = jest.requireActual("../discovery-download");
  });
  return helper;
}

describe("discovery download helpers", () => {
  afterEach(() => {
    jest.dontMock("expo-router");
    jest.dontMock("~/features/bilibili");
    jest.dontMock("~/features/cache");
    jest.resetModules();
  });

  describe("cacheEpisodeToLocal", () => {
    it("reports already-cached without enqueueing a duplicate task", async () => {
      const mocks = createMocks({ isCacheExists: jest.fn(() => true) });
      const helper = loadHelper(mocks);

      await expect(helper.cacheEpisodeToLocal("BV1test", 2, "P2")).resolves.toBe("already-cached");
      expect(mocks.addDownloadTask).not.toHaveBeenCalled();
      expect(mocks.downloadResource).not.toHaveBeenCalled();
    });

    it("reports queued when the same task is already in the download queue", async () => {
      const mocks = createMocks({ addDownloadTask: jest.fn(() => false) });
      const helper = loadHelper(mocks);

      await expect(helper.cacheEpisodeToLocal("BV1test", 2, "P2")).resolves.toBe("queued");
      expect(mocks.downloadResource).not.toHaveBeenCalled();
    });

    it("reports downloaded only when the cache exists after the resource download", async () => {
      const mocks = createMocks({ isCacheExists: jest.fn().mockReturnValueOnce(false).mockReturnValue(true) });
      const helper = loadHelper(mocks);

      await expect(helper.cacheEpisodeToLocal("BV1test", 2, "P2")).resolves.toBe("downloaded");
      expect(mocks.addDownloadTask).toHaveBeenCalledWith("BV1test", 2, "P2");
      expect(mocks.downloadResource).toHaveBeenCalledWith("BV1test", 2);
    });

    it("reports cancelled when the download ends without producing a cache entry", async () => {
      const mocks = createMocks({ isCacheExists: jest.fn(() => false) });
      const helper = loadHelper(mocks);

      await expect(helper.cacheEpisodeToLocal("BV1test", 2, "P2")).resolves.toBe("cancelled");
    });

    it("propagates failures so the caller can report an error instead of success", async () => {
      const mocks = createMocks({ downloadResource: jest.fn(async () => Promise.reject(new Error("网络错误"))) });
      const helper = loadHelper(mocks);

      await expect(helper.cacheEpisodeToLocal("BV1test", 2, "P2")).rejects.toThrow("网络错误");
    });
  });

  describe("cacheVideoEpisodesToLocal", () => {
    it("counts real enqueues and wakes the scheduler once", () => {
      const mocks = createMocks({
        addDownloadTask: jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false).mockReturnValueOnce(true),
      });
      const helper = loadHelper(mocks);

      const result = helper.cacheVideoEpisodesToLocal([
        { id: "BV1test", episode: 1, title: "P1" },
        { id: "BV1test", episode: 2, title: "P2" },
        { id: "BV1test", episode: 3, title: "P3" },
      ]);

      expect(result).toEqual({ added: 2, skipped: 1 });
      expect(mocks.pickDownloadTask).toHaveBeenCalledTimes(1);
    });

    it("does not wake the scheduler when nothing new was enqueued", () => {
      const mocks = createMocks({ addDownloadTask: jest.fn(() => false) });
      const helper = loadHelper(mocks);

      expect(helper.cacheVideoEpisodesToLocal([{ id: "BV1test", episode: 1, title: "P1" }])).toEqual({
        added: 0,
        skipped: 1,
      });
      expect(mocks.pickDownloadTask).not.toHaveBeenCalled();
    });
  });
});
