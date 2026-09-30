import { PlaylistEditBar } from "~/components/playlist-edit-bar";
import { clickElement, mount } from "./harness";

const props = {
  selectedCount: 1,
  isEditLocked: false,
  onSelectAll: jest.fn(),
  onSelectReverse: jest.fn(),
  onCopy: jest.fn(),
  onDelete: jest.fn(),
};

it("keeps compact button padding and action wiring for the 312px main pane", async () => {
  const view = await mount(<PlaylistEditBar {...props} />);
  try {
    const buttons = [...view.container.querySelectorAll("button")];
    expect(buttons.map(button => button.textContent)).toEqual(["全选", "反选", "复制", "删除"]);
    // jsdom cannot measure layout; real-browser hit tests verify the resulting fit.
    for (const button of buttons) {
      expect(button.classList.contains("_paddingLeft-t-space-1")).toBe(true);
      expect(button.classList.contains("_paddingRight-t-space-1")).toBe(true);
      expect(button.getAttribute("aria-disabled")).not.toBe("true");
      await clickElement(button);
    }
    expect(buttons[3].getAttribute("aria-label")).toBe("删除选中曲目");
    for (const handler of [props.onSelectAll, props.onSelectReverse, props.onCopy, props.onDelete]) {
      expect(handler).toHaveBeenCalledTimes(1);
    }
  } finally {
    await view.unmount();
  }
});

it("disables destructive/copy actions without a selection and hides delete when locked", async () => {
  const empty = await mount(<PlaylistEditBar {...props} selectedCount={0} />);
  try {
    const buttons = [...empty.container.querySelectorAll("button")];
    expect(buttons.map(button => button.getAttribute("aria-disabled") === "true")).toEqual([false, false, true, true]);
  } finally {
    await empty.unmount();
  }

  const locked = await mount(<PlaylistEditBar {...props} isEditLocked />);
  try {
    expect([...locked.container.querySelectorAll("button")].map(button => button.textContent)).toEqual([
      "全选",
      "反选",
      "复制",
    ]);
    expect(locked.container.querySelector('[aria-label="删除选中曲目"]')).toBeNull();
  } finally {
    await locked.unmount();
  }
});
