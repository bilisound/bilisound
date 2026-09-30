/**
 * Native Button must send a boolean disabled state on every render: RN Android's
 * BaseViewManager only resets View.isEnabled when the state includes that key.
 * Test the real Tamagui native host-prop mapping, not screen-reader behavior.
 * Run with jest.native-a11y.config.js for native exports and SVG transformation.
 */
import * as path from "node:path";
import * as React from "react";
import * as RN from "react-native";
import { setupHooks } from "@tamagui/core";
import { act, create } from "react-test-renderer";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { BilisoundProvider, Button } from "@bilisound/ui";

const coreDistDir = path.dirname(require.resolve("@tamagui/core/native"));
// eslint-disable-next-line @typescript-eslint/no-require-imports -- 绝对路径绕开 exports map；这是设备上真实生效的映射模块
const { createOptimizedView } = require(path.join(coreDistDir, "esm/createOptimizedView.native.js")) as {
  createOptimizedView: (
    children: React.ReactNode,
    viewProps: Record<string, unknown>,
    baseViews: { TextAncestor: unknown },
  ) => React.ReactElement;
};

// @tamagui/core 的 native 入口在 NODE_ENV=test 时会跳过后面的 createOptimizedView 一跳，
// 这里把它装回来，模组与设备同一份 dist 文件。
setupHooks({
  useChildren(elementType: unknown, children: React.ReactNode, viewProps: Record<string, unknown>) {
    if (elementType === (RN as unknown as { View: unknown }).View) {
      return createOptimizedView(children, viewProps, {
        TextAncestor: (RN as unknown as { unstable_TextAncestorContext: unknown }).unstable_TextAncestorContext,
      } as never);
    }
    return undefined;
  },
});

const LABEL = "测试按钮";

type ButtonCaseProps = Pick<React.ComponentProps<typeof Button>, "accessibilityState" | "disabled">;

function renderButton(initial: ButtonCaseProps) {
  let setProps!: (next: ButtonCaseProps) => void;
  function Harness() {
    const [props, set] = React.useState(initial);
    setProps = set;
    return (
      <BilisoundProvider appearance="light">
        <Button accessibilityLabel={LABEL} {...props}>
          删除
        </Button>
      </BilisoundProvider>
    );
  }

  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(<Harness />);
  });

  return {
    renderer,
    update(next: ButtonCaseProps) {
      act(() => setProps(next));
    },
  };
}

function buttonHost(renderer: ReactTestRenderer): ReactTestInstance {
  const matches = renderer.root.findAll(
    node => String(node.type) === "RCTView" && node.props.accessibilityLabel === LABEL,
  );
  if (matches.length !== 1) {
    throw new Error(`expected exactly 1 button RCTView labelled "${LABEL}", got ${matches.length}`);
  }
  return matches[0];
}

function nativeState(renderer: ReactTestRenderer): { disabled?: unknown; selected?: unknown } | undefined {
  return buttonHost(renderer).props.accessibilityState as { disabled?: unknown; selected?: unknown } | undefined;
}

/**
 * RN Android 消费侧的语义模型（react-native 0.86.2 BaseViewManager.java:363-390）：
 * setViewState 在 state 为 null 时直接 return，只有 state 里仍带 "disabled" 键的更新
 * 才会执行 view.setEnabled(!disabled)。返回每一步之后的 View.isEnabled。
 */
function simulateAndroidEnabled(states: ({ disabled?: unknown } | undefined)[]): boolean[] {
  let enabled = true;
  return states.map(state => {
    if (state == null) return enabled;
    if ("disabled" in state) enabled = state.disabled !== true;
    return enabled;
  });
}

it("disabled true→false→true：每次都带布尔 disabled，原生才有复位通道", () => {
  const view = renderButton({ disabled: true });
  const disabledState = nativeState(view.renderer);
  expect(disabledState?.disabled).toBe(true);

  view.update({ disabled: false });
  const enabledState = nativeState(view.renderer);
  expect(enabledState?.disabled).toBe(false);

  view.update({ disabled: true });
  expect(nativeState(view.renderer)?.disabled).toBe(true);

  // 修复前：重新启用后 state 消失（undefined）→ setEnabled(true) 永不发生，模型卡在 false。
  expect(simulateAndroidEnabled([disabledState, enabledState, nativeState(view.renderer)])).toEqual([
    false,
    true,
    false,
  ]);
});

it("disabled true→undefined（调用方不再传）也要复位；未传过 disabled 的按钮同样显式报告 enabled", () => {
  const view = renderButton({ disabled: true });
  expect(nativeState(view.renderer)?.disabled).toBe(true);

  view.update({});
  expect(nativeState(view.renderer)?.disabled).toBe(false);

  // 语义选择：disabled 永远是解析后的布尔，不用历史状态推断，避免一次 true 之后永久残留。
  const fresh = renderButton({});
  expect(nativeState(fresh.renderer)?.disabled).toBe(false);
});

it("调用方 accessibilityState 的其它键（selected 等）保留，disabled 由组件 prop 决定", () => {
  const view = renderButton({ accessibilityState: { selected: true }, disabled: true });
  expect(nativeState(view.renderer)).toMatchObject({ selected: true, disabled: true });

  view.update({ accessibilityState: { selected: true }, disabled: false });
  expect(nativeState(view.renderer)).toMatchObject({ selected: true, disabled: false });
});

it("disabled 仍然阻止交互（宿主元素 pointerEvents）", () => {
  const view = renderButton({ disabled: true });
  expect(buttonHost(view.renderer).props.pointerEvents).toBe("none");

  view.update({ disabled: false });
  expect(buttonHost(view.renderer).props.pointerEvents).not.toBe("none");
});
