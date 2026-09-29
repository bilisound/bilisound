import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import type { AppearanceConfig } from "../types";

import { useAppearanceConfig } from "../selectors";
import { useSettingsStore } from "../store";

jest.mock("~/storage/zustand", () => ({
  createStorage: () => ({
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  }),
}));

describe("config selectors", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: "classic",
      showYuruChara: true,
      showPlaylistInGrid: false,
    });
  });

  it("does not update appearance consumers when playlist view config changes", async () => {
    let appearance: AppearanceConfig | undefined;
    let renderCount = 0;

    function AppearanceProbe() {
      appearance = useAppearanceConfig();
      renderCount += 1;
      return null;
    }

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<AppearanceProbe />);
    });

    expect(appearance).toEqual({ theme: "classic", showYuruChara: true });
    expect(renderCount).toBe(1);
    const originalAppearance = appearance;

    await act(async () => {
      useSettingsStore.getState().toggle("showPlaylistInGrid");
    });

    expect(appearance).toBe(originalAppearance);
    expect(renderCount).toBe(1);

    await act(async () => {
      useSettingsStore.getState().update("theme", "red");
    });

    expect(appearance).toEqual({ theme: "red", showYuruChara: true });
    expect(renderCount).toBe(2);

    await act(async () => {
      renderer.unmount();
    });
  });
});
