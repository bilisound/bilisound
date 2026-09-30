/**
 * Native mapping check for the cross-platform props the web fix uses.
 *
 * `@tamagui/core` ships the native accessibility mapping as the standalone module
 * `dist/esm/createOptimizedView.native.js`, which the app's native entry
 * (`dist/esm/index.native.js`) imports. This test calls that real module —
 * `createOptimizedView` and `getAccessibilityRoleFromRole` are its exports — and
 * inspects the RN props it produces.
 *
 * (The mapping cannot be exercised through the app's default jest project: that
 * project cannot import Tamagui's ESM builds, and renders through
 * `@tamagui/core/native`, whose bundled DOM internals need a browser runtime.)
 */
import fs from "node:fs";
import path from "node:path";
import { createContext, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

const nativeBundlePath = require.resolve("@tamagui/core/native");
const esmDir = path.join(path.dirname(nativeBundlePath), "esm");
const mappingPath = path.join(esmDir, "createOptimizedView.native.js");

type NativeMapping = {
  createOptimizedView: (
    children: unknown,
    viewProps: Record<string, unknown>,
    baseViews: { TextAncestor: unknown },
  ) => ReactElement;
  getAccessibilityRoleFromRole: (role: string) => string | undefined;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports -- absolute path keeps the package exports map out of the way
const { createOptimizedView, getAccessibilityRoleFromRole } = require(mappingPath) as NativeMapping;

const TextAncestor = createContext(false);

/** Renders only the mapping output (`RCTView`); everything else is stubbed. */
function MappedView({ viewProps }: { viewProps: Record<string, unknown> }) {
  return createOptimizedView(null, viewProps, { TextAncestor });
}

async function renderMapping(viewProps: Record<string, unknown>) {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<MappedView viewProps={viewProps} />);
  });
  return renderer;
}

it("maps the settings-row props to RN accessibility props", async () => {
  const renderer = await renderMapping({
    "aria-checked": true,
    "aria-disabled": true,
    "aria-label": "使用 av 号",
    accessibilityHint: "输入后点击查询按钮打开音视频详情",
    role: "switch",
    tabIndex: 0,
  });

  const node = renderer.root.find(instance => instance.props.accessibilityRole === "switch");
  expect(node.props.accessibilityLabel).toBe("使用 av 号");
  expect(node.props.accessibilityState).toMatchObject({ checked: true, disabled: true });
  expect(node.props.focusable).toBe(true);
  // The native-only hint survives the mapping untouched (web keeps it undefined).
  expect(node.props.accessibilityHint).toBe("输入后点击查询按钮打开音视频详情");

  await act(async () => renderer.unmount());
});

it("does not invent a checked state for button rows", async () => {
  const renderer = await renderMapping({ "aria-label": "普通行", role: "button", tabIndex: 0 });

  const node = renderer.root.find(instance => instance.props.accessibilityRole === "button");
  expect(node.props.accessibilityState).toBeUndefined();

  await act(async () => renderer.unmount());
});

it("maps the roles and live region used by page titles, toasts and alerts", async () => {
  const mapping: [string, string][] = [
    ["alert", "alert"],
    ["button", "button"],
    ["heading", "header"],
    ["radio", "radio"],
    ["switch", "switch"],
    ["tab", "tab"],
  ];

  for (const [role, accessibilityRole] of mapping) {
    expect(getAccessibilityRoleFromRole(role)).toBe(accessibilityRole);
  }

  // Roles Tamagui does not map must not silently become something else.
  expect(getAccessibilityRoleFromRole("navigation")).toBeUndefined();

  const renderer = await renderMapping({ "aria-live": "polite", role: "alert", tabIndex: -1 });
  const node = renderer.root.find(instance => instance.props.accessibilityLiveRegion === "polite");
  expect(node.props.focusable).toBe(false);

  await act(async () => renderer.unmount());
});

it("keeps the fix's props mapped by the file the app's native entry imports", () => {
  const entry = fs.readFileSync(path.join(esmDir, "index.native.js"), "utf8");
  expect(entry).toContain("./createOptimizedView.native.js");

  const mapping = fs.readFileSync(mappingPath, "utf8");
  expect(mapping).toContain('"aria-label": ariaLabel');
  expect(mapping).toContain('case "switch":');
  expect(mapping).toContain('case "heading":');
  expect(mapping).toContain("var f = tabIndex !== void 0 ? !tabIndex : focusable;");
  expect(mapping).toContain("viewProps.accessibilityRole = getAccessibilityRoleFromRole(role);");
});
