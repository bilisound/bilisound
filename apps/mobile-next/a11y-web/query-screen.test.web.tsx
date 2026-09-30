/**
 * Web accessibility regression for the query screen (`app/index.tsx`):
 * the search field carries a real `aria-label`; the hint stays native-only
 * because there is no description node to reference on web.
 */
import QueryScreen from "~/app/index";

import { expectNoPropLeak, RN_LEAK_ATTRS, ssr } from "./harness";

jest.mock("expo-router", () => ({ router: { navigate: jest.fn() } }));

jest.mock("~/components/app-layout", () => ({
  AppLayout: ({ children }: { children?: React.ReactNode }) => children,
}));

jest.mock("~/features/bilibili", () => ({ resolveVideoAndJump: jest.fn() }));

jest.mock("~/features/bilibili/discovery", () => ({
  normalizeVideoQuery: jest.fn((value: string) => value),
}));

jest.mock("~/utils/logger", () => ({
  __esModule: true,
  default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), setSeverity: jest.fn() },
}));

it("SSR: the query input is labelled and leaks no RN accessibility props", () => {
  const { html, errors } = ssr(<QueryScreen />);

  expect(html).toContain('<input aria-label="视频链接或 ID"');
  expect(html).toContain('placeholder="粘贴完整链接或带前缀 ID 至此"');
  expect(html).not.toMatch(/accessibilityhint/i);
  expect(html).not.toMatch(RN_LEAK_ATTRS);
  expectNoPropLeak(errors);
});
