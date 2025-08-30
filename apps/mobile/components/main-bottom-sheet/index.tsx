import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useBottomSheetStore } from "~/store/bottom-sheet";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import Toast from "react-native-toast-message";
import { toastConfig } from "~/components/notify-toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEBUG_COLOR } from "./constants";
import { PlayerControl } from "./components/player-control";

export function MainBottomSheet() {
  const edgeInsets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { isOpen, close } = useBottomSheetStore();

  // 主题色调用
  const { colorValue } = useRawThemeValues();

  // 设置可用的快照点（0 = 关闭，1 = 全屏）
  const snapPoints = useMemo(() => ["100%"], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />,
    [],
  );

  useEffect(() => {
    // console.log(isOpen);
    if (isOpen) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isOpen]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      onDismiss={close}
      handleComponent={null}
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: colorValue("--color-background-0"), borderRadius: 0 }}
      activeOffsetY={[-1, 1]}
      failOffsetX={[-5, 5]}
    >
      <BottomSheetView className={"w-full h-full flex-1 " + DEBUG_COLOR[2]}>
        <PlayerControl />
      </BottomSheetView>
      <Toast config={toastConfig} topOffset={edgeInsets.top} />
    </BottomSheetModal>
  );
}
