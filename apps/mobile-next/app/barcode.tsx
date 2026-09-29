import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraView, type BarcodeScanningResult, type PermissionStatus } from "expo-camera";
import { router } from "expo-router";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPortal,
  AlertDialogTitle,
  Button,
  Icon,
  Text,
} from "@bilisound/ui";
import { View, useTheme } from "@tamagui/core";
import { Pressable, StyleSheet } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BRAND } from "~/constants/branding";
import { resolveVideoAndJump } from "~/features/bilibili";
import log from "~/utils/logger";

/**
 * 扫码页：申请摄像头权限、单次扫描二维码并跳转（搬运 v2 `barcode.tsx`）。
 *
 * 识别失败时给出提示，确认后回到查询页；识别成功直接 replace 到目标页面。
 */
export default function BarcodeScreen() {
  const [hasPermission, setHasPermission] = useState<PermissionStatus | null>(null);
  const [scanFailed, setScanFailed] = useState(false);
  const scanned = useRef(false);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const requestPermission = useCallback(async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status);
  }, []);

  useEffect(() => {
    log.info("用户执行扫码操作");
    void requestPermission();
  }, [requestPermission]);

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned.current) {
      return;
    }
    scanned.current = true;
    log.debug(`捕捉到了条形码。type: ${result.type}, data: ${result.data}`);
    try {
      await resolveVideoAndJump(result.data, true);
      log.debug("扫码操作成功");
    } catch (cause) {
      log.error(`扫码操作失败，原因：${cause}`);
      setScanFailed(true);
    }
  };

  return (
    <View backgroundColor="$black" flex={1}>
      <SystemBars style="light" />
      {hasPermission === "granted" ? (
        <CameraView
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        alignItems="center"
        backgroundColor="rgba(0, 0, 0, 0.5)"
        height={64 + insets.top}
        justifyContent="center"
        paddingLeft={insets.left}
        paddingRight={insets.right}
        paddingTop={insets.top}
        position="relative"
        width="100%"
        zIndex={1}
      >
        <Text bold color="$white" size="md">
          扫描二维码
        </Text>
        <Pressable
          accessibilityLabel="返回"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={{ ...styles.backButton, top: 10 + insets.top, left: 10 + insets.left }}
        >
          <Icon color={theme.white.get()} name="fa6-solid:arrow-left" size={20} />
        </Pressable>
      </View>
      {hasPermission === "denied" ? (
        <View alignItems="center" flex={1} gap="$4" justifyContent="center">
          <Text color="$white" size="sm">
            扫码功能需要摄像头权限喵
          </Text>
          <Button onPress={() => void requestPermission()} shape="rounded">
            给予权限
          </Button>
        </View>
      ) : (
        <View flex={1} />
      )}
      <AlertDialog
        onOpenChange={open => {
          if (!open) {
            setScanFailed(false);
          }
        }}
        open={scanFailed}
      >
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>扫描失败</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogBody>
              <AlertDialogDescription>
                {`${BRAND} 无法识别此二维码中的信息，请尝试使用其它的 APP 扫描。`}
              </AlertDialogDescription>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                onPress={() => {
                  setScanFailed(false);
                  router.replace("/");
                }}
                shape="rounded"
              >
                确定
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>
    </View>
  );
}

const styles = {
  backButton: {
    position: "absolute" as const,
    alignItems: "center" as const,
    borderRadius: 8,
    height: 44,
    justifyContent: "center" as const,
    width: 44,
  },
};
