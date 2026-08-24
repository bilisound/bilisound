import { Portal } from "@gorhom/portal";
import { Image as ExpoImage } from "expo-image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, ButtonMonIcon, ButtonOuter, ButtonText } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import {
  clampOriginalScale,
  getMinOriginalScaleForOnePixel,
  getYuruCharaRenderMetrics,
  withYuruCharaDefaults,
} from "~/features/theme/editor";
import type { UserTheme, YuruCharaLayout } from "~/features/theme/types";
import { useWindowSize } from "~/hooks/useWindowSize";

export const EDITOR_MASCOT_PORTAL_HOST = "editor-mascot-background";

type EditorMascotBackgroundProps = {
  layout: UserTheme["yuruChara"];
  uri: string | null;
  editable?: boolean;
  onChange?: (patch: Partial<YuruCharaLayout>) => void;
  onCancel?: () => void;
  onReset?: () => void;
  onDone?: () => void;
};

const anchorLabels: Record<string, string> = {
  "left-top": "左上",
  "center-top": "上方",
  "right-top": "右上",
  "left-center": "左侧",
  "center-center": "居中",
  "right-center": "右侧",
  "left-bottom": "左下",
  "center-bottom": "下方",
  "right-bottom": "右下",
};

const mascotClassName = "absolute z-10";

export function EditorMascotBackground({
  layout,
  uri,
  editable = false,
  onChange,
  onCancel,
  onReset,
  onDone,
}: EditorMascotBackgroundProps) {
  const frame = useWindowSize();
  const insets = useSafeAreaInsets();
  const [loadedImageSize, setLoadedImageSize] = useState<{ width: number; height: number } | null>(null);
  const [overlaySize, setOverlaySize] = useState(frame);
  const wasEditableRef = useRef(editable);

  const leftRef = useSharedValue(0);
  const topRef = useSharedValue(0);
  const scaleRef = useSharedValue(layout?.originalScale ?? 100);
  const anchorXRef = useSharedValue(0.5);
  const anchorYRef = useSharedValue(0.5);
  const referenceXRef = useSharedValue(frame.width / 2);
  const referenceYRef = useSharedValue(frame.height / 2);
  const imageWidthRef = useSharedValue(0);
  const imageHeightRef = useSharedValue(0);

  const startLeftRef = useSharedValue(0);
  const startTopRef = useSharedValue(0);
  const startScaleRef = useSharedValue(100);
  const startFocalXRef = useSharedValue(0);
  const startFocalYRef = useSharedValue(0);
  const pinchImagePointXRef = useSharedValue(-1);
  const pinchImagePointYRef = useSharedValue(-1);
  const skipPanCommitRef = useSharedValue(false);

  useEffect(() => {
    const enteringEditable = editable && !wasEditableRef.current;
    const effectiveLayout = layout ?? withYuruCharaDefaults({} as UserTheme);
    const imageWidth = effectiveLayout.imageWidth > 0 ? effectiveLayout.imageWidth : (loadedImageSize?.width ?? 0);
    const imageHeight = effectiveLayout.imageHeight > 0 ? effectiveLayout.imageHeight : (loadedImageSize?.height ?? 0);
    const anchorX = effectiveLayout.align === "left" ? 0 : effectiveLayout.align === "right" ? 1 : 0.5;
    const anchorY = effectiveLayout.verticalAlign === "top" ? 0 : effectiveLayout.verticalAlign === "bottom" ? 1 : 0.5;
    const referenceX =
      effectiveLayout.align === "left"
        ? 0
        : effectiveLayout.align === "right"
          ? overlaySize.width
          : overlaySize.width / 2;
    const referenceY =
      effectiveLayout.verticalAlign === "top"
        ? 0
        : effectiveLayout.verticalAlign === "bottom"
          ? overlaySize.height
          : overlaySize.height / 2;
    anchorXRef.value = anchorX;
    anchorYRef.value = anchorY;
    referenceXRef.value = referenceX;
    referenceYRef.value = referenceY;
    imageWidthRef.value = imageWidth;
    imageHeightRef.value = imageHeight;
    if (!editable || enteringEditable) {
      const scale = clampOriginalScale(
        effectiveLayout.originalScale ?? 100,
        getMinOriginalScaleForOnePixel(imageWidth, imageHeight),
      );
      const scaleRatio = scale / 100;
      scaleRef.value = scale;
      leftRef.value = referenceX + (effectiveLayout.offsetX ?? 0) - imageWidth * scaleRatio * anchorX;
      topRef.value = referenceY + (effectiveLayout.offsetY ?? 0) - imageHeight * scaleRatio * anchorY;
    }
    wasEditableRef.current = editable;
  }, [
    editable,
    layout,
    loadedImageSize,
    overlaySize,
    leftRef,
    topRef,
    scaleRef,
    anchorXRef,
    anchorYRef,
    referenceXRef,
    referenceYRef,
    imageWidthRef,
    imageHeightRef,
  ]);

  const handleChange = useCallback(
    (patch: Partial<YuruCharaLayout>) => {
      onChange?.(patch);
    },
    [onChange],
  );

  const handleOverlayLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setOverlaySize({ width, height });
  }, []);

  const handleReset = useCallback(() => {
    scaleRef.value = 100;
    leftRef.value = referenceXRef.value - imageWidthRef.value * anchorXRef.value;
    topRef.value = referenceYRef.value - imageHeightRef.value * anchorYRef.value;
    onReset?.();
  }, [
    leftRef,
    topRef,
    scaleRef,
    referenceXRef,
    referenceYRef,
    imageWidthRef,
    imageHeightRef,
    anchorXRef,
    anchorYRef,
    onReset,
  ]);

  const animatedImageStyle = useAnimatedStyle(() => {
    const scaleRatio =
      clampOriginalScale(scaleRef.value, getMinOriginalScaleForOnePixel(imageWidthRef.value, imageHeightRef.value)) /
      100;
    const width = Math.max(1, imageWidthRef.value * scaleRatio);
    const height = Math.max(1, imageHeightRef.value * scaleRatio);
    return {
      width,
      height,
      left: leftRef.value,
      top: topRef.value,
    };
  });

  useEffect(() => {
    if (Platform.OS !== "web" || !editable) return;
    const win = typeof window !== "undefined" ? window : null;
    if (!win) return;
    function handleWheelEvent(event: WheelEvent) {
      event.preventDefault();
      const minScale = getMinOriginalScaleForOnePixel(imageWidthRef.value, imageHeightRef.value);
      const startScale = clampOriginalScale(scaleRef.value, minScale);
      const nextScale = clampOriginalScale(startScale * (1 - event.deltaY * 0.001), minScale);
      const startScaleRatio = startScale / 100;
      const nextScaleRatio = nextScale / 100;
      const focalImagePointX = startScaleRatio > 0 ? (event.clientX - leftRef.value) / startScaleRatio : 0;
      const focalImagePointY = startScaleRatio > 0 ? (event.clientY - topRef.value) / startScaleRatio : 0;
      const nextLeft = event.clientX - focalImagePointX * nextScaleRatio;
      const nextTop = event.clientY - focalImagePointY * nextScaleRatio;
      scaleRef.value = nextScale;
      leftRef.value = nextLeft;
      topRef.value = nextTop;
      handleChange({
        originalScale: nextScale,
        offsetX: nextLeft - referenceXRef.value + imageWidthRef.value * nextScaleRatio * anchorXRef.value,
        offsetY: nextTop - referenceYRef.value + imageHeightRef.value * nextScaleRatio * anchorYRef.value,
      });
    }
    win.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => win.removeEventListener("wheel", handleWheelEvent);
  }, [
    editable,
    handleChange,
    scaleRef,
    leftRef,
    topRef,
    anchorXRef,
    anchorYRef,
    referenceXRef,
    referenceYRef,
    imageWidthRef,
    imageHeightRef,
  ]);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .minDistance(8)
      .maxPointers(1)
      .onStart(() => {
        skipPanCommitRef.value = false;
        startLeftRef.value = leftRef.value;
        startTopRef.value = topRef.value;
      })
      .onChange(event => {
        leftRef.value = startLeftRef.value + event.translationX;
        topRef.value = startTopRef.value + event.translationY;
      })
      .onEnd(() => {
        if (!skipPanCommitRef.value) {
          const scaleRatio =
            clampOriginalScale(
              scaleRef.value,
              getMinOriginalScaleForOnePixel(imageWidthRef.value, imageHeightRef.value),
            ) / 100;
          runOnJS(handleChange)({
            offsetX: leftRef.value - referenceXRef.value + imageWidthRef.value * scaleRatio * anchorXRef.value,
            offsetY: topRef.value - referenceYRef.value + imageHeightRef.value * scaleRatio * anchorYRef.value,
          });
        }
      });

    const pinch = Gesture.Pinch()
      .onStart(() => {
        skipPanCommitRef.value = true;
        startScaleRef.value = clampOriginalScale(
          scaleRef.value,
          getMinOriginalScaleForOnePixel(imageWidthRef.value, imageHeightRef.value),
        );
        startLeftRef.value = leftRef.value;
        startTopRef.value = topRef.value;
        startFocalXRef.value = 0;
        startFocalYRef.value = 0;
        pinchImagePointXRef.value = -1;
        pinchImagePointYRef.value = -1;
      })
      .onChange(event => {
        const minScale = getMinOriginalScaleForOnePixel(imageWidthRef.value, imageHeightRef.value);
        const nextScale = clampOriginalScale(startScaleRef.value * event.scale, minScale);
        const startScaleRatio = startScaleRef.value / 100;
        const nextScaleRatio = nextScale / 100;
        if (pinchImagePointXRef.value < 0 || pinchImagePointYRef.value < 0) {
          startFocalXRef.value = event.focalX;
          startFocalYRef.value = event.focalY;
          pinchImagePointXRef.value =
            startScaleRatio > 0 ? (startFocalXRef.value - startLeftRef.value) / startScaleRatio : 0;
          pinchImagePointYRef.value =
            startScaleRatio > 0 ? (startFocalYRef.value - startTopRef.value) / startScaleRatio : 0;
        }
        const nextLeft = startFocalXRef.value - pinchImagePointXRef.value * nextScaleRatio;
        const nextTop = startFocalYRef.value - pinchImagePointYRef.value * nextScaleRatio;
        scaleRef.value = nextScale;
        leftRef.value = nextLeft;
        topRef.value = nextTop;
      })
      .onEnd(() => {
        const scale = clampOriginalScale(
          scaleRef.value,
          getMinOriginalScaleForOnePixel(imageWidthRef.value, imageHeightRef.value),
        );
        const scaleRatio = scale / 100;
        runOnJS(handleChange)({
          originalScale: scale,
          offsetX: leftRef.value - referenceXRef.value + imageWidthRef.value * scaleRatio * anchorXRef.value,
          offsetY: topRef.value - referenceYRef.value + imageHeightRef.value * scaleRatio * anchorYRef.value,
        });
      });

    return Gesture.Simultaneous(pan, pinch);
  }, [
    handleChange,
    leftRef,
    topRef,
    scaleRef,
    startLeftRef,
    startTopRef,
    startScaleRef,
    startFocalXRef,
    startFocalYRef,
    anchorXRef,
    anchorYRef,
    referenceXRef,
    referenceYRef,
    imageWidthRef,
    imageHeightRef,
    pinchImagePointXRef,
    pinchImagePointYRef,
    skipPanCommitRef,
  ]);

  const imageStyle = useMemo(() => {
    if (!uri) return null;

    const effectiveLayout = layout ?? withYuruCharaDefaults({} as UserTheme);
    const metrics = getYuruCharaRenderMetrics(effectiveLayout, frame, loadedImageSize);

    return {
      contentFit: metrics.contentFit,
      opacity: effectiveLayout.opacity,
      className: [
        mascotClassName,
        effectiveLayout.align === "left" && "left-0",
        effectiveLayout.align === "center" && "left-1/2",
        effectiveLayout.align === "right" && "right-0",
        effectiveLayout.verticalAlign === "top" && "top-0",
        effectiveLayout.verticalAlign === "center" && "top-1/2",
        effectiveLayout.verticalAlign === "bottom" && "bottom-0",
      ]
        .filter(Boolean)
        .join(" "),
      style: [
        { width: metrics.width, height: metrics.height },
        effectiveLayout.align === "center" && { marginLeft: -metrics.width / 2 },
        effectiveLayout.verticalAlign === "center" && { marginTop: -metrics.height / 2 },
        { transform: [{ translateX: effectiveLayout.offsetX }, { translateY: effectiveLayout.offsetY }] },
      ] as StyleProp<ViewStyle>,
    };
  }, [frame, layout, loadedImageSize, uri]);

  const anchorLabel = useMemo(() => {
    const effectiveLayout = layout ?? withYuruCharaDefaults({} as UserTheme);
    return anchorLabels[`${effectiveLayout.align}-${effectiveLayout.verticalAlign}`] ?? "未知";
  }, [layout]);

  if (!uri || !imageStyle) return null;

  return (
    <Portal hostName={EDITOR_MASCOT_PORTAL_HOST}>
      <View
        pointerEvents={editable ? "auto" : "none"}
        className="absolute inset-0 z-[100]"
        style={{ elevation: 100 }}
        onLayout={handleOverlayLayout}
      >
        {editable ? (
          <>
            <GestureDetector gesture={gesture}>
              <View pointerEvents="auto" className="absolute inset-0 z-20" style={{ elevation: 20 }} />
            </GestureDetector>
            <Animated.View pointerEvents="none" className={mascotClassName} style={animatedImageStyle}>
              <ExpoImage
                source={{ uri }}
                contentFit={imageStyle.contentFit}
                style={{ width: "100%", height: "100%", opacity: imageStyle.opacity }}
                onLoad={event => setLoadedImageSize(getLoadedImageSize(event))}
              />
            </Animated.View>
          </>
        ) : (
          <View pointerEvents="none" className={imageStyle.className} style={imageStyle.style}>
            <ExpoImage
              source={{ uri }}
              contentFit={imageStyle.contentFit}
              style={{ width: "100%", height: "100%", opacity: imageStyle.opacity }}
              onLoad={event => setLoadedImageSize(getLoadedImageSize(event))}
            />
          </View>
        )}
        {editable ? (
          <View
            pointerEvents="box-none"
            className="absolute inset-0 z-30 justify-end"
            style={[
              { elevation: 30 },
              {
                paddingLeft: insets.left + 16,
                paddingRight: insets.right + 16,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <View
              pointerEvents="none"
              testID="editor-mascot-edit-hint"
              className="absolute left-4 right-4 top-1/2 items-center"
              style={{ transform: [{ translateY: -48 }] }}
            >
              <View className="w-[260px] max-w-full items-center gap-1.5 rounded-[20px] bg-secondary-700/5 px-[18px] py-3.5">
                <Text className="text-base font-bold text-typography-700">调整位置和大小</Text>
                <Text className="text-center text-[14px] font-medium text-typography-700/90">单指拖动，两指缩放</Text>
                {Platform.OS === "web" ? (
                  <Text className="text-center text-[14px] font-medium text-typography-700/90">
                    鼠标拖动，鼠标滚轮缩放
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="items-center gap-3">
              <View testID="editor-mascot-anchor-badge" className="rounded-full bg-secondary-700/5 px-4 py-2">
                <Text className="text-[14px] font-semibold text-typography-700">基准：{anchorLabel}</Text>
              </View>
              <View className="w-full flex-row gap-3">
                <ButtonOuter className="flex-1">
                  <Button className="gap-2" action="secondary" onPress={handleReset}>
                    <ButtonMonIcon name="fa6-solid:rotate-left" />
                    <ButtonText>重置</ButtonText>
                  </Button>
                </ButtonOuter>
                <ButtonOuter className="flex-1">
                  <Button className="gap-2" action="negative" onPress={onCancel}>
                    <ButtonMonIcon name="fa6-solid:xmark" />
                    <ButtonText>取消</ButtonText>
                  </Button>
                </ButtonOuter>
                <ButtonOuter className="flex-1">
                  <Button className="gap-2" action="positive" onPress={onDone}>
                    <ButtonMonIcon name="fa6-solid:check" />
                    <ButtonText>完成</ButtonText>
                  </Button>
                </ButtonOuter>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Portal>
  );
}

function getLoadedImageSize(event: unknown): { width: number; height: number } | null {
  const source = (event as { source?: { width?: unknown; height?: unknown } })?.source;
  const width = typeof source?.width === "number" ? source.width : 0;
  const height = typeof source?.height === "number" ? source.height : 0;
  return width > 0 && height > 0 ? { width, height } : null;
}
