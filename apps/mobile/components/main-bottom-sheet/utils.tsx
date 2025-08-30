import React, { createContext, useEffect } from "react";
import { TrackData } from "@bilisound/player/build/types";
import { PLACEHOLDER_AUDIO } from "~/constants/playback";
import { useBottomSheetStore } from "~/store/bottom-sheet";
import { router } from "expo-router";
import { BackHandler, Platform } from "react-native";

export const InsidePageContext = createContext(false);

export function isLoading(activeTrack: TrackData | null | undefined, duration: number) {
  return activeTrack?.uri === PLACEHOLDER_AUDIO || duration <= 0;
}

function MainBottomSheetCloseHostInner() {
  const { isOpen, close } = useBottomSheetStore();

  // 拦截系统返回事件
  useEffect(() => {
    const onBackPress = () => {
      // 开启 bottom sheet 时，关闭它
      if (isOpen) {
        close();
        return true;
      }
      // 普通返回
      if (router.canGoBack()) {
        router.back();
      } else {
        BackHandler.exitApp();
      }

      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backHandler.remove();
  }, [isOpen, close]);

  return null;
}

export function MainBottomSheetCloseHost() {
  if (Platform.OS === "web") {
    return null;
  }
  return <MainBottomSheetCloseHostInner />;
}
