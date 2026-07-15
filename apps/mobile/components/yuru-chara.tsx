import { Image } from "expo-image";
import React, { forwardRef, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import BgCornerClassic from "~/assets/images/bg-corner-classic.svg";
import BgCornerRed from "~/assets/images/bg-corner-red.svg";
import { getYuruCharaRenderMetrics } from "~/features/theme/editor";
import { findUserTheme, useThemeRegistry } from "~/features/theme/registry";
import { themeStorage } from "~/features/theme/storage";
import { useWindowSize } from "~/hooks/useWindowSize";
import useSettingsStore from "~/store/settings";

export const YuruChara = forwardRef<View, ViewProps>((props, ref) => {
  const theme = useSettingsStore(state => state.theme);
  const userTheme = useThemeRegistry(state => findUserTheme(state.themes, theme));
  const [assetUri, setAssetUri] = useState<string | null>(null);
  const [loadedImageSize, setLoadedImageSize] = useState<{ width: number; height: number } | null>(null);
  const frame = useWindowSize();

  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;
    if (!userTheme) {
      setAssetUri(null);
      setLoadedImageSize(null);
      return;
    }
    setAssetUri(null);
    setLoadedImageSize(null);
    themeStorage.getThemeAsset(userTheme).then(asset => {
      if (!mounted) {
        return;
      }

      if (asset?.uri) {
        setAssetUri(asset.uri);
        return;
      }

      if (asset?.blob && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        objectUrl = URL.createObjectURL(asset.blob);
        setAssetUri(objectUrl);
        return;
      }

      setAssetUri(null);
    });
    return () => {
      mounted = false;
      if (objectUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [userTheme]);

  const userImageStyle = useMemo(() => {
    const layout = userTheme?.yuruChara;
    if (!layout) return null;
    const metrics = getYuruCharaRenderMetrics(layout, frame, loadedImageSize);
    if (metrics.usesFullscreenFrame) {
      return [
        styles.base,
        { width: metrics.width, height: metrics.height },
        styles.fullscreenFrame,
        { marginLeft: -metrics.width / 2 },
      ];
    }

    return [
      styles.base,
      { width: metrics.width, height: metrics.height },
      layout.align === "left" && styles.left,
      layout.align === "center" && styles.centerX,
      layout.align === "right" && styles.right,
      layout.verticalAlign === "top" && styles.top,
      layout.verticalAlign === "center" && styles.centerY,
      layout.verticalAlign === "bottom" && styles.bottom,
      layout.align === "center" && { marginLeft: -metrics.width / 2 },
      layout.verticalAlign === "center" && { marginTop: -metrics.height / 2 },
      { transform: [{ translateX: layout.offsetX }, { translateY: layout.offsetY }] },
    ];
  }, [frame, loadedImageSize, userTheme]);

  const userLayout = userTheme?.yuruChara;

  if (userTheme && userLayout && assetUri && userImageStyle) {
    const contentFit = getYuruCharaRenderMetrics(userLayout, frame, loadedImageSize).contentFit;
    return (
      <View {...props} ref={ref} pointerEvents="none" style={[userImageStyle, props.style]}>
        <Image
          source={{ uri: assetUri }}
          contentFit={contentFit}
          style={[styles.userImage, { opacity: userLayout.opacity }]}
          onLoad={event => setLoadedImageSize(getLoadedImageSize(event))}
        />
      </View>
    );
  }

  if (theme !== "classic" && theme !== "red" && theme) {
    return null;
  }

  if (userTheme) {
    return null;
  }

  const isClassicTheme = theme === "classic" || !theme;
  return (
    <View
      {...props}
      ref={ref}
      pointerEvents="none"
      style={[styles.base, styles.right, styles.defaultBottom, props.style]}
    >
      {isClassicTheme ? (
        <BgCornerClassic width="240px" height="240px" style={{ opacity: 0.4 }} />
      ) : (
        <BgCornerRed width="240px" height="240px" style={{ opacity: 0.4 }} />
      )}
    </View>
  );
});

YuruChara.displayName = "YuruChara";

function getLoadedImageSize(event: unknown): { width: number; height: number } | null {
  const source = (event as { source?: { width?: unknown; height?: unknown } })?.source;
  const width = typeof source?.width === "number" ? source.width : 0;
  const height = typeof source?.height === "number" ? source.height : 0;
  return width > 0 && height > 0 ? { width, height } : null;
}

const styles = StyleSheet.create({
  base: {
    position: "absolute",
    zIndex: 10,
  },
  fullscreenFrame: { left: "50%", top: 0 },
  left: { left: 0 },
  right: { right: 0 },
  top: { top: 0 },
  bottom: { bottom: 0 },
  defaultBottom: { bottom: 120 },
  centerX: { left: "50%" },
  centerY: { top: "50%" },
  userImage: {
    width: "100%",
    height: "100%",
  },
});
