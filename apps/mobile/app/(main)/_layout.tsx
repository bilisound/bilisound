import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from "expo-router/ui";
import { Text } from "~/components/ui/text";
import { ActivityIndicator, View, Pressable, Platform, StyleSheet } from "react-native";
import React from "react";
import { TabSafeAreaContext } from "~/hooks/useTabSafeAreaInsets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { breakpoints } from "~/constants/styles";
import { YuruChara } from "~/components/yuru-chara";
import { useAppearanceConfig } from "~/features/config";
import { toggle, useCurrentTrack, useIsPlaying, usePlaybackState } from "@bilisound/player";
import { Image } from "expo-image";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { PLACEHOLDER_AUDIO } from "~/constants/playback";
import { Icon } from "~/components/icon";
import { ButtonOuter } from "~/components/ui/button";
import { useBottomSheetStore } from "~/store/bottom-sheet";
import { convertToHTTPS } from "~/utils/string";
import { router } from "expo-router";
import { useWindowSize } from "~/hooks/useWindowSize";
import { IS_ANDROID_RIPPLE_ENABLED } from "~/constants/platform";

type TabTriggerChildProps = TabTriggerSlotProps & {
  iconName: string;
  title: string;
};

const TabTriggerChild = ({
  isFocused,
  onPress,
  iconName,
  title,
  style: _style,
  className: _className,
  ref,
  ...props
}: TabTriggerChildProps & { ref?: React.Ref<View> }) => {
  const { colorValue } = useRawThemeValues();
  const { width } = useWindowSize();
  const isSide = width >= breakpoints.sm;
  const isWide = width >= breakpoints.xl;
  const selected = Boolean(isFocused);
  // HACK: Native providers do not expose RN's tab role reliably; button stays discoverable.
  const accessibilityRole = Platform.OS === "web" ? "tab" : "button";

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabTrigger,
        isSide ? styles.tabTriggerSide : styles.tabTriggerBottom,
        isWide && styles.tabTriggerWide,
        isWide && isFocused && { backgroundColor: colorValue("--color-background-0") },
      ]}
      android_ripple={IS_ANDROID_RIPPLE_ENABLED ? { color: colorValue("--color-background-200") } : undefined}
      {...props}
      accessibilityLabel={`${title}标签`}
      accessibilityHint={selected ? "当前标签页" : `切换到${title}标签页`}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected }}
      ref={ref}
    >
      <Icon
        name={iconName}
        color={isFocused ? colorValue("--color-accent-500") : colorValue("--color-typography-700", 0.4)}
        size={16}
      />
      <Text
        style={{
          fontSize: isWide ? 14 : 12,
          lineHeight: isWide ? 20 : 16,
          color: isFocused ? colorValue("--color-accent-500") : colorValue("--color-typography-700"),
          fontWeight: isFocused ? "600" : undefined,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

// 播放状态图标
function PlayingIcon() {
  const activeTrack = useCurrentTrack();
  const playbackState = usePlaybackState();
  const isPlaying = useIsPlaying();
  const { colorValueMode } = useRawThemeValues();
  const accentColor = colorValueMode({
    light: { color: "--color-accent-500" },
    dark: { color: "--color-typography-700" },
  });

  // 解决 placeholder 音频还没替换时不恰当的状态显示
  const isPlaceholderTrack = activeTrack?.uri === PLACEHOLDER_AUDIO;

  if (playbackState === "STATE_BUFFERING" || isPlaceholderTrack) {
    return <ActivityIndicator color={accentColor} />;
  }

  return (
    <View style={styles.playingIconContainer}>
      <Icon name={isPlaying ? "fa6-solid:pause" : "fa6-solid:play"} size={isPlaying ? 24 : 20} color={accentColor} />
    </View>
  );
}

function CurrentPlayingTablet() {
  const { colorValue } = useRawThemeValues();
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const playbackState = usePlaybackState();
  const open = useBottomSheetStore(state => state.open);
  const { left, bottom } = useSafeAreaInsets();
  const { width } = useWindowSize();
  const isWide = width >= breakpoints.xl;

  // 解决 placeholder 音频还没替换时不恰当的状态显示
  const isPlaceholderTrack = currentTrack?.uri === PLACEHOLDER_AUDIO;

  function handleOpen() {
    if (Platform.OS === "web") {
      router.navigate("/current");
      return;
    }
    open();
  }

  if (!currentTrack) {
    return null;
  }

  return (
    <View
      style={[
        styles.currentPlayingTablet,
        isWide ? styles.cptWide : styles.cptCompact,
        { left: left || 0, bottom: bottom || 0 },
      ]}
    >
      {!isWide && (
        <>
          <View style={styles.cptSmallPlayContainer}>
            <ButtonOuter>
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.cptPlayButton,
                  !IS_ANDROID_RIPPLE_ENABLED && hovered && { backgroundColor: colorValue("--color-background-100") },
                  !IS_ANDROID_RIPPLE_ENABLED && pressed && { backgroundColor: colorValue("--color-background-200") },
                ]}
                android_ripple={IS_ANDROID_RIPPLE_ENABLED ? { color: colorValue("--color-background-200") } : undefined}
                accessibilityLabel={isPlaying ? "暂停当前播放" : "播放当前曲目"}
                accessibilityRole="button"
                accessibilityState={{ busy: playbackState === "STATE_BUFFERING" }}
                onPress={() => toggle()}
              >
                <View style={styles.playingIconContainer}>
                  {playbackState === "STATE_BUFFERING" || isPlaceholderTrack ? (
                    <ActivityIndicator color={colorValue("--color-accent-500")} size={22} />
                  ) : (
                    <Icon
                      name={isPlaying ? "fa6-solid:pause" : "fa6-solid:play"}
                      size={isPlaying ? 22 : 18}
                      color={colorValue("--color-accent-500")}
                    />
                  )}
                </View>
              </Pressable>
            </ButtonOuter>
          </View>
          <View style={styles.cptArtworkContainer}>
            <Pressable
              style={({ pressed, hovered }) => [
                styles.cptArtworkButton,
                hovered && { backgroundColor: colorValue("--color-background-0", 0.5) },
                pressed && { backgroundColor: colorValue("--color-background-0") },
              ]}
              accessibilityHint="打开当前播放详情"
              accessibilityLabel={currentTrack.title ? `当前播放，${currentTrack.title}` : "当前播放"}
              accessibilityRole="button"
              onPress={() => handleOpen()}
            >
              <Image source={convertToHTTPS(currentTrack.artworkUri!)} style={styles.cptArtworkImage} />
            </Pressable>
          </View>
        </>
      )}
      {isWide && (
        <>
          <Pressable
            style={styles.cptWideRow}
            android_ripple={IS_ANDROID_RIPPLE_ENABLED ? { color: colorValue("--color-background-200") } : undefined}
            accessibilityHint="打开当前播放详情"
            accessibilityLabel={currentTrack.title ? `当前播放，${currentTrack.title}` : "当前播放"}
            accessibilityRole="button"
            onPress={() => handleOpen()}
          >
            <Image source={currentTrack.artworkUri} style={styles.cptWideImage} />
            <Text style={{ flex: 1, minWidth: 0 }} isTruncated>
              {currentTrack.title}
            </Text>
          </Pressable>
          <View style={styles.cptWidePlayContainer}>
            <ButtonOuter style={styles.cptWideButtonOuter}>
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.cptWidePlayButton,
                  !IS_ANDROID_RIPPLE_ENABLED && hovered && { backgroundColor: colorValue("--color-background-100") },
                  !IS_ANDROID_RIPPLE_ENABLED && pressed && { backgroundColor: colorValue("--color-background-200") },
                ]}
                android_ripple={IS_ANDROID_RIPPLE_ENABLED ? { color: colorValue("--color-background-200") } : undefined}
                accessibilityLabel={isPlaying ? "暂停当前播放" : "播放当前曲目"}
                accessibilityRole="button"
                accessibilityState={{ busy: playbackState === "STATE_BUFFERING" }}
                onPress={() => toggle()}
              >
                <PlayingIcon />
              </Pressable>
            </ButtonOuter>
          </View>
        </>
      )}
    </View>
  );
}

function CurrentPlaying() {
  const { colorValue } = useRawThemeValues();
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const playbackState = usePlaybackState();
  const open = useBottomSheetStore(state => state.open);

  function handleOpen() {
    if (Platform.OS === "web") {
      router.navigate("/current");
      return;
    }
    open();
  }

  if (!currentTrack) {
    return null;
  }

  return (
    <View
      style={[
        styles.currentPlaying,
        {
          backgroundColor: colorValue("--color-background-50"),
          borderColor: colorValue("--color-typography-700", 0.1),
        },
      ]}
    >
      <Pressable
        style={styles.cpRow}
        android_ripple={IS_ANDROID_RIPPLE_ENABLED ? { color: colorValue("--color-background-200") } : undefined}
        accessibilityHint="打开当前播放详情"
        accessibilityLabel={currentTrack.title ? `当前播放，${currentTrack.title}` : "当前播放"}
        accessibilityRole="button"
        onPress={() => handleOpen()}
      >
        <Image source={currentTrack.artworkUri} style={styles.cpImage} />
        <Text style={{ flex: 1, minWidth: 0 }} isTruncated>
          {currentTrack.title}
        </Text>
      </Pressable>
      <ButtonOuter style={styles.cpButtonOuter}>
        <Pressable
          style={({ pressed, hovered }) => [
            styles.cpPlayButton,
            !IS_ANDROID_RIPPLE_ENABLED && hovered && { backgroundColor: colorValue("--color-background-100") },
            !IS_ANDROID_RIPPLE_ENABLED && pressed && { backgroundColor: colorValue("--color-background-200") },
          ]}
          android_ripple={IS_ANDROID_RIPPLE_ENABLED ? { color: colorValue("--color-background-200") } : undefined}
          accessibilityLabel={isPlaying ? "暂停当前播放" : "播放当前曲目"}
          accessibilityRole="button"
          accessibilityState={{ busy: playbackState === "STATE_BUFFERING" }}
          onPress={() => toggle()}
        >
          <PlayingIcon />
        </Pressable>
      </ButtonOuter>
    </View>
  );
}

export default function TabLayout() {
  const edgeInsets = useSafeAreaInsets();
  const edgeInsetsTab = structuredClone(edgeInsets);
  const windowDimensions = useWindowSize();
  const { showYuruChara } = useAppearanceConfig();
  const { colorValue } = useRawThemeValues();
  const isSideTabList = windowDimensions.width >= breakpoints.sm;
  const isWide = windowDimensions.width >= breakpoints.xl;
  const sideTabListWidth = isWide ? 256 : 64;

  if (!isSideTabList) {
    edgeInsetsTab.bottom = 0;
  }
  if (isSideTabList) {
    edgeInsetsTab.left = 0;
  }

  const tabListSafeAreaStyle = isSideTabList
    ? {
        paddingTop: edgeInsets.top,
        paddingLeft: edgeInsets.left,
        paddingRight: 0,
        paddingBottom: edgeInsets.bottom,
      }
    : {
        paddingLeft: edgeInsets.left,
        paddingRight: edgeInsets.right,
        paddingBottom: edgeInsets.bottom,
      };

  return (
    <TabSafeAreaContext.Provider value={edgeInsetsTab}>
      <Tabs style={[styles.tabsRoot, isSideTabList && styles.tabsRootSide]}>
        <View style={styles.tabContent}>
          <TabSlot />
        </View>
        {!isSideTabList && <CurrentPlaying />}
        <TabList
          accessibilityRole="tablist"
          style={[
            tabListSafeAreaStyle,
            { backgroundColor: colorValue("--color-background-50") },
            isSideTabList ? styles.tabListSide : styles.tabListBottom,
            isWide && styles.tabListSideWide,
            isSideTabList && { width: sideTabListWidth + edgeInsets.left },
          ]}
        >
          {isSideTabList && <View style={[styles.spacer, isWide && styles.spacerWide]} aria-hidden={true} />}
          <TabTrigger asChild name="playlist" href="/(main)/(playlist)/playlist">
            <TabTriggerChild iconName={"fa6-solid:list"} title={"歌单"} />
          </TabTrigger>
          <TabTrigger asChild name="index" href="/(main)">
            <TabTriggerChild iconName={"fa6-solid:magnifying-glass"} title={"查询"} />
          </TabTrigger>
          <TabTrigger asChild name="settings" href="/(main)/settings">
            <TabTriggerChild iconName={"fa6-solid:gear"} title={"设置"} />
          </TabTrigger>
          {isSideTabList && <CurrentPlayingTablet />}
        </TabList>
        {showYuruChara && <YuruChara />}
      </Tabs>
    </TabSafeAreaContext.Provider>
  );
}

const styles = StyleSheet.create({
  // === Root layout ===
  tabsRoot: {
    flex: 1,
  },
  tabsRootSide: {
    flexDirection: "row-reverse",
  },
  tabContent: {
    flex: 1,
  },

  // === TabList ===
  tabListBottom: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  tabListSide: {
    flexDirection: "column",
    height: "100%",
    justifyContent: "flex-start",
    width: 64,
  },
  tabListSideWide: {
    alignItems: "center",
    width: 256,
  },

  // === Spacer ===
  spacer: {
    height: 12,
  },
  spacerWide: {
    height: 16,
  },

  // === Tab trigger ===
  tabTrigger: {
    height: 64,
    gap: 8,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  tabTriggerBottom: {
    flex: 1,
  },
  tabTriggerSide: {
    flexBasis: "auto",
    width: 64,
  },
  tabTriggerWide: {
    flexDirection: "row",
    gap: 12,
    height: 48,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    width: 224,
    borderRadius: 9999,
  },

  // === PlayingIcon ===
  playingIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    flexGrow: 0,
    flexShrink: 0,
  },

  // === CurrentPlayingTablet ===
  currentPlayingTablet: {
    position: "absolute",
    alignItems: "center",
  },
  cptCompact: {
    width: 64,
  },
  cptWide: {
    width: 256,
    flexDirection: "row",
  },
  cptSmallPlayContainer: {
    width: 64,
    height: 40,
    alignItems: "center",
  },
  cptPlayButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  cptArtworkContainer: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  cptArtworkButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  cptArtworkImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  cptWideRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 12,
    height: 64,
    minWidth: 0,
  },
  cptWideImage: {
    height: 40,
    width: 40,
    borderRadius: 8,
    flexGrow: 0,
    flexBasis: "auto",
    flexShrink: 0,
  },
  cptWidePlayContainer: {
    flexGrow: 0,
    flexBasis: "auto",
    flexShrink: 0,
    paddingHorizontal: 12,
  },
  cptWideButtonOuter: {
    borderRadius: 8,
    flexGrow: 0,
    flexBasis: "auto",
    flexShrink: 0,
  },
  cptWidePlayButton: {
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // === CurrentPlaying (mobile) ===
  currentPlaying: {
    width: "100%",
    height: 64,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    gap: 12,
  },
  cpRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 16,
    height: 64,
    minWidth: 0,
  },
  cpImage: {
    height: 40,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    flexGrow: 0,
    flexBasis: "auto",
  },
  cpButtonOuter: {
    borderRadius: 8,
    flexGrow: 0,
    flexBasis: "auto",
    flexShrink: 0,
  },
  cpPlayButton: {
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
