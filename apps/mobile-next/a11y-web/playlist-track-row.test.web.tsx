/**
 * Web accessibility regression for `components/playlist-track-row.tsx`.
 *
 * The row is a react-native-web `Pressable`: on web it renders as a real
 * `<button>`, so Space/Enter keep the browser's single native activation. What
 * used to be silently dropped on web is the edit-mode selection state
 * (`accessibilityState` is not in RNW's forwarded props); it is now exposed as
 * `aria-pressed` on the button role. A non-edit row must stay a plain button,
 * and native keeps its existing `selected` state.
 */
import { clickElement, expectNoPropLeak, mount, pressKey, RN_LEAK_ATTRS, ssr } from "./harness";
import { pressNativeButtonKey } from "./rnw-button-helpers";
import { PlaylistTrackRow } from "~/components/playlist-track-row";

jest.mock("~/features/cache", () => ({ useCacheExists: () => false }));

jest.mock("~/features/player", () => ({
  useCurrentTrack: () => null,
  useIsPlaying: () => false,
  usePlaybackState: () => undefined,
  toggle: jest.fn(),
}));

const mockTrack = { author: "阿婆主", bvid: "BV1TEST", duration: 61, episode: 1, title: "测试曲目" };

describe("PlaylistTrackRow on web", () => {
  it("SSR: a checked edit-mode row exposes role=button + aria-pressed=true and no fake checkbox/radio", () => {
    const { html, errors } = ssr(
      <PlaylistTrackRow data={mockTrack} index={3} isChecking isChecked onToggle={() => {}} />,
    );
    expect(html).toContain('role="button"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="第 3 首，测试曲目"');
    expect(html).toContain('tabindex="0"');
    expect(html).not.toContain("aria-checked");
    expect(html).not.toContain("aria-selected");
    expect(html).not.toMatch(RN_LEAK_ATTRS);
    expectNoPropLeak(errors);
  });

  it("SSR: an unchecked edit-mode row reports aria-pressed=false, not an omitted attribute", () => {
    const { html, errors } = ssr(
      <PlaylistTrackRow data={mockTrack} index={3} isChecking isChecked={false} onToggle={() => {}} />,
    );
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain("aria-checked");
    expect(html).not.toContain("aria-selected");
    expectNoPropLeak(errors);
  });

  it("SSR: a non-edit row stays a plain button without toggle state", () => {
    const { html, errors } = ssr(<PlaylistTrackRow data={mockTrack} index={3} onRequestPlay={() => {}} />);

    expect(html).toContain('role="button"');
    expect(html).toContain('aria-label="第 3 首，测试曲目"');
    expect(html).not.toContain("aria-pressed");
    expect(html).not.toContain("aria-checked");
    expect(html).not.toContain("aria-selected");
    expect(html).not.toMatch(RN_LEAK_ATTRS);
    expectNoPropLeak(errors);
  });

  it("activates the edit-mode toggle exactly once per key, via the native button path", async () => {
    const onToggle = jest.fn();
    const view = await mount(<PlaylistTrackRow data={mockTrack} index={3} isChecking isChecked onToggle={onToggle} />);

    const row = view.container.querySelector('[role="button"]');
    expect(row).not.toBeNull();
    expect(row?.tagName).toBe("BUTTON");
    expect(row?.getAttribute("aria-pressed")).toBe("true");
    expect(row?.getAttribute("tabindex")).toBe("0");

    // keydown only starts RNW's pressed state; activation must come from the
    // click the browser synthesizes for the native button, so a JS key handler
    // that fired here would double-activate in a real browser.
    await pressKey(row as Element, "Enter");
    expect(onToggle).not.toHaveBeenCalled();

    await pressNativeButtonKey(row as Element, "Enter");
    expect(onToggle).toHaveBeenCalledTimes(1);

    await pressKey(row as Element, " ");
    expect(onToggle).toHaveBeenCalledTimes(1);

    await pressNativeButtonKey(row as Element, " ");
    expect(onToggle).toHaveBeenCalledTimes(2);

    await view.unmount();
  });

  it("keeps the play action (not the toggle) on non-edit rows", async () => {
    const onRequestPlay = jest.fn();
    const onToggle = jest.fn();
    const view = await mount(
      <PlaylistTrackRow data={mockTrack} index={3} onRequestPlay={onRequestPlay} onToggle={onToggle} />,
    );

    const row = view.container.querySelector('[role="button"]');
    expect(row?.getAttribute("aria-pressed")).toBeNull();

    await pressNativeButtonKey(row as Element, "Enter");
    expect(onRequestPlay).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();

    await view.unmount();
  });

  it("routes a click on inner content to the row once and holds no nested control", async () => {
    const onToggle = jest.fn();
    const view = await mount(<PlaylistTrackRow data={mockTrack} index={3} isChecking isChecked onToggle={onToggle} />);

    const row = view.container.querySelector('[role="button"]');
    const inner = row?.querySelector("span");
    expect(inner).not.toBeNull();
    // A `<button>` cannot nest another control; the row is the only one.
    expect(view.container.querySelectorAll("button")).toHaveLength(1);
    expect(row?.querySelector("button")).toBeNull();

    await clickElement(inner as Element);
    expect(onToggle).toHaveBeenCalledTimes(1);

    await view.unmount();
  });
});
