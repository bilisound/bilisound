import { BilisoundPlayerModule } from "../BilisoundPlayerModule";
import { setQueue, setQueueWithOptions } from "../player";
import type { TrackData } from "../types";

jest.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

jest.mock("../BilisoundPlayerModule", () => ({
  BilisoundPlayerModule: {
    setQueueWithOptions: jest.fn(() => Promise.resolve()),
  },
}));

const mockSetQueueWithOptions = BilisoundPlayerModule.setQueueWithOptions as jest.Mock;

const tracks: TrackData[] = [
  { id: "first", uri: "https://example.com/first.m4a" },
  { id: "second", uri: "https://example.com/second.m4a" },
];

describe("setQueueWithOptions", () => {
  beforeEach(() => {
    mockSetQueueWithOptions.mockClear();
  });

  it("normalizes omitted transaction options", async () => {
    await setQueueWithOptions(tracks);

    expect(mockSetQueueWithOptions).toHaveBeenCalledWith(tracks, {
      beginIndex: 0,
      position: 0,
      preservePlaybackState: false,
    });
  });

  it("keeps setQueue as the paused zero-position convenience API", async () => {
    await setQueue(tracks, 1);

    expect(mockSetQueueWithOptions).toHaveBeenCalledWith(tracks, {
      beginIndex: 1,
      position: 0,
      preservePlaybackState: false,
    });
  });

  it("rejects an invalid canonical index before touching the player", () => {
    expect(() => setQueueWithOptions(tracks, { beginIndex: 2 })).toThrow(RangeError);
    expect(mockSetQueueWithOptions).not.toHaveBeenCalled();
  });

  it("rejects a negative playback position before touching the player", () => {
    expect(() => setQueueWithOptions(tracks, { position: -1 })).toThrow(RangeError);
    expect(mockSetQueueWithOptions).not.toHaveBeenCalled();
  });
});
