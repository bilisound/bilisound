/**
 * Web accessibility regression for the shared input surface used by the query
 * page, the playlist filter and the playlist meta form:
 *   - `components/playlist-filter-field.tsx` (label -> aria-label, hint stays native-only)
 *   - `packages/ui` `PageShell` (page title heading) and `LabelError` (live region)
 */
import { PlaylistFilterField } from "~/components/playlist-filter-field";

// The worktree's own ui sources, so the shared-component fixes are exercised.
import { LabelError } from "../../../packages/ui/src/component/label";
import { PageShell } from "../../../packages/ui/src/component/page-shell";

import { expectNoPropLeak, RN_LEAK_ATTRS, ssr } from "./harness";

describe("Text inputs on web", () => {
  it("SSR: PlaylistFilterField exposes the label as aria-label and no leaked hint", () => {
    const { html, errors } = ssr(
      <PlaylistFilterField
        accessibilityHint="输入后筛选歌单"
        accessibilityLabel="过滤歌单"
        onChangeText={() => {}}
        placeholder="搜索歌单"
        value=""
      />,
    );

    expect(html).toContain('<input aria-label="过滤歌单"');
    expect(html).toContain('placeholder="搜索歌单"');
    expect(html).not.toMatch(/accessibilityhint/i);
    expect(html).not.toMatch(RN_LEAK_ATTRS);
    expectNoPropLeak(errors);
  });

  it("SSR: the clear button stays labelled while filtering", () => {
    const { html, errors } = ssr(
      <PlaylistFilterField
        accessibilityHint="输入后筛选歌单"
        accessibilityLabel="过滤歌单"
        onChangeText={() => {}}
        placeholder="搜索歌单"
        resultLabel="共 2 首"
        value="abc"
      />,
    );

    expect(html).toContain('aria-label="清空过滤条件"');
    expect(html).toContain("共 2 首");
    expectNoPropLeak(errors);
  });
});

describe("packages/ui page chrome on web", () => {
  it("SSR: the page title is a labelled heading", () => {
    const { html, errors } = ssr(<PageShell title="设置">页面内容</PageShell>);

    expect(html).toContain('role="heading"');
    expect(html).toContain('aria-label="设置"');
    expect(html).toContain('aria-level="1"');
    expect(html).toContain("页面内容");
    expect(html).not.toMatch(RN_LEAK_ATTRS);
    expectNoPropLeak(errors);
  });

  it("SSR: LabelError is a polite live region without RN-only props", () => {
    const { html, errors } = ssr(<LabelError>请输入名称</LabelError>);

    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toMatch(/accessibilityliveregion/i);
    expectNoPropLeak(errors);
  });
});
