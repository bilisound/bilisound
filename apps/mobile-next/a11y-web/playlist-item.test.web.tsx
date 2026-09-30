/**
 * Web accessibility regression for `components/playlist-item.tsx`.
 *
 * The card hosts a one-shot "open / choose this playlist" action, not a persisted
 * selection: the correct web semantics is a plain named button with no toggle
 * state. The native `accessibilityHint` stays native-only — RNW drops it, and a
 * web hint would need a real `aria-describedby` node this component does not have.
 */
import type { Playlist } from "~/features/playlist";

import { clickElement, expectNoPropLeak, mount, pressKey, RN_LEAK_ATTRS, ssr } from "./harness";
import { pressNativeButtonKey } from "./rnw-button-helpers";
import { PlaylistItem } from "~/components/playlist-item";

jest.mock("~/features/bilibili", () => ({ getVideoImageUrl: (url: string) => url }));

const mockPlaylist: Playlist = {
  id: 1,
  title: "我的歌单",
  color: "#ff0000",
  amount: 3,
  imgUrl: "https://example.com/x.jpg",
  description: null,
  source: null,
  filterRules: null,
  extendedData: null,
};

const mockOnlinePlaylist: Playlist = {
  ...mockPlaylist,
  source: { type: "video", originalTitle: "原始标题", lastSyncAt: 0, bvid: "BV1SRC" },
};

describe("PlaylistItem on web", () => {
  it("SSR: list rows are named buttons without pressed/checked/selected state", () => {
    const { html, errors } = ssr(<PlaylistItem item={mockPlaylist} onPress={() => {}} />);

    expect(html).toContain('role="button"');
    expect(html).toContain('aria-label="我的歌单，3 首歌曲"');
    expect(html).toContain('tabindex="0"');
    expect(html).not.toContain("aria-pressed");
    expect(html).not.toContain("aria-checked");
    expect(html).not.toContain("aria-selected");
    expect(html).not.toMatch(RN_LEAK_ATTRS);
    expectNoPropLeak(errors);

    const online = ssr(<PlaylistItem item={mockOnlinePlaylist} onPress={() => {}} />);
    expect(online.html).toContain('aria-label="在线歌单 我的歌单，3 首歌曲"');
    expectNoPropLeak(online.errors);
  });

  it("grid cards keep the same plain-button semantics and never nest a control", async () => {
    const view = await mount(<PlaylistItem grid item={mockPlaylist} onPress={() => {}} />);

    const buttons = view.container.querySelectorAll("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].getAttribute("aria-label")).toBe("我的歌单，3 首歌曲");
    expect(buttons[0].getAttribute("aria-pressed")).toBeNull();
    expect(buttons[0].querySelector("button")).toBeNull();

    await view.unmount();
  });

  it("activates exactly once per key, via the native button path", async () => {
    const onPress = jest.fn();
    const view = await mount(<PlaylistItem item={mockPlaylist} onPress={onPress} />);

    const button = view.container.querySelector('[role="button"]');
    expect(button?.tagName).toBe("BUTTON");

    // No JS key handler may activate the card: it would double with the browser's
    // own click for the native button.
    await pressKey(button as Element, "Enter");
    expect(onPress).not.toHaveBeenCalled();

    await pressNativeButtonKey(button as Element, "Enter");
    expect(onPress).toHaveBeenCalledTimes(1);

    await pressKey(button as Element, " ");
    expect(onPress).toHaveBeenCalledTimes(1);

    await pressNativeButtonKey(button as Element, " ");
    expect(onPress).toHaveBeenCalledTimes(2);

    await view.unmount();
  });

  it("routes a click on inner content to the card exactly once", async () => {
    const onPress = jest.fn();
    const view = await mount(<PlaylistItem item={mockPlaylist} onPress={onPress} />);

    const button = view.container.querySelector('[role="button"]');
    const inner = button?.querySelector("span");
    expect(inner).not.toBeNull();

    await clickElement(inner as Element);
    expect(onPress).toHaveBeenCalledTimes(1);

    await view.unmount();
  });
});
