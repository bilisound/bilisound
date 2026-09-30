import { getMinOriginalScaleForOnePixel } from "~/features/theme/editor";

import {
  OFFSET_SLIDER_LIMIT,
  SCALE_LIMIT,
  formatEditorNumber,
  getOffsetSliderValue,
  parseEditorNumber,
  resolveScaleEntry,
} from "../theme-editor-input";

describe("theme editor numeric input", () => {
  it("keeps offsets outside the ±300 slider window", () => {
    // v2 拖拽没有上限；滑杆只是粗调窗口，输入值必须原样进入表单。
    expect(getOffsetSliderValue(-1240.5)).toBe(-OFFSET_SLIDER_LIMIT);
    expect(getOffsetSliderValue(1240.5)).toBe(OFFSET_SLIDER_LIMIT);
    expect(getOffsetSliderValue(42)).toBe(42);
    expect(parseEditorNumber("-1240.5")).toBe(-1240.5);
  });

  it("uses the v2 dynamic scale floor instead of a fixed 5%", () => {
    const minScale = getMinOriginalScaleForOnePixel(4000, 4000);
    expect(minScale).toBe(0.025);

    // 旧实现（clampOriginalScale 默认下限 5）会把这些值抬到 5。
    expect(resolveScaleEntry(0.5, minScale)).toBe(0.5);
    expect(resolveScaleEntry(0.01, minScale)).toBe(minScale);
    expect(resolveScaleEntry(420, minScale)).toBe(SCALE_LIMIT);
  });

  it("parses signed decimals and ignores partial input", () => {
    expect(parseEditorNumber(" 12.5 ")).toBe(12.5);
    expect(parseEditorNumber("+7")).toBe(7);
    expect(parseEditorNumber(".5")).toBe(0.5);
    expect(parseEditorNumber("-")).toBeNull();
    expect(parseEditorNumber("")).toBeNull();
    expect(parseEditorNumber("1e3")).toBeNull();
    expect(parseEditorNumber("abc")).toBeNull();
  });

  it("formats values for the inputs without float noise", () => {
    expect(formatEditorNumber(-1240.5)).toBe("-1240.5");
    expect(formatEditorNumber(0.125)).toBe("0.125");
    expect(formatEditorNumber(100.000000001)).toBe("100");
    expect(formatEditorNumber(Number.NaN)).toBe("0");
  });
});
