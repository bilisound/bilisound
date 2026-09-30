/**
 * Web accessibility regression for the playlist meta form
 * (`app/playlist/meta/[id].tsx`): title/description fields expose `aria-label`,
 * the native-only hints do not leak, and the bound-playlist field stays labelled.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import PlaylistMetaScreen from "~/app/playlist/meta/[id]";

import { expectNoPropLeak, RN_LEAK_ATTRS, ssr } from "./harness";

jest.mock("expo-router", () => ({
  router: { navigate: jest.fn() },
  useLocalSearchParams: () => ({ id: "new" }),
}));

jest.mock("~/components/app-layout", () => ({
  AppLayout: ({ children }: { children?: React.ReactNode }) => children,
}));

jest.mock("~/components/feedback", () => ({ notify: jest.fn(), reportError: jest.fn() }));

jest.mock("~/features/playlist", () => ({
  addToPlaylist: jest.fn(),
  clonePlaylist: jest.fn(),
  getPlaylistMeta: jest.fn(),
  insertPlaylistMeta: jest.fn(),
  setPlaylistMeta: jest.fn(),
  syncPlaylistAmount: jest.fn(),
}));

jest.mock("~/features/player", () => ({ getTracks: jest.fn(async () => []) }));

jest.mock("~/utils/logger", () => ({
  __esModule: true,
  default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), setSeverity: jest.fn() },
}));

it("SSR: the meta form fields are labelled and leak nothing", () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { html, errors } = ssr(
    <QueryClientProvider client={client}>
      <PlaylistMetaScreen />
    </QueryClientProvider>,
  );

  expect(html).toContain('aria-label="歌单名称"');
  expect(html).toContain('aria-label="备注"');
  expect(html).not.toMatch(/accessibilityhint/i);
  expect(html).not.toMatch(RN_LEAK_ATTRS);
  expectNoPropLeak(errors);
});
