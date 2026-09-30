/**
 * Web accessibility regression for the app navigation in
 * `components/app-shell.tsx`: a valid navigation landmark item uses
 * `aria-current="page"` instead of a dangling `role="tab"`/`aria-selected`
 * pair, and the entries are real buttons (keyboard activation for free).
 */
import { router } from "expo-router";

import { AppShell } from "~/components/app-shell";

import { clickElement, expectNoPropLeak, mount, ssr } from "./harness";

jest.mock("expo-router", () => ({
  router: { navigate: jest.fn() },
  usePathname: () => "/",
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock("../components/player-panel", () => ({ PlayerPanel: () => null }));

const mockNavigate = jest.mocked(router.navigate);

beforeEach(() => {
  jest.clearAllMocks();
});

it("SSR: the current destination is aria-current=page and nothing claims to be a tab", () => {
  const { html, errors } = ssr(
    <AppShell>
      <div>内容</div>
    </AppShell>,
  );

  expect(html).toContain('aria-current="page"');
  expect(html).not.toContain('role="tab"');
  expect(html).not.toContain("aria-selected");
  expect(html).not.toMatch(/accessibility(state|label|role)=/i);
  expectNoPropLeak(errors);
});

it("clicking a destination navigates exactly once", async () => {
  const view = await mount(
    <AppShell>
      <div>内容</div>
    </AppShell>,
  );

  const buttons = Array.from(view.container.querySelectorAll("button"));
  const settings = buttons.find(button => button.textContent === "设置");
  expect(settings).toBeDefined();
  // Real <button>: keyboard activation is the browser's own behaviour.
  expect((settings as Element).tagName).toBe("BUTTON");

  await clickElement(settings as Element);
  expect(mockNavigate).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith("/settings");

  await view.unmount();
});
