import type { PlaylistDetail } from "~/features/playlist";

describe("appendPlaylistToCurrentQueue", () => {
  afterEach(() => {
    jest.dontMock("@bilisound/player");
    jest.dontMock("react-native");
    jest.dontMock("~/storage/queue");
    jest.dontMock("~/features/bilibili");
    jest.dontMock("~/constants/network");
    jest.dontMock("~/utils/file");
    jest.dontMock("~/utils/logger");
    jest.dontMock("~/storage/cache-status");
    jest.dontMock("~/constants/playback");
    jest.dontMock("~/features/playlist");
    jest.dontMock("~/storage/playlist");
    jest.dontMock("~/store/error-message");
    jest.dontMock("../queue-snapshot");
    jest.dontMock("../track-data");
    jest.resetModules();
  });

  it("only appends owned tracks and persists them after the player update", async () => {
    const addTracks = jest.fn().mockResolvedValue(undefined);
    const saveTrackData = jest.fn().mockResolvedValue(undefined);
    const getQueueOwner = jest.fn((): string | undefined => undefined);
    const convertedTracks = [{ id: "converted-track" }];
    const playlistToTracks = jest.fn(() => convertedTracks);

    jest.doMock("@bilisound/player", () => ({
      addTracks,
      RepeatMode: { ONE: "one" },
      ShuffleMode: { OFF: "off" },
    }));
    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    jest.doMock("~/storage/queue", () => ({ setQueuePlayingMode: jest.fn() }));
    jest.doMock("~/features/bilibili", () => ({
      getMediaResource: jest.fn(),
      getVideoImageUrl: jest.fn(),
      getVideoMetadata: jest.fn(),
      getVideoUrl: jest.fn(),
    }));
    jest.doMock("~/constants/network", () => ({ USER_AGENT_BILIBILI: "test-agent" }));
    jest.doMock("~/utils/file", () => ({ getCacheAudioPath: jest.fn() }));
    jest.doMock("~/utils/logger", () => ({
      __esModule: true,
      default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    }));
    jest.doMock("~/storage/cache-status", () => ({
      getCacheStatusKey: jest.fn(),
      isCacheExists: jest.fn(() => false),
    }));
    jest.doMock("~/constants/playback", () => ({ URI_EXPIRE_DURATION: 1 }));
    jest.doMock("~/features/playlist", () => ({ getPlaylistDetail: jest.fn() }));
    jest.doMock("~/storage/playlist", () => ({
      invalidateOnQueueStatus: jest.fn(),
      PLAYLIST_ON_QUEUE: "playlist_on_queue",
      PLAYLIST_RESTORE_LOOP_ONCE: "playlist_restore_loop_once",
      playlistStorage: {
        getBoolean: jest.fn(),
        getString: getQueueOwner,
        set: jest.fn(),
      },
    }));
    jest.doMock("~/store/error-message", () => ({
      __esModule: true,
      default: { getState: () => ({ setMessage: jest.fn() }) },
    }));
    jest.doMock("../track-data", () => ({ playlistToTracks }));
    jest.doMock("../queue-snapshot", () => ({ saveTrackData }));

    let appendPlaylistToCurrentQueue!: (playlistId: number, playlistDetail: PlaylistDetail[]) => Promise<void>;
    jest.isolateModules(() => {
      ({ appendPlaylistToCurrentQueue } = jest.requireActual("../track-operations"));
    });

    const playlistDetail = [{} as PlaylistDetail];

    await appendPlaylistToCurrentQueue(2, playlistDetail);
    getQueueOwner.mockReturnValue(JSON.stringify({ value: { id: 1 } }));
    await appendPlaylistToCurrentQueue(2, playlistDetail);

    expect(playlistToTracks).not.toHaveBeenCalled();
    expect(addTracks).not.toHaveBeenCalled();
    expect(saveTrackData).not.toHaveBeenCalled();

    getQueueOwner.mockReturnValue(JSON.stringify({ value: { id: 2 } }));
    await appendPlaylistToCurrentQueue(2, playlistDetail);

    expect(playlistToTracks).toHaveBeenCalledTimes(1);
    expect(playlistToTracks).toHaveBeenCalledWith(playlistDetail);
    expect(addTracks).toHaveBeenCalledTimes(1);
    expect(addTracks).toHaveBeenCalledWith(convertedTracks);
    expect(saveTrackData).toHaveBeenCalledTimes(1);
    expect(addTracks.mock.invocationCallOrder[0]).toBeLessThan(saveTrackData.mock.invocationCallOrder[0]);
  });
});
