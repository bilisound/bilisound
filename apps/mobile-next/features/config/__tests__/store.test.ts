import type { StorageValue } from "zustand/middleware";
import type * as ConfigModule from "../index";
import type * as StoreModule from "../store";

import type { SettingsProps } from "../types";

const v2Settings: SettingsProps = {
  useLegacyID: true,
  downloadNextTrack: false,
  filterResourceURL: false,
  debugMode: true,
  showPlaylistInGrid: true,
  theme: "red",
  showYuruChara: false,
};

describe("settings-store v2 compatibility", () => {
  afterEach(() => {
    jest.dontMock("~/storage/zustand");
    jest.resetModules();
  });

  it("rehydrates every v2 setting and keeps the existing storage key", async () => {
    const persistedValue: StorageValue<SettingsProps> = {
      state: v2Settings,
      version: 0,
    };
    const getItem = jest.fn((name: string) => (name === "settings-store" ? persistedValue : null));
    const setItem = jest.fn();
    const removeItem = jest.fn();

    jest.doMock("~/storage/zustand", () => ({
      createStorage: () => ({ getItem, setItem, removeItem }),
    }));

    let config!: typeof ConfigModule;
    let store!: typeof StoreModule;
    // Static imports would initialize the store before this test installs its v2 storage mock.
    jest.isolateModules(() => {
      config = jest.requireActual<typeof ConfigModule>("../index");
      store = jest.requireActual<typeof StoreModule>("../store");
    });

    await config.rehydrateSettings();

    expect(getItem).toHaveBeenCalledWith("settings-store");
    expect(store.useSettingsStore.getState()).toMatchObject(v2Settings);
    expect(config.getDownloadPolicy()).toEqual({ downloadNextTrack: false });
    expect(config.getResourcePolicy()).toEqual({ filterResourceURL: false, useLegacyID: true });
    expect(config.getDiagnosticsConfig()).toEqual({ debugMode: true });

    store.useSettingsStore.getState().update("theme", "classic");

    expect(setItem).toHaveBeenLastCalledWith(
      "settings-store",
      expect.objectContaining({
        state: expect.objectContaining({
          ...v2Settings,
          theme: "classic",
        }),
      }),
    );
  });
});
