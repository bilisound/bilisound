import { View } from "react-native";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { Circle as OrigCircle, Svg } from "react-native-svg";
import { cssInterop } from "nativewind";
import { twMerge } from "tailwind-merge";
import Toast from "react-native-toast-message";

import { Text } from "~/components/ui/text";
import { Button, ButtonMonIcon, ButtonOuter, ButtonText } from "~/components/ui/button";
import { Modal, ModalBackdrop, ModalBody, ModalContent } from "~/components/ui/modal";
import { DownloadButton } from "~/components/download-button";
import { ImagesGroup } from "./ImagesGroup";

import { PlaylistDetail, PlaylistMeta } from "~/storage/sqlite/schema";
import { convertToRelativeTime } from "~/utils/datetime";
import { updatePlaylist } from "~/business/playlist/update";
import { getImageProxyUrl } from "~/business/constant-helper";
import { FEATURE_MASS_DOWNLOAD } from "~/constants/feature";
import log from "~/utils/logger";

cssInterop(OrigCircle, {
  className: {
    // @ts-ignore workaround
    target: "style",
    nativeStyleToProp: {
      stroke: true,
      fill: true,
    },
  },
});

const Circle = Animated.createAnimatedComponent(OrigCircle);

export interface HeaderProps {
  meta: PlaylistMeta;
  detail: PlaylistDetail[];
  images: string[];
  onPlay: () => void;
  showPlayButton: boolean;
  className?: string;
}

export function Header({ meta, detail, images, onPlay, showPlayButton, className }: HeaderProps) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  // 进度条处理
  const [showModal, setShowModal] = useState(false);
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  const displayProgress = useSharedValue(0);
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = (1 - displayProgress.value) * 138.16;
    return {
      strokeDashoffset,
    };
  });
  useEffect(() => {
    displayProgress.value = withTiming(progress);
  }, [displayProgress, progress]);

  // 同步时间处理
  const [lastSyncString, setLastSyncString] = useState("");
  useEffect(() => {
    function action() {
      if (!meta.source) {
        return;
      }
      setLastSyncString(convertToRelativeTime(JSON.parse(meta.source).lastSyncAt));
    }
    const handle = setInterval(action, 5000);
    action();
    return () => clearInterval(handle);
  }, [meta]);

  // 同步操作
  async function handleSync() {
    setShowModal(true);
    setSyncing(true);
    setProgress(0);
    try {
      const source = meta.source;
      if (!source) {
        return;
      }
      const total = await updatePlaylist(meta.id, JSON.parse(source), progress => {
        setProgress(progress);
      });
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["playlist_meta"] }),
        queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] }),
        queryClient.refetchQueries({ queryKey: [`playlist_meta_${meta.id}`] }),
        queryClient.refetchQueries({ queryKey: [`playlist_detail_${meta.id}`] }),
      ]);
      Toast.show({
        type: "success",
        text1: "歌单同步成功",
        text2: `目前歌单中有 ${total} 首歌曲`,
      });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "歌单同步失败",
        text2: "可能是网络请求异常，请稍后再试",
      });
      log.error("列表同步失败：" + e);
    } finally {
      setShowModal(false);
      setSyncing(false);
    }
  }

  const imgUrl = meta.imgUrl;

  return (
    <View className={twMerge("gap-4", className)}>
      {imgUrl ? (
        <Image source={getImageProxyUrl(imgUrl)} className="aspect-video rounded-lg" />
      ) : (
        <ImagesGroup images={images} />
      )}
      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="text-[1.25rem] font-semibold leading-normal">{meta.title}</Text>
          <View className="flex-row">
            <Text className="opacity-60 mt-2 text-sm leading-normal">
              {`${meta.amount} 首歌曲` + (meta.source ? ` ・ 上次同步：${lastSyncString}` : "")}
            </Text>
          </View>
          {showPlayButton && (
            <View className="flex-row mt-4 gap-2">
              <ButtonOuter className={"rounded-full"}>
                <Button className={"rounded-full"} onPress={onPlay}>
                  <ButtonMonIcon name={"fa6-solid:play"} size={16} />
                  <ButtonText>播放</ButtonText>
                </Button>
              </ButtonOuter>
              {FEATURE_MASS_DOWNLOAD ? (
                <DownloadButton
                  items={detail.map(e => ({
                    id: e.bvid,
                    episode: e.episode,
                    title: e.title,
                  }))}
                />
              ) : null}
              {meta.source ? (
                <ButtonOuter className={"rounded-full"}>
                  <Button
                    className={"rounded-full"}
                    onPress={handleSync}
                    disabled={syncing}
                    aria-label="同步"
                    icon={true}
                  >
                    <ButtonMonIcon name={"fa6-solid:arrow-rotate-left"} size={16} />
                  </Button>
                </ButtonOuter>
              ) : null}
            </View>
          )}
        </View>
      </View>
      {!!(meta.description ?? "").trim() && (
        <Text className="text-sm leading-normal opacity-80 pb-2" selectable>
          {meta.description}
        </Text>
      )}
      {/* 以后如果有更多的地方需要用这种 modal，考虑封装成一个组件 */}
      <Modal isOpen={showModal} finalFocusRef={ref} size="md">
        <ModalBackdrop />
        <ModalContent className="p-3">
          <ModalBody>
            <View className="w-full flex-row gap-3 items-center">
              <View className="-rotate-90 w-16 h-16">
                <Svg width={64} height={64} viewBox="0 0 64 64">
                  <Circle
                    // @ts-ignore workaround
                    className="stroke-primary-100"
                    r={22}
                    cx={32}
                    cy={32}
                    fill="transparent"
                    strokeWidth={6}
                    strokeDasharray="138.16px"
                  />
                  <Circle
                    r={22}
                    cx={32}
                    cy={32}
                    // @ts-ignore workaround
                    className="stroke-primary-400"
                    strokeWidth={6}
                    strokeLinecap="round"
                    // 138.16 is 0%, 0 is 100%
                    // strokeDashoffset={(1 - progress) * 138.16}
                    animatedProps={animatedProps}
                    fill="transparent"
                    strokeDasharray="138.16px"
                  />
                </Svg>
              </View>
              <Text className="text-typography-700 text-sm">正在同步在线播放列表……</Text>
            </View>
          </ModalBody>
        </ModalContent>
      </Modal>
    </View>
  );
}
