import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from "expo-router/ui";
import { Text } from "~/components/ui/text";
import { ActivityIndicator, View, Pressable, Platform } from "react-native";
import React from "react";
import { twMerge } from "tailwind-merge";
import { TabSafeAreaContext } from "~/hooks/useTabSafeAreaInsets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { breakpoints } from "~/constants/styles";
import { simpleCopy } from "~/utils/misc";
import { YuruChara } from "~/components/yuru-chara";
import useSettingsStore from "~/store/settings";
import { toggle, useCurrentTrack, useIsPlaying, usePlaybackState } from "@bilisound/player";
import { Image } from "expo-image";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { PLACEHOLDER_AUDIO } from "~/constants/playback";
import { Monicon } from "@monicon/native";
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
  style,
  className,
  ref,
  ...props
}: TabTriggerChildProps & { ref?: React.Ref<View> }) => {
  const { colorValue } = useRawThemeValues();
  const triggerClasses = [
    IS_ANDROID_RIPPLE_ENABLED ? "{}-[android_ripple.color]/color:color-background-200" : "",
    "max-sm:flex-1 sm:basis-auto h-16 gap-2 w-full flex-col items-center justify-center",
    "sm:w-16",
    "xl:flex-row xl:gap-3 xl:h-12 xl:justify-start xl:px-5 xl:w-56 xl:rounded-full",
    isFocused ? "xl:bg-background-0" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Pressable onPress={onPress} className={triggerClasses} {...props} ref={ref}>
      <Monicon
        name={iconName}
        color={isFocused ? colorValue("--color-accent-500") : colorValue("--color-typography-700", 0.4)}
        size={16}
      />
      <Text className={twMerge("text-xs xl:text-sm", isFocused ? "color-accent-500 font-semibold" : "")}>{title}</Text>
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
    <View className="items-center justify-center size-6 flex-0">
      <Monicon name={isPlaying ? "fa6-solid:pause" : "fa6-solid:play"} size={isPlaying ? 24 : 20} color={accentColor} />
    </View>
  );
}

function CurrentPlayingTablet() {
  const { colorValue } = useRawThemeValues();
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const playbackState = usePlaybackState();
  const { open } = useBottomSheetStore();

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
    <View className={"hidden absolute left-safe bottom-safe w-16 xl:w-64 items-center " + " sm:flex" + " xl:flex-row"}>
      <View className={"w-16 h-10 items-center xl:hidden"}>
        <ButtonOuter>
          <Pressable
            className={
              "size-10 items-center justify-center " +
              (IS_ANDROID_RIPPLE_ENABLED
                ? "{}-[android_ripple.color]/color:color-background-200"
                : "rounded-lg hover:bg-background-100 active:bg-background-200")
            }
            onPress={() => toggle()}
          >
            {playbackState === "STATE_BUFFERING" || isPlaceholderTrack ? (
              <ActivityIndicator color={colorValue("--color-accent-500")} size={22} />
            ) : (
              <Monicon
                name={isPlaying ? "fa6-solid:pause" : "fa6-solid:play"}
                size={isPlaying ? 22 : 18}
                color={colorValue("--color-accent-500")}
              />
            )}
          </Pressable>
        </ButtonOuter>
      </View>
      <View className={"size-16 xl:hidden items-center justify-center"}>
        <Pressable
          className={
            "w-12 h-12 hover:bg-background-0/50 active:bg-background-0 items-center justify-center rounded-[12px]"
          }
          onPress={() => handleOpen()}
        >
          <Image source={convertToHTTPS(currentTrack.artworkUri!)} className={"w-10 h-10 rounded-lg"} />
        </Pressable>
      </View>
      <Pressable
        className={
          (IS_ANDROID_RIPPLE_ENABLED
            ? "{}-[android_ripple.color]/color:color-background-200"
            : "hover:bg-background-100 active:bg-background-200") +
          " flex-1 flex-row items-center px-3 gap-3 h-16 hidden xl:flex"
        }
        onPress={() => handleOpen()}
      >
        <Image source={currentTrack.artworkUri} className={"h-10 w-10 rounded-lg flex-0 basis-auto"}></Image>
        <Text className={"flex-1"} isTruncated>
          {currentTrack.title}
        </Text>
      </Pressable>
      <View className={"flex-0 basis-auto px-3 hidden xl:flex"}>
        <ButtonOuter className={"rounded-lg flex-0 basis-auto"}>
          <Pressable
            className={
              (IS_ANDROID_RIPPLE_ENABLED
                ? "{}-[android_ripple.color]/color:color-background-200"
                : "hover:bg-background-100 active:bg-background-200") +
              " rounded-lg size-10 items-center justify-center"
            }
            onPress={() => toggle()}
          >
            <PlayingIcon />
          </Pressable>
        </ButtonOuter>
      </View>
    </View>
  );
}

function CurrentPlaying() {
  const currentTrack = useCurrentTrack();
  const { open } = useBottomSheetStore(state => ({
    open: state.open,
  }));

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
      className={
        "bg-background-50 w-full h-16 border-b border-typography-700/10 flex-row items-center pr-3 gap-3 " + "sm:hidden"
      }
      // onLayout={e => console.log(e.nativeEvent.layout)}
    >
      <Pressable
        className={
          (IS_ANDROID_RIPPLE_ENABLED
            ? "{}-[android_ripple.color]/color:color-background-200"
            : "hover:bg-background-100 active:bg-background-200") + " flex-1 flex-row items-center px-3 gap-4 h-16"
        }
        onPress={() => handleOpen()}
      >
        <Image source={currentTrack.artworkUri} className={"h-10 aspect-video rounded-lg flex-0 basis-auto"}></Image>
        <Text className={"flex-1"} isTruncated>
          {currentTrack.title}
        </Text>
      </Pressable>
      <ButtonOuter className={"rounded-lg flex-0 basis-auto"}>
        <Pressable
          className={
            (IS_ANDROID_RIPPLE_ENABLED
              ? "{}-[android_ripple.color]/color:color-background-200"
              : "hover:bg-background-100 active:bg-background-200") + " rounded-lg size-10 items-center justify-center"
          }
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
  const edgeInsetsTab = simpleCopy(edgeInsets);
  const windowDimensions = useWindowSize();
  const { showYuruChara } = useSettingsStore(state => ({
    showYuruChara: state.showYuruChara,
  }));

  if (windowDimensions.width < breakpoints.md) {
    edgeInsetsTab.bottom = 0;
  }
  if (windowDimensions.width >= breakpoints.md) {
    edgeInsetsTab.left = 0;
  }

  return (
    <TabSafeAreaContext.Provider value={edgeInsetsTab}>
      <Tabs className={"sm:flex-row-reverse"}>
        <View className={"flex-1"}>
          <TabSlot />
        </View>
        <CurrentPlaying />
        <TabList
          className={
            "flex-0 basis-auto pl-safe pr-safe pb-safe !flex-row !justify-around bg-background-50 " +
            "max-sm:w-full sm:h-full sm:!flex-col sm:pl-safe sm:pr-0 sm:pt-safe sm:!justify-start " +
            "xl:w-64 xl:items-center"
          }
        >
          <View className={"hidden sm:flex h-3 xl:h-4"} aria-hidden={true} />
          <TabTrigger asChild name="playlist" href="/(main)/(playlist)/playlist">
            <TabTriggerChild iconName={"fa6-solid:list"} title={"歌单"} />
          </TabTrigger>
          <TabTrigger asChild name="index" href="/(main)">
            <TabTriggerChild iconName={"fa6-solid:magnifying-glass"} title={"查询"} />
          </TabTrigger>
          <TabTrigger asChild name="settings" href="/(main)/settings">
            <TabTriggerChild iconName={"fa6-solid:gear"} title={"设置"} />
          </TabTrigger>
          <CurrentPlayingTablet />
        </TabList>
        {showYuruChara && <YuruChara />}
      </Tabs>
    </TabSafeAreaContext.Provider>
  );
}
