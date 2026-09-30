/**
 * Web accessibility regression for the built-in theme cards in
 * `app/settings/theme.tsx` (the ThemeCard component): toggle-button semantics
 * (`aria-pressed`), Enter/Space activation and a single update per interaction.
 */
import { clickElement, expectNoPropLeak, mount, pressKey, RN_LEAK_ATTRS, ssr } from "./harness";

import ThemeScreen from "~/app/settings/theme";

const mockUpdate = jest.fn();

jest.mock("expo-router", () => ({
  router: { navigate: jest.fn() },
}));

jest.mock("expo-image", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  // Drop metro-only props (contentFit/source) that are not valid DOM attributes.
  return { Image: ({ style }: { style?: unknown }) => React.createElement("img", { alt: "", style }) };
});

jest.mock("~/components/app-layout", () => ({
  AppLayout: ({ children }: { children?: React.ReactNode }) => children,
}));

jest.mock("~/components/confirm-dialog", () => ({ ConfirmDialog: () => null }));

// Tamagui's Sheet opens a portal as soon as it renders, which the server renderer
// rejects. The action menu overlay is not part of these assertions, but the recipe
// module styles `Sheet.Overlay/Frame/Handle`, so the slots must stay components.
jest.mock("@tamagui/sheet", () => {
  const Null = () => null;
  return { Sheet: Object.assign(Null, { Frame: Null, Handle: Null, Overlay: Null }) };
});

jest.mock("~/components/feedback", () => ({ notify: jest.fn(), reportError: jest.fn() }));

jest.mock("~/components/settings-theme-file", () => ({
  exportUserTheme: jest.fn(),
  pickUserTheme: jest.fn(),
}));

jest.mock("~/features/theme/color-scale", () => ({ generateTailwindScale: jest.fn(() => ({})) }));

jest.mock("~/features/theme/editor", () => ({ getYuruCharaAssetId: jest.fn(() => "asset") }));

jest.mock("~/features/theme/registry", () => ({
  findUserTheme: jest.fn(() => false),
  getUserThemeSettingId: jest.fn((id: string) => `user:${id}`),
  useThemeRegistry: () => ({
    deleteTheme: jest.fn(),
    loadThemes: jest.fn(),
    loaded: true,
    saveTheme: jest.fn(),
    themes: [],
  }),
}));

jest.mock("~/features/theme/storage", () => ({ themeStorage: { getThemeAsset: jest.fn() } }));

jest.mock("~/features/config", () => ({
  useAppearanceConfig: () => ({ showYuruChara: true, theme: "classic" }),
  useSettingsActions: () => ({ toggle: jest.fn(), update: mockUpdate }),
}));

jest.mock("~/utils/logger", () => ({
  __esModule: true,
  default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), setSeverity: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

function themeCards(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[role="button"][aria-pressed]'));
}

it("SSR: theme cards are toggle buttons with aria-pressed and no RN prop leak", () => {
  const { html, errors } = ssr(<ThemeScreen />);

  const cardTag = (title: string) => html.match(new RegExp(`<[a-z]+[^>]*aria-label="${title}"[^>]*>`))?.[0] ?? "";

  const classic = cardTag("默认主题");
  expect(classic).toContain('role="button"');
  expect(classic).toContain('aria-pressed="true"');
  expect(classic).toContain('tabindex="0"');

  const red = cardTag("红色主题");
  expect(red).toContain('aria-pressed="false"');
  // The card must not pretend to be a radio: no aria-checked / aria-selected.
  expect(classic + red).not.toContain("aria-checked");
  expect(classic + red).not.toContain("aria-selected");

  expect(html).not.toMatch(RN_LEAK_ATTRS);
  expectNoPropLeak(errors);
});

it("mounted cards are in the tab order and activate once per Space/Enter", async () => {
  const view = await mount(<ThemeScreen />);

  const cards = themeCards(view.container);
  expect(cards).toHaveLength(2);
  for (const card of cards) {
    expect(card.getAttribute("tabindex")).toBe("0");
  }

  const red = cards.find(card => card.getAttribute("aria-label") === "红色主题");
  const space = await pressKey(red as Element, " ");
  expect(space.defaultPrevented).toBe(true);
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  expect(mockUpdate).toHaveBeenCalledWith("theme", "red");

  const classic = cards.find(card => card.getAttribute("aria-label") === "默认主题");
  await pressKey(classic as Element, "Enter");
  expect(mockUpdate).toHaveBeenCalledTimes(2);
  expect(mockUpdate).toHaveBeenLastCalledWith("theme", "classic");

  await view.unmount();
});

it("clicking a card selects it exactly once", async () => {
  const view = await mount(<ThemeScreen />);

  const red = themeCards(view.container).find(card => card.getAttribute("aria-label") === "红色主题");
  await clickElement(red as Element);

  expect(mockUpdate).toHaveBeenCalledTimes(1);
  expect(mockUpdate).toHaveBeenCalledWith("theme", "red");

  await view.unmount();
});
