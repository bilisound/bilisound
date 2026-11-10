import type { TrackData } from "@bilisound/player";

const storedTracks: TrackData[] = [{ id: "stored-track", uri: "https://example.com/audio.m4a" }];

describe("ensureQueueRestored", () => {
  afterEach(() => {
    jest.dontMock("@bilisound/player");
    jest.dontMock("react-native");
    jest.dontMock("~/storage/queue");
    jest.dontMock("~/utils/migration/legacy-queue");
    jest.dontMock("~/utils/migration/shuffle-queue");
    jest.dontMock("~/utils/logger");
    jest.dontMock("~/utils/string");
    jest.dontMock("../track-data");
    jest.dontMock("../track-operations");
    jest.dontMock("../queue-snapshot");
    jest.resetModules();
  });

  function setup(tracksInPlayer: TrackData[]) {
    const getTracks = jest.fn().mockResolvedValue(tracksInPlayer);
    const setQueueWithOptions = jest.fn().mockResolvedValue(undefined);
    const setShuffleMode = jest.fn().mockResolvedValue(undefined);
    const clearQueuePlaybackOrder = jest.fn();
    const processTrackDataForLoad = jest.fn();
    const refreshTrack = jest.fn(async (track: TrackData) => track);

    jest.doMock("@bilisound/player", () => ({
      ShuffleMode: { ON: 1, OFF: 0 },
      getTracks,
      setQueueWithOptions,
      setShuffleMode,
    }));
    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    jest.doMock("~/storage/queue", () => ({
      QUEUE_CURRENT_INDEX: "queue_current_index",
      QUEUE_LIST: "queue_list",
      QUEUE_LIST_VERSION: "queue_list_version",
      clearQueuePlaybackOrder,
      getQueuePlaybackOrder: jest.fn(() => null),
      getQueuePlayingMode: jest.fn(() => "normal"),
      queueStorage: {
        getNumber: jest.fn((key: string) => (key === "queue_list_version" ? 2 : 0)),
        getString: jest.fn((key: string) => (key === "queue_list" ? JSON.stringify(storedTracks) : undefined)),
      },
    }));
    jest.doMock("~/utils/migration/legacy-queue", () => ({ handleLegacyQueue: jest.fn() }));
    jest.doMock("~/utils/migration/shuffle-queue", () => ({ cleanupLegacyShuffleKeys: jest.fn() }));
    jest.doMock("~/utils/logger", () => ({
      __esModule: true,
      default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    }));
    jest.doMock("~/utils/string", () => ({ convertToHTTPS: jest.fn((value: string) => value) }));
    jest.doMock("../track-data", () => ({ processTrackDataForLoad }));
    jest.doMock("../track-operations", () => ({ refreshTrack }));
    jest.doMock("../queue-snapshot", () => ({ saveTrackData: jest.fn() }));

    let ensureQueueRestored!: () => Promise<boolean>;
    jest.isolateModules(() => {
      ({ ensureQueueRestored } = jest.requireActual("../queue-persistence"));
    });

    return { ensureQueueRestored, getTracks, setQueueWithOptions, refreshTrack, processTrackDataForLoad };
  }

  it("keeps the native queue when it already has tracks", async () => {
    const { ensureQueueRestored, setQueueWithOptions, refreshTrack } = setup([
      { id: "native-track", uri: "a" },
    ] as TrackData[]);

    await expect(ensureQueueRestored()).resolves.toBe(false);

    expect(setQueueWithOptions).not.toHaveBeenCalled();
    expect(refreshTrack).not.toHaveBeenCalled();
  });

  it("restores the persisted snapshot when the native queue is empty", async () => {
    const { ensureQueueRestored, setQueueWithOptions, refreshTrack } = setup([]);

    await expect(ensureQueueRestored()).resolves.toBe(true);

    expect(refreshTrack).toHaveBeenCalledWith(storedTracks[0]);
    expect(setQueueWithOptions).toHaveBeenCalledWith(storedTracks, {
      beginIndex: 0,
      preservePlaybackState: false,
    });
  });
});
