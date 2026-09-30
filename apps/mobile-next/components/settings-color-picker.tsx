export interface SettingsColorPickerProps {
  title: string;
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 主题编辑器的原生调色板占位实现：Web 端继续使用浏览器 `input[type=color]` 色块，
 * 因此这里不渲染任何内容；原生实现见 `settings-color-picker.native.tsx`
 * （对应 v2 的 `NativeColorPickerModal` / `reanimated-color-picker`）。
 */
export function SettingsColorPicker(_props: SettingsColorPickerProps) {
  return null;
}
