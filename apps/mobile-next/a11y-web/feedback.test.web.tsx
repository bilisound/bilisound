/**
 * Web accessibility regression for the toast surface in
 * `components/feedback.tsx`: an assertive live region (`role="alert"`) with a
 * labelled close button, no RN-only prop leak.
 */
import Toast from "react-native-toast-message";

import { FeedbackHost } from "~/components/feedback";

import { clickElement, expectNoPropLeak, mount, RN_LEAK_ATTRS, ssr } from "./harness";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock("react-native-toast-message", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  // Render the toast content as if the transport had shown a message.
  const Toast = ({
    config,
  }: {
    config?: Record<string, (props: { text1?: string; text2?: string }) => React.ReactNode>;
  }) => {
    const render = config?.success;
    return render ? React.createElement(React.Fragment, null, render({ text1: "已保存", text2: "详情" })) : null;
  };
  return { __esModule: true, default: Object.assign(Toast, { hide: jest.fn(), show: jest.fn() }) };
});

const mockHide = jest.mocked(Toast.hide);

beforeEach(() => {
  jest.clearAllMocks();
});

it("SSR: the toast is a live region with a labelled close button", () => {
  const { html, errors } = ssr(<FeedbackHost />);

  expect(html).toContain('role="alert"');
  expect(html).not.toMatch(/accessibilityrole/i);
  expect(html).toContain('aria-label="关闭提示"');
  expect(html).not.toMatch(RN_LEAK_ATTRS);
  expectNoPropLeak(errors);
});

it("the close button hides the toast", async () => {
  const view = await mount(<FeedbackHost />);

  const close = view.container.querySelector('[aria-label="关闭提示"]');
  expect(close).not.toBeNull();
  await clickElement(close as Element);
  expect(mockHide).toHaveBeenCalledTimes(1);

  await view.unmount();
});
