/**
 * Web accessibility regression for `components/settings-menu.tsx`.
 *
 * Covers: the real Tamagui pipeline renders `role`/`aria-*` instead of leaking
 * RN accessibility props into the DOM; Enter/Space activate exactly once;
 * disabled / non-interactive rows stay out of the tab order; a nested trailing
 * action button neither activates the row nor nests `<button>` inside `<button>`.
 */
import { Button } from "@bilisound/ui";

import { SettingsMenuItem } from "~/components/settings-menu";

import { clickElement, expectNoPropLeak, mount, pressKey, RN_LEAK_ATTRS, ssr } from "./harness";

async function expectNoLeak(errors: string[]) {
  expectNoPropLeak(errors);
}

describe("SettingsMenuItem on web", () => {
  it("SSR: switch row exposes role=switch + aria-checked and leaks no RN props", () => {
    const { html, errors } = ssr(
      <SettingsMenuItem
        accessibilityRole="switch"
        accessibilityState={{ checked: true }}
        description="文件名前缀变化"
        icon="fa6-solid:link"
        title="使用 av 号"
        onPress={() => {}}
      />,
    );

    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-label="使用 av 号，文件名前缀变化"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('tabindex="0"');
    expect(html).not.toMatch(RN_LEAK_ATTRS);
    void expectNoLeak(errors);
  });

  it("SSR: an off switch reports aria-checked=false, not an omitted attribute", () => {
    const { html, errors } = ssr(
      <SettingsMenuItem
        accessibilityRole="switch"
        accessibilityState={{ checked: false }}
        icon="fa6-solid:link"
        title="关闭状态的开关"
        onPress={() => {}}
      />,
    );

    expect(html).toContain('aria-checked="false"');
    void expectNoLeak(errors);
  });

  it("SSR: button rows and disabled rows never fake checked/selected semantics", () => {
    const buttonRow = ssr(<SettingsMenuItem icon="fa6-solid:gear" title="普通行" onPress={() => {}} />);
    expect(buttonRow.html).toContain('role="button"');
    expect(buttonRow.html).not.toContain("aria-checked");
    void expectNoLeak(buttonRow.errors);

    const disabledRow = ssr(<SettingsMenuItem disabled icon="fa6-solid:gear" title="禁用行" onPress={() => {}} />);
    expect(disabledRow.html).toContain('aria-disabled="true"');
    expect(disabledRow.html).toContain('tabindex="-1"');
    void expectNoLeak(disabledRow.errors);
  });

  it("activates on Enter and Space exactly once per key", async () => {
    const onPress = jest.fn();
    const view = await mount(
      <SettingsMenuItem
        accessibilityRole="switch"
        accessibilityState={{ checked: false }}
        icon="fa6-solid:link"
        title="开关行"
        onPress={onPress}
      />,
    );

    const row = view.container.querySelector('[role="switch"]');
    expect(row).not.toBeNull();
    expect(row?.getAttribute("tabindex")).toBe("0");

    await pressKey(row as Element, "Enter");
    expect(onPress).toHaveBeenCalledTimes(1);

    const space = await pressKey(row as Element, " ");
    expect(onPress).toHaveBeenCalledTimes(2);
    // Space must not scroll the page while activating the row.
    expect(space.defaultPrevented).toBe(true);

    await view.unmount();
  });

  it("ignores keydown bubbling out of a nested action button", async () => {
    const rowPress = jest.fn();
    const nestedPress = jest.fn();
    const view = await mount(
      <SettingsMenuItem
        icon="fa6-solid:paintbrush"
        right={<Button aria-label="打开主题的操作菜单" icon="fa6-solid:ellipsis-vertical" onPress={nestedPress} />}
        title="用户主题"
        onPress={rowPress}
      />,
    );

    const nested = view.container.querySelector('[aria-label="打开主题的操作菜单"]');
    expect(nested).not.toBeNull();
    expect(nested?.tagName).toBe("BUTTON");
    // A row is a div; nesting a <button> inside another <button> would be invalid HTML.
    expect(view.container.querySelector("button button")).toBeNull();

    await pressKey(nested as Element, "Enter");
    expect(rowPress).not.toHaveBeenCalled();

    await view.unmount();
  });

  it("nested action button click does not also run the row action", async () => {
    const rowPress = jest.fn();
    const nestedPress = jest.fn();
    const view = await mount(
      <SettingsMenuItem
        icon="fa6-solid:paintbrush"
        right={<Button aria-label="打开主题的操作菜单" icon="fa6-solid:ellipsis-vertical" onPress={nestedPress} />}
        title="用户主题"
        onPress={rowPress}
      />,
    );

    const nested = view.container.querySelector('[aria-label="打开主题的操作菜单"]');
    await clickElement(nested as Element);

    expect(nestedPress).toHaveBeenCalledTimes(1);
    expect(rowPress).not.toHaveBeenCalled();

    await view.unmount();
  });

  it("still activates when the click lands on the row's own content", async () => {
    const onPress = jest.fn();
    const view = await mount(<SettingsMenuItem icon="fa6-solid:gear" title="行内容" onPress={onPress} />);

    const row = view.container.querySelector('[role="button"]');
    expect(row).not.toBeNull();
    const inner = row?.querySelector("span");
    expect(inner).not.toBeNull();

    await clickElement(inner as Element);
    expect(onPress).toHaveBeenCalledTimes(1);

    await view.unmount();
  });

  it("keeps disabled and non-interactive rows inert and out of the tab order", async () => {
    const onPress = jest.fn();
    const view = await mount(
      <>
        <SettingsMenuItem disabled icon="fa6-solid:gear" title="禁用行" onPress={onPress} />
        <SettingsMenuItem icon="fa6-solid:gear" title="纯展示行" />
      </>,
    );

    const rows = Array.from(view.container.querySelectorAll('[role="button"]'));
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.getAttribute("tabindex")).toBe("-1");
    }
    expect(rows[0].getAttribute("aria-disabled")).toBe("true");

    await pressKey(rows[0], "Enter");
    await clickElement(rows[0]);
    expect(onPress).not.toHaveBeenCalled();

    await view.unmount();
  });
});
