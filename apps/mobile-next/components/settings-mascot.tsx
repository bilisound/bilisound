import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { ViewProps } from "react-native";

import BgCornerClassic from "~/assets/images/bg-corner-classic.svg";
import BgCornerRed from "~/assets/images/bg-corner-red.svg";
import { useAppearanceConfig } from "~/features/config";
import { getYuruCharaRenderMetrics } from "~/features/theme/editor";
import { findUserTheme, useThemeRegistry } from "~/features/theme/registry";
import { themeStorage } from "~/features/theme/storage";
import { useWindowSize } from "~/hooks/useWindowSize";

/**
 * 全局看板娘。由宿主（root layout）在不加条件的情况下挂载：
 * 组件自身读取 `showYuruChara` / 当前主题，关闭时不渲染任何内容。
 *
 * 内置主题沿用 v2 的角标图片，用户主题沿用保存的看板娘布局参数。
 */
export function SettingsMascot(props: ViewProps) {
  const { showYuruChara, theme } = useAppearanceConfig();
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

  const userLayout = userTheme?.yuruChara;

  const userImageStyle = useMemo(() => {
    if (!userLayout) {
      return null;
    }
    const metrics = getYuruCharaRenderMetrics(userLayout, frame, loadedImageSize);

    return [
      styles.base,
      { width: metrics.width, height: metrics.height },
      userLayout.align === "left" && styles.left,
      userLayout.align === "center" && styles.centerX,
      userLayout.align === "right" && styles.right,
      userLayout.verticalAlign === "top" && styles.top,
      userLayout.verticalAlign === "center" && styles.centerY,
      userLayout.verticalAlign === "bottom" && styles.bottom,
      userLayout.align === "center" && { marginLeft: -metrics.width / 2 },
      userLayout.verticalAlign === "center" && { marginTop: -metrics.height / 2 },
      { transform: [{ translateX: userLayout.offsetX }, { translateY: userLayout.offsetY }] },
    ];
  }, [frame, loadedImageSize, userLayout]);

  if (!showYuruChara) {
    return null;
  }

  if (userTheme && userLayout && assetUri && userImageStyle) {
    const metrics = getYuruCharaRenderMetrics(userLayout, frame, loadedImageSize);
    return (
      <View {...props} pointerEvents="none" style={[userImageStyle, props.style]}>
        <Image
          contentFit={metrics.contentFit}
          source={{ uri: assetUri }}
          style={[styles.userImage, { opacity: userLayout.opacity }]}
          onLoad={event => setLoadedImageSize(getLoadedImageSize(event))}
        />
      </View>
    );
  }

  // 用户主题尚未加载出图片时不要回退到内置主题，避免闪烁
  if (userTheme) {
    return null;
  }

  const isClassicTheme = theme === "classic" || !theme;
  return (
    <View {...props} pointerEvents="none" style={[styles.base, styles.right, styles.defaultBottom, props.style]}>
      {isClassicTheme ? (
        <BgCornerClassic width="240px" height="240px" style={{ opacity: 0.4 }} />
      ) : (
        <BgCornerRed width="240px" height="240px" style={{ opacity: 0.4 }} />
      )}
    </View>
  );
}

function getLoadedImageSize(event: unknown): { width: number; height: number } | null {
  const source = (event as { source?: { width?: unknown; height?: unknown } })?.source;
  const width = typeof source?.width === "number" ? source.width : 0;
  const height = typeof source?.height === "number" ? source.height : 0;
  return width > 0 && height > 0 ? { width, height } : null;
}

const styles = StyleSheet.create({
  base: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    zIndex: 10,
  },
  right: { right: 0 },
  left: { left: 0 },
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
