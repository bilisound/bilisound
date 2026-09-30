import { clampOriginalScale } from "~/features/theme/editor";

/**
 * 主题编辑器看板娘控件的纯数值模型。
 *
 * 编辑器用滑杆替代 v2 的拖拽 / 双指缩放，值域必须保持与 v2 一致：偏移没有上限，
 * 缩放下限是一像素而不是固定 5%。放在无 React 依赖的模块里，便于单元测试。
 */

/** 滑杆的粗调窗口；输入框里的数值不受它限制。 */
export const OFFSET_SLIDER_LIMIT = 300;

/** 与 `clampOriginalScale` 一致的上限（v2 双指缩放同样封顶 300%）。 */
export const SCALE_LIMIT = 300;

const entryPattern = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

/**
 * 解析偏移 / 缩放输入框的文本。空串或不完整输入返回 `null`，
 * 让调用方保留原值而不是写入一个坏数字。
 */
export function parseEditorNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!entryPattern.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** 把数值渲染回输入框，避免浮点噪声。 */
export function formatEditorNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return String(Math.round(value * 1000) / 1000);
}

/**
 * 偏移量在滑杆上的位置。存储值保持 v2 的值域（拖拽本就没有上限），
 * 滑杆自身留在可操作的窗口内。
 */
export function getOffsetSliderValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(OFFSET_SLIDER_LIMIT, Math.max(-OFFSET_SLIDER_LIMIT, value));
}

/**
 * 把缩放值夹进 v2 的值域：动态的一像素下限到 300%，
 * 滑杆与输入框共用同一套语义。
 */
export function resolveScaleEntry(value: number, minScale: number): number {
  return clampOriginalScale(value, minScale);
}
