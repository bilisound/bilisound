import { useEffect, useState } from "react";

import { TextInput } from "@bilisound/ui";

import { formatEditorNumber, parseEditorNumber } from "./theme-editor-input";

/**
 * 滑杆旁的数值输入。滑杆保留易操作的窗口，输入不受该窗口限制（v2 拖拽本就没有偏移上限）；
 * 缩放由调用方按 v2 的动态下限夹取。
 *
 * 结束编辑（回车 / 失焦）必须走 `onBlur`：Tamagui 的 web `Input` 把 `onEndEditing`
 * 当作 native-only prop 直接丢弃（@tamagui/input 2.4.2 `dist/esm/Input.mjs`），
 * 只挂它会导致 web 上“点走不提交，且 `editing` 永不复位、显示不再跟随模型”。
 */
export function NumberEntry({
  accessibilityLabel,
  onCommit,
  value,
}: {
  accessibilityLabel: string;
  onCommit: (value: number) => void;
  value: number;
}) {
  const formatted = formatEditorNumber(value);
  const [text, setText] = useState(formatted);
  const [editing, setEditing] = useState(false);

  // 编辑期间保留用户正在输入的原文（包括 "-"、"." 这类不完整数值），结束编辑后才跟随模型。
  useEffect(() => {
    if (!editing) {
      setText(formatted);
    }
  }, [editing, formatted]);

  function commit() {
    const parsed = parseEditorNumber(text);
    if (parsed === null) {
      setText(formatted);
      return;
    }
    // 回车后紧接着失焦会对同一个值再提交一次；与模型一致时跳过，避免重复写入。
    if (parsed !== value) {
      onCommit(parsed);
    }
  }

  function endEditing() {
    setEditing(false);
    commit();
  }

  return (
    <TextInput
      aria-label={accessibilityLabel}
      keyboardType="numbers-and-punctuation"
      returnKeyType="done"
      textAlign="right"
      value={text}
      width={110}
      onBlur={endEditing}
      onFocus={() => setEditing(true)}
      onSubmitEditing={endEditing}
      onChangeText={setText}
    />
  );
}
