import { StyleSheet } from "react-native";
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker";

import {
  Button,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalPortal,
  ModalTitle,
} from "@bilisound/ui";
import type { SettingsColorPickerProps } from "./settings-color-picker";

/**
 * 原生调色板，迁移自 v2 的 `NativeColorPickerModal`：面板内拖动取色，确定后应用 hex。
 * Web 端不使用该组件（见 `settings-color-picker.tsx`）。
 */
export function SettingsColorPicker({
  onCancel,
  onChange,
  onConfirm,
  title,
  value,
  visible,
}: SettingsColorPickerProps) {
  return (
    <Modal open={visible} onOpenChange={open => (open ? undefined : onCancel())}>
      <ModalPortal>
        <ModalBackdrop />
        <ModalContent gap="$4" size="sm">
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
          </ModalHeader>
          <ColorPicker
            adaptSpectrum
            boundedThumb
            sliderThickness={18}
            style={styles.colorPicker}
            thumbSize={28}
            value={value}
            onChangeJS={({ hex }) => onChange(hex)}
            onCompleteJS={({ hex }) => onChange(hex)}
          >
            <Panel1 />
            <HueSlider />
          </ColorPicker>
          <ModalFooter>
            <Button color="neutral" variant="ghost" onPress={onCancel}>
              取消
            </Button>
            <Button onPress={onConfirm}>确定</Button>
          </ModalFooter>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  colorPicker: { gap: 14, width: "100%" },
});
