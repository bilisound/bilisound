import { memo, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, FlatList, Linking, Platform } from "react-native";
import { Button, Checkbox, HStack, Slider, StateContent, Text, VStack } from "@bilisound/ui";
import { Sheet } from "@tamagui/sheet";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getCurrentTrackIndex,
  jump,
  prev,
  RepeatMode,
  seek,
  setRepeatMode,
  ShuffleMode,
  toggle,
  useCurrentTrack,
  useEvents,
  useIsPlaying,
  usePlaybackOrder,
  useQueue,
  useRepeatMode,
  useShuffleMode,
} from "~/features/player";
import {
  deleteCurrentTrackCache,
  playNextTrack,
  toggleShuffleMode,
  usePlaybackSpeed,
  usePlaylistRestoreLoopOnceFlag,
} from "~/features/playback";
import { getDownloadUrl } from "~/features/bilibili";
import {
  downloadResourceNow,
  getCacheAudioPath,
  isCacheExists,
  useCacheExists,
  useDownloadList,
} from "~/features/cache";
import { getResourcePolicy } from "~/features/config";
import { openAddPlaylistPage } from "~/features/playlist";
import { useProgressSecond } from "~/hooks/useProgressSecond";
import { PLACEHOLDER_AUDIO } from "~/constants/playback";
import { formatSecond } from "~/utils/datetime";
import { saveAudioFile, uriToPath } from "~/utils/file";
import { bv2av } from "~/utils/vendors/av-bv";
import { notify, reportError } from "./feedback";
import { ConfirmDialog } from "./confirm-dialog";
import { orderQueue } from "~/features/playback/queue-view";

const repeatNames = ["顺序播放", "单曲循环", "列表循环"];

type QueueItem = ReturnType<typeof orderQueue>[number];

async function run(action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    reportError(error);
  }
}

// FlatList re-invokes renderItem for every mounted row whenever it re-renders, and the progress tick re-renders
// the panel every second. Without memo that rebuilds the whole queue each tick and stalls the JS thread.
const QueueRow = memo(function QueueRow({ item, index, active }: { item: QueueItem; index: number; active: boolean }) {
  return (
    <VStack paddingHorizontal="$3" paddingBottom="$2">
      <Button
        variant={active ? "solid" : "ghost"}
        justifyContent="flex-start"
        numberOfLines={1}
        accessibilityLabel={`播放 ${item.track.title ?? "未知曲目"}`}
        onPress={() =>
          void run(async () =>
            (await getCurrentTrackIndex()) === item.canonicalIndex ? toggle() : jump(item.canonicalIndex),
          )
        }
      >
        {index + 1}. {item.track.title ?? "未知曲目"}
      </Button>
    </VStack>
  );
});

function PlayerContent({ onClose }: { onClose?: () => void }) {
  const current = useCurrentTrack();
  const queue = useQueue();
  const order = usePlaybackOrder();
  // Keeps item identity stable across renders so QueueRow's memo holds.
  const orderedQueue = useMemo(() => orderQueue(queue, order), [queue, order]);
  const playing = useIsPlaying();
  const repeat = useRepeatMode();
  const shuffle = useShuffleMode();
  const [restoreLoopOnce] = usePlaylistRestoreLoopOnceFlag();
  const { position, duration } = useProgressSecond();
  const [dragPosition, setDragPosition] = useState<number>();
  const [currentIndex, setCurrentIndex] = useState(-1);
  const sliding = useRef(false);
  useEffect(() => {
    let active = true;
    void getCurrentTrackIndex().then(index => {
      if (active) setCurrentIndex(index);
    }, reportError);
    return () => {
      active = false;
    };
  }, [current, queue]);
  useEffect(() => {
    sliding.current = false;
    setDragPosition(undefined);
  }, [currentIndex]);
  const { speedValue, retainPitch, applySpeed } = usePlaybackSpeed();
  const cached = useCacheExists(current?.extendedData?.id, current?.extendedData?.episode);
  const { downloadList } = useDownloadList();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [working, setWorking] = useState(false);
  const effectiveRepeat = restoreLoopOnce ? RepeatMode.ONE : repeat;
  const loading = !current || current.uri === PLACEHOLDER_AUDIO || duration <= 0;
  const download = current?.extendedData
    ? downloadList.get(`${current.extendedData.id}_${current.extendedData.episode}`)
    : undefined;

  async function commitSeek(value: number) {
    sliding.current = false;
    await run(async () => {
      try {
        await seek(value);
      } finally {
        setDragPosition(undefined);
      }
    });
  }

  async function cacheTrack() {
    if (!current?.extendedData) return;
    setWorking(true);
    try {
      const { id, episode } = current.extendedData;
      await downloadResourceNow(id, episode, current.title ?? "未知曲目");
      if (isCacheExists(id, episode)) notify("缓存已就绪");
    } catch (error) {
      reportError(error);
    } finally {
      setWorking(false);
    }
  }

  async function saveFile() {
    if (!current?.extendedData) return;
    const { id, episode } = current.extendedData;
    const { useLegacyID } = getResourcePolicy();
    const fileName = `[${useLegacyID ? "av" + bv2av(id) : id}] [P${episode}] ${current.title}.m4a`;
    await saveAudioFile(uriToPath(getCacheAudioPath(id, episode, false)), fileName);
    notify("保存或分享操作已结束");
  }

  function addToPlaylist() {
    if (!current?.extendedData) return;
    onClose?.();
    openAddPlaylistPage({
      name: current.title ?? "",
      description: "",
      cover: current.artworkUri ?? "",
      playlistDetail: [
        {
          author: current.artist ?? "",
          bvid: current.extendedData.id,
          duration: current.duration ?? 0,
          episode: current.extendedData.episode,
          title: current.title ?? "",
          imgUrl: current.extendedData.artworkUrl ?? "",
        },
      ],
    });
  }

  const header = (
    <VStack padding="$3" gap="$3">
      <HStack alignItems="center" justifyContent="space-between">
        <Text semiBold size="lg">
          正在播放
        </Text>
        {onClose ? (
          <Button variant="ghost" onPress={onClose}>
            收起
          </Button>
        ) : null}
      </HStack>
      {!current ? (
        <StateContent title="还没有正在播放的音视频" description="查询视频，或从歌单开始播放。" />
      ) : (
        <>
          {current.artworkUri ? (
            <Image
              source={{ uri: current.artworkUri }}
              style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 12 }}
              contentFit="cover"
              accessibilityLabel="当前曲目封面"
            />
          ) : null}
          <Text semiBold numberOfLines={3}>
            {current.title}
          </Text>
          <Text color="$textMuted" size="sm">
            {current.artist}
          </Text>
          {loading ? <Text color="$textMuted">正在加载音频……</Text> : null}
          <Slider
            accessibilityLabel="播放进度"
            value={[dragPosition ?? position]}
            min={0}
            max={Math.max(duration, 1)}
            step={1}
            disabled={loading}
            onSlideStart={() => {
              sliding.current = true;
            }}
            onValueChange={([value]) => {
              setDragPosition(value);
              // Keyboard and accessibility adjustments do not emit a slide-end event.
              if (!sliding.current) void commitSeek(value);
            }}
            onSlideEnd={(_, value) => {
              void commitSeek(value);
            }}
          />
          <HStack justifyContent="space-between">
            <Text size="sm">{formatSecond(dragPosition ?? position)}</Text>
            <Text size="sm">{formatSecond(duration)}</Text>
          </HStack>
          <HStack gap="$2" justifyContent="center">
            <Button variant="ghost" accessibilityLabel="上一首" onPress={() => void run(prev)}>
              上一首
            </Button>
            <Button disabled={loading || !!restoreLoopOnce} onPress={() => void run(toggle)}>
              {playing ? "暂停" : "播放"}
            </Button>
            <Button variant="ghost" accessibilityLabel="下一首" onPress={() => void run(playNextTrack)}>
              下一首
            </Button>
          </HStack>
          <HStack gap="$2" flexWrap="wrap">
            <Button
              size="sm"
              variant="outline"
              disabled={loading || !!restoreLoopOnce}
              onPress={() =>
                void run(async () => {
                  const mode = effectiveRepeat === RepeatMode.ALL ? RepeatMode.OFF : effectiveRepeat + 1;
                  await setRepeatMode(mode);
                  notify(repeatNames[mode]);
                })
              }
            >
              {repeatNames[effectiveRepeat]}
            </Button>
            <Button
              size="sm"
              variant={shuffle === ShuffleMode.ON ? "solid" : "outline"}
              disabled={loading || !!restoreLoopOnce}
              onPress={() =>
                void run(async () => {
                  notify((await toggleShuffleMode()) === "shuffle" ? "随机模式开启" : "随机模式关闭");
                })
              }
            >
              随机播放
            </Button>
          </HStack>
          <Text size="sm">播放速度：{speedValue.toFixed(2)}×</Text>
          <Slider
            accessibilityLabel="播放速度"
            min={0.25}
            max={3}
            step={0.01}
            value={[speedValue]}
            onValueChange={([value]) => applySpeed(value, retainPitch)}
          />
          <HStack gap="$1" flexWrap="wrap">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
              <Button
                key={speed}
                size="sm"
                variant={speedValue === speed ? "solid" : "ghost"}
                onPress={() => applySpeed(speed, retainPitch)}
              >
                {speed}×
              </Button>
            ))}
          </HStack>
          <Checkbox
            checked={retainPitch}
            onCheckedChange={value => applySpeed(speedValue, value === true)}
            label="变速不变调"
          />
          <HStack gap="$2" flexWrap="wrap">
            <Button size="sm" variant="outline" onPress={addToPlaylist}>
              添加到歌单
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!current.extendedData}
              onPress={() => {
                if (!current.extendedData) return;
                onClose?.();
                router.push(`/video/${current.extendedData.id}`);
              }}
            >
              查看详情
            </Button>
            {Platform.OS === "web" ? (
              <Button
                size="sm"
                onPress={() => {
                  if (current.extendedData)
                    void run(() =>
                      Linking.openURL(getDownloadUrl(current.extendedData!.id, current.extendedData!.episode)),
                    );
                }}
              >
                下载
              </Button>
            ) : cached ? (
              <>
                <Button size="sm" variant="outline" onPress={() => void run(saveFile)}>
                  保存到文件
                </Button>
                <Button size="sm" variant="ghost" onPress={() => setDeleteConfirm(true)}>
                  删除缓存
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" disabled={working || !!download} onPress={() => void cacheTrack()}>
                {working || download ? "正在缓存……" : "缓存到本地"}
              </Button>
            )}
          </HStack>
        </>
      )}
      <Text semiBold>播放队列 · {queue.length}</Text>
    </VStack>
  );

  return (
    <>
      <FlatList
        data={orderedQueue}
        keyExtractor={item => String(item.canonicalIndex)}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <QueueRow item={item} index={index} active={item.canonicalIndex === currentIndex} />
        )}
      />
      <ConfirmDialog
        open={deleteConfirm}
        title="删除当前曲目缓存？"
        description="删除后将重新请求在线音频。"
        onClose={confirmed => {
          setDeleteConfirm(false);
          if (confirmed)
            void run(async () => {
              await deleteCurrentTrackCache();
              notify("已删除缓存");
            });
        }}
      />
    </>
  );
}

export function PlayerPanel({ wide }: { wide: boolean }) {
  const [open, setOpen] = useState(false);
  const current = useCurrentTrack();
  const playing = useIsPlaying();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { duration } = useProgressSecond();
  const [restoreLoopOnce] = usePlaylistRestoreLoopOnceFlag();
  const loading = !current || current.uri === PLACEHOLDER_AUDIO || duration <= 0;
  useEvents("onPlaybackError", event => reportError(event.message));
  useEffect(() => {
    setOpen(false);
  }, [pathname, wide]);
  useEffect(() => {
    if (!open) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      setOpen(false);
      return true;
    });
    return () => handler.remove();
  }, [open]);

  if (wide)
    return (
      <VStack width={300} borderLeftWidth={1} borderColor="$border" paddingTop={insets.top} backgroundColor="$surface">
        <PlayerContent />
      </VStack>
    );
  return (
    <>
      {current ? (
        <HStack padding="$2" gap="$2" alignItems="center" backgroundColor="$surfaceMuted">
          <Button
            variant="ghost"
            flex={1}
            justifyContent="flex-start"
            accessibilityLabel="展开播放器"
            numberOfLines={1}
            onPress={() => setOpen(true)}
          >
            {current.title ?? "正在播放"}
          </Button>
          <Button
            size="sm"
            disabled={loading || !!restoreLoopOnce}
            accessibilityLabel={playing ? "暂停" : "播放"}
            onPress={() => {
              void toggle().catch(reportError);
            }}
          >
            {loading ? "加载中" : playing ? "暂停" : "播放"}
          </Button>
        </HStack>
      ) : null}
      <Sheet
        open={open}
        onOpenChange={setOpen}
        modal
        disableDrag
        snapPoints={[90]}
        dismissOnSnapToBottom
        transition="quick"
        unmountChildrenWhenHidden
      >
        <Sheet.Overlay backgroundColor="rgba(0,0,0,0.45)" />
        <Sheet.Frame backgroundColor="$surface" paddingBottom={Math.max(insets.bottom, 8)}>
          <Sheet.Handle />
          <PlayerContent onClose={() => setOpen(false)} />
        </Sheet.Frame>
      </Sheet>
    </>
  );
}
