/**
 * Web accessibility regression for `app/utils/cover-picker.tsx`.
 *
 * The screen is a chooser: every candidate cover is a one-shot action button
 * ("使用这张封面"), not a persisted toggle, so the assertions lock a plain named
 * button with no pressed/checked/selected fake. The preview dialog is replaced
 * by a portal-free stub because the real AlertDialog renders a portal the SSR
 * renderer cannot produce (and jsdom focus/portal behavior is not the subject
 * here); everything else — Pressable, images, buttons — is the real pipeline.
 */
import type { ReactNode } from "react";

import { clickElement, expectNoPropLeak, mount, pressKey, RN_LEAK_ATTRS, ssr } from "./harness";
import { pressNativeButtonKey } from "./rnw-button-helpers";
import CoverPickerScreen from "~/app/utils/cover-picker";

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), canGoBack: () => false, replace: jest.fn() },
  useLocalSearchParams: () => ({ listId: "1" }),
}));

const mockCoverRows = [
  { imgUrl: "https://example.com/a.jpg" },
  { imgUrl: "https://example.com/b.jpg" },
  { imgUrl: "https://example.com/a.jpg" },
];

jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: mockCoverRows,
    error: null,
    isError: false,
    isPending: false,
    refetch: jest.fn(),
  }),
  useQueryClient: () => ({ refetchQueries: jest.fn() }),
}));

jest.mock("@shopify/flash-list", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    FlashList: (props: {
      data?: readonly unknown[];
      renderItem?: (info: { item: unknown; index: number }) => ReactNode;
    }) =>
      React.createElement(
        "div",
        null,
        (props.data ?? []).map((item, index) =>
          React.createElement("div", { key: index }, props.renderItem?.({ item, index })),
        ),
      ),
  };
});

jest.mock("~/components/app-layout", () => ({
  AppLayout: ({ children }: { children?: ReactNode }) => children,
}));

jest.mock("~/components/feedback", () => ({ notify: jest.fn(), reportError: jest.fn() }));

jest.mock("~/features/playlist", () => ({
  // Mirrors the real one-liner (`features/playlist/cover.ts`).
  collectUniqueCoverImages: (tracks: { imgUrl: string }[] | null | undefined) =>
    Array.from(new Set((tracks ?? []).map(track => track.imgUrl))),
  getPlaylistDetail: jest.fn(async () => []),
  setPlaylistMeta: jest.fn(async () => undefined),
}));

jest.mock("~/features/bilibili", () => ({ getVideoImageUrl: (url: string) => url }));

jest.mock("~/hooks/useWindowSize", () => ({ useWindowSize: () => ({ width: 800, height: 600 }) }));

jest.mock("@bilisound/ui", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const actual = jest.requireActual<Record<string, unknown>>("@bilisound/ui");
  const passthrough = ({ children }: { children?: ReactNode }) => React.createElement(React.Fragment, null, children);
  return {
    ...actual,
    AlertDialog: ({ children, open }: { children?: ReactNode; open?: boolean }) =>
      open ? React.createElement("div", { "data-testid": "cover-preview-dialog" }, children) : null,
    AlertDialogBackdrop: () => null,
    AlertDialogBody: passthrough,
    AlertDialogContent: passthrough,
    AlertDialogFooter: passthrough,
    AlertDialogHeader: passthrough,
    AlertDialogPortal: passthrough,
    AlertDialogTitle: passthrough,
  };
});

const COVER_NAME_ATTR = 'aria-label="使用这张封面"';
const COVER_NAME = `[${COVER_NAME_ATTR}]`;
const PREVIEW = '[data-testid="cover-preview-dialog"]';

/** All preview-image sources currently mounted inside the stubbed dialog. */
function previewSources(container: HTMLElement) {
  return Array.from(container.querySelectorAll(`${PREVIEW} img`)).map(img => img.getAttribute("src"));
}

describe("CoverPicker on web", () => {
  it("SSR: each candidate cover is a plain named button without toggle state", () => {
    const { html, errors } = ssr(<CoverPickerScreen />);

    expect(html.split(COVER_NAME_ATTR).length - 1).toBe(2);
    expect(html).toContain('role="button"');
    expect(html).not.toContain("aria-pressed");
    expect(html).not.toContain("aria-checked");
    expect(html).not.toContain("aria-selected");
    expect(html).not.toMatch(RN_LEAK_ATTRS);
    expectNoPropLeak(errors);
  });

  it("activates once per key through the native button path and never nests a control", async () => {
    const view = await mount(<CoverPickerScreen />);
    const covers = view.container.querySelectorAll(COVER_NAME);
    expect(covers).toHaveLength(2);
    for (const cover of Array.from(covers)) {
      expect(cover.tagName).toBe("BUTTON");
      expect(cover.getAttribute("aria-pressed")).toBeNull();
      expect(cover.getAttribute("tabindex")).toBe("0");
    }
    expect(view.container.querySelector(PREVIEW)).toBeNull();

    // keydown alone must not activate: a JS key handler would double with the
    // browser's synthesized click for the native button.
    await pressKey(covers[0], "Enter");
    expect(view.container.querySelector(PREVIEW)).toBeNull();

    await pressNativeButtonKey(covers[0], "Enter");
    // jsdom never finishes expo-image's web transition, so the dialog can keep
    // both the previous and the new <img> node mounted; assert the activated
    // source is present instead of a single-node query.
    expect(previewSources(view.container)).toContain("https://example.com/a.jpg");

    await pressNativeButtonKey(covers[1], " ");
    expect(previewSources(view.container)).toContain("https://example.com/b.jpg");

    expect(view.container.querySelectorAll("button button")).toHaveLength(0);
    await view.unmount();
  });

  it("routes a click on the cover image itself to its button", async () => {
    const view = await mount(<CoverPickerScreen />);
    const image = view.container.querySelector(`${COVER_NAME} img`);
    expect(image).not.toBeNull();

    await clickElement(image as Element);
    expect(previewSources(view.container)).toContain("https://example.com/a.jpg");

    await view.unmount();
  });
});
