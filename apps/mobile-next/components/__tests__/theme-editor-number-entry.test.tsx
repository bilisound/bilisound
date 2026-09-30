import { useState } from "react";
import { act, create } from "react-test-renderer";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { NumberEntry } from "~/components/theme-editor-number-entry";

/**
 * 平台输入框替身：本仓库的 Jest 预设无法转译 node_modules/.pnpm 下的 @tamagui（纯 ESM），
 * packages/ui 源码因此不可加载，这里复刻真正决定行为的平台契约：
 *   1. 会触发的事件：`onFocus` / `onBlur` / `onChangeText` / `onSubmitEditing`；
 *   2. 被丢掉的 native-only prop：`onEndEditing`（@tamagui/input 2.4.2 `dist/esm/Input.mjs`
 *      的 “Native-only props (ignored on web)”，web 的 `Input` 不转发也不触发）。
 * 组件若只挂 `onEndEditing`，在 web 上失焦就不提交——这正是回归测试要拦住的缺陷。
 */
jest.mock("@bilisound/ui", () => {
  const ReactModule = jest.requireActual<typeof import("react")>("react");
  return {
    TextInput: (props: Record<string, unknown>) =>
      ReactModule.createElement("mock-platform-input", {
        "aria-label": props["aria-label"],
        onBlur: props.onBlur,
        onChangeText: props.onChangeText,
        onFocus: props.onFocus,
        onSubmitEditing: props.onSubmitEditing,
        value: props.value,
      }),
  };
});

type ModelController = { set?: (value: number) => void };

type HarnessProps = {
  clamp?: (value: number) => number;
  control: ModelController;
  initial: number;
  onCommit: (value: number) => void;
};

function Harness({ clamp, control, initial, onCommit }: HarnessProps) {
  const [value, setValue] = useState(initial);
  control.set = (next: number) => setValue(clamp ? clamp(next) : next);
  return (
    <NumberEntry
      accessibilityLabel="测试数值"
      value={value}
      onCommit={next => {
        onCommit(next);
        control.set?.(next);
      }}
    />
  );
}

function renderHarness({ clamp, initial, onCommit }: Omit<HarnessProps, "control">) {
  const control: ModelController = {};
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(<Harness clamp={clamp} control={control} initial={initial} onCommit={onCommit} />);
  });
  return { control, renderer };
}

/** 替身渲染出的宿主节点：只有白名单 prop 能到达这里，事件也从这里派发。 */
function platformInput(renderer: ReactTestRenderer): ReactTestInstance {
  const matches = renderer.root.findAll(node => String(node.type) === "mock-platform-input");
  expect(matches).toHaveLength(1);
  return matches[0];
}

function display(renderer: ReactTestRenderer): unknown {
  return platformInput(renderer).props.value;
}

function fire(renderer: ReactTestRenderer, event: "onBlur" | "onFocus" | "onSubmitEditing") {
  const handler = platformInput(renderer).props[event];
  expect(handler).toEqual(expect.any(Function));
  act(() => {
    handler({ nativeEvent: { text: "" } });
  });
}

function type(renderer: ReactTestRenderer, text: string) {
  const handler = platformInput(renderer).props.onChangeText;
  expect(handler).toEqual(expect.any(Function));
  act(() => {
    handler(text);
  });
}

function setModel(control: ModelController, value: number) {
  act(() => {
    control.set?.(value);
  });
}

describe("theme editor NumberEntry", () => {
  it("失焦提交输入值，并让显示重新跟随模型（web 不触发 onEndEditing）", () => {
    const onCommit = jest.fn();
    const { control, renderer } = renderHarness({ initial: 0, onCommit });

    expect(platformInput(renderer).props["aria-label"]).toBe("测试数值");
    expect(platformInput(renderer).props.accessibilityLabel).toBeUndefined();
    fire(renderer, "onFocus");
    type(renderer, "42");
    expect(display(renderer)).toBe("42");

    fire(renderer, "onBlur");

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(42);
    expect(display(renderer)).toBe("42");

    // editing 复位后，滑杆 / 重置 / 取消等外部更新会重新同步显示。
    setModel(control, 7);
    expect(display(renderer)).toBe("7");
  });

  it("回车提交越界数值后显示夹取后的模型值，随后的失焦不会重复提交", () => {
    const onCommit = jest.fn();
    const clamp = (value: number) => Math.min(300, Math.max(25, value));
    const { renderer } = renderHarness({ clamp, initial: 100, onCommit });

    fire(renderer, "onFocus");
    type(renderer, "500");
    fire(renderer, "onSubmitEditing");

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(500);
    expect(display(renderer)).toBe("300");

    fire(renderer, "onBlur");
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(display(renderer)).toBe("300");
  });

  it("编辑期间保留不完整输入、不被外部更新覆盖，失焦时回显模型值且不写入", () => {
    const onCommit = jest.fn();
    const { control, renderer } = renderHarness({ initial: 100, onCommit });

    fire(renderer, "onFocus");
    type(renderer, "-");
    expect(display(renderer)).toBe("-");

    setModel(control, 55);
    expect(display(renderer)).toBe("-");

    fire(renderer, "onBlur");
    expect(onCommit).not.toHaveBeenCalled();
    expect(display(renderer)).toBe("55");
  });

  it("回车与失焦提交同一个值只写一次，但之后的真实修改仍会提交", () => {
    const onCommit = jest.fn();
    const { renderer } = renderHarness({ initial: 100, onCommit });

    fire(renderer, "onFocus");
    type(renderer, "100");
    fire(renderer, "onSubmitEditing");
    expect(onCommit).not.toHaveBeenCalled();
    expect(display(renderer)).toBe("100");

    type(renderer, "120");
    fire(renderer, "onBlur");
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(120);
  });
});
