import type { MediaResource } from "~/features/bilibili";

describe("downloadResource cancellation", () => {
  afterEach(() => {
    jest.dontMock("~/store/download");
    jest.dontMock("~/features/bilibili");
    jest.dontMock("~/utils/file");
    jest.dontMock("expo-file-system/legacy");
    jest.dontMock("expo-file-system");
    jest.dontMock("filesize");
    jest.dontMock("~/utils/logger");
    jest.dontMock("~/storage/cache-status");
    jest.dontMock("~/business/mp4");
    jest.resetModules();
  });

  it("does not create a downloader when the task is cancelled while resolving its resource", async () => {
    let resolveResource!: (resource: MediaResource) => void;
    const getMediaResource = jest.fn(
      () =>
        new Promise<MediaResource>(resolve => {
          resolveResource = resolve;
        }),
    );
    const createDownloadResumable = jest.fn(() => ({
      cancelAsync: jest.fn(),
      downloadAsync: jest.fn().mockResolvedValue(undefined),
    }));
    const downloadList = new Map<string, object>([["BV1test_1", {}]]);
    const storeState = {
      downloadList,
      downloadWorker: undefined as ((id: string, episode: number) => Promise<unknown>) | undefined,
      setDownloadWorker: jest.fn((worker: (id: string, episode: number) => Promise<unknown>) => {
        storeState.downloadWorker = worker;
      }),
      updateDownloadItemPartial: jest.fn(),
      removeDownloadItem: jest.fn(),
    };

    jest.doMock("~/store/download", () => ({
      __esModule: true,
      default: { getState: () => storeState },
    }));
    jest.doMock("~/features/bilibili", () => ({
      getMediaResource,
      getVideoUrl: jest.fn(() => "https://www.bilibili.com/video/BV1test"),
    }));
    jest.doMock("~/utils/file", () => ({
      getCacheAudioPath: jest.fn(() => "file:///cache/BV1test_1.m4a"),
    }));
    jest.doMock("expo-file-system/legacy", () => ({ createDownloadResumable }));
    jest.doMock("expo-file-system", () => ({ File: jest.fn() }));
    jest.doMock("filesize", () => ({ filesize: jest.fn(() => "0 B") }));
    jest.doMock("~/utils/logger", () => ({
      __esModule: true,
      default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    }));
    jest.doMock("~/storage/cache-status", () => ({
      isCacheExists: jest.fn(),
      setCacheExists: jest.fn(),
    }));
    jest.doMock("~/business/mp4", () => ({ extractAudioFile: jest.fn() }));

    let downloadResource!: (bvid: string, episode: number) => Promise<void>;
    jest.isolateModules(() => {
      ({ downloadResource } = jest.requireActual("../download"));
    });

    const result = downloadResource("BV1test", 1);
    expect(getMediaResource).toHaveBeenCalledWith("BV1test", 1);

    downloadList.delete("BV1test_1");
    resolveResource({ url: "https://media.example/audio.m4a", isAudio: true });
    await result;

    expect(createDownloadResumable).not.toHaveBeenCalled();
  });
});
