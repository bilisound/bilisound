import { StyleSheet } from "react-native";
import ColorPicker, { HueSlider, Panel1, Preview } from "reanimated-color-picker";

import { Button, ButtonOuter, ButtonText } from "~/components/ui/button";
import { Modal, ModalBackdrop, ModalContent, ModalFooter, ModalHeader } from "~/components/ui/modal";
import { Text } from "~/components/ui/text";
import type { NativeColorPickerModalProps } from "./native-color-picker-modal";

export function NativeColorPickerModal({
  title,
  visible,
  value,
  onChange,
  onCancel,
  onConfirm,
}: NativeColorPickerModalProps) {
  return (
    <Modal isOpen={visible} size="sm">
      <ModalBackdrop />
      <ModalContent className="gap-4">
        <ModalHeader>
          <Text size="lg" bold>
            {title}
          </Text>
        </ModalHeader>
        <ColorPicker
          value={value}
          adaptSpectrum
          boundedThumb
          sliderThickness={18}
          thumbSize={28}
          style={styles.colorPicker}
          onChangeJS={({ hex }) => onChange(hex)}
          onCompleteJS={({ hex }) => onChange(hex)}
        >
          <Preview />
          <Panel1 />
          <HueSlider />
        </ColorPicker>
        <ModalFooter>
          <ButtonOuter>
            <Button variant="ghost" action="secondary" onPress={onCancel}>
              <ButtonText>取消</ButtonText>
            </Button>
          </ButtonOuter>
          <ButtonOuter>
            <Button onPress={onConfirm}>
              <ButtonText>确定</ButtonText>
            </Button>
          </ButtonOuter>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

const styles = StyleSheet.create({
  colorPicker: { width: "100%", gap: 14 },
});
