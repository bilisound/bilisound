import { Layout, LayoutButton } from "~/components/layout";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { convertToHTTPS } from "~/utils/string";
import { v4 } from "uuid";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import useHistoryStore from "~/store/history";
import { getBilisoundMetadata, getBilisoundResourceUrlOnline } from "~/api/bilisound";
import { useQuery } from "@tanstack/react-query";
import { Linking, Platform, View, ViewStyle } from "react-native";
import { twMerge } from "tailwind-merge";
import { Skeleton } from "~/components/ui/skeleton";
import { getImageProxyUrl } from "~/business/constant-helper";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDate, formatSecond } from "~/utils/datetime";
import { FlashList } from "@shopify/flash-list";
import { SongItem } from "~/components/song-item";
import { SkeletonText } from "~/components/skeleton-text";
import { Pressable } from "~/components/ui/pressable";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { decodeHTML } from "entities";
import { addTrackFromDetail } from "~/business/playlist/handler";
import { Button, ButtonMonIcon, ButtonOuter, ButtonText } from "~/components/ui/button";
import { ErrorContent } from "~/components/error-content";
import { DualScrollView } from "~/components/dual-scroll-view";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "~/components/ui/actionsheet";
import log from "~/utils/logger";
import { GetMetadataResponse } from "@bilisound/sdk";
import { openAddPlaylistPage } from "~/business/playlist/misc";
import { ActionSheetCurrent } from "~/components/action-sheet-current";
import { ActionMenu, ActionMenuItem } from "~/components/action-menu";
import { useDownloadMenuItem } from "~/hooks/useDownloadMenuItem";
import { DownloadButton } from "~/components/download-button";
import { FEATURE_MASS_DOWNLOAD } from "~/constants/feature";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { pause } from "@bilisound/player";
import { useWindowSize } from "~/hooks/useWindowSize";
import useSettingsStore from "~/store/settings";

type PageItem = GetMetadataResponse["pages"][number];

function handleAddPlaylist(meta: GetMetadataResponse) {
  openAddPlaylistPage({
    playlistDetail: meta.pages.map(e => ({
      author: meta.owner.name ?? "",
      bvid: meta.bvid ?? "",
      duration: e.duration,
      episode: e.page,
      title: e.part,
      imgUrl: meta.pic ?? "",
      id: 0,
      playlistId: 0,
      extendedData: null,
    })),
    name: meta.title,
    description: meta.desc,
    source: {
      type: "video",
      bvid: meta.bvid,
      originalTitle: meta.title,
      lastSyncAt: new Date().getTime(),
    },
    cover: meta.pic,
  });
}

interface LongPressActionsProps {
  showActionSheet: boolean;
  displayTrack: PageItem;
  onClose: () => void;
  onAction: (action: "addPlaylist" | "addPlaylistRecent" | "close") => void;
  data: GetMetadataResponse;
}

/**
 * 长按操作
 */
function LongPressActions({ showActionSheet, displayTrack, onAction, onClose, data }: LongPressActionsProps) {
  const menuItems: ActionMenuItem[] = [
    ...useDownloadMenuItem(
      {
        title: displayTrack.part,
        artist: data.owner.name ?? "",
        artworkUri: data.pic ?? "",
        duration: displayTrack.duration ?? 0,
        extendedData: {
          id: data.bvid,
          episode: displayTrack.page,

          // 以下为虚拟值
          isLoaded: false,
          expireAt: 0,
          artworkUrl: data.pic,
        },
        headers: {},
        id: "",
        mimeType: "",
        uri: "",
      },
      () => onClose(),
    ),
    {
      text: "添加到歌单",
      icon: "fa6-solid:plus",
      iconSize: 16,
      show: true,
      action() {
        onAction("addPlaylist");
      },
    },
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:xmark",
      iconSize: 20,
      text: "取消",
      action: () => {
        onAction("close");
      },
    },
  ];

  return (
    <Actionsheet isOpen={showActionSheet} onClose={onClose} style={{ zIndex: 999 }}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={{ zIndex: 999 }}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        {displayTrack && data && (
          <ActionSheetCurrent
            line1={displayTrack.part}
            line2={formatSecond(displayTrack.duration)}
            image={getImageProxyUrl(data.pic, "https://www.bilibili.com/video/" + data.bvid)}
          />
        )}
        <ActionMenu menuItems={menuItems} />
      </ActionsheetContent>
    </Actionsheet>
  );
}

interface PageMenuProps {
  data: GetMetadataResponse;
  onAction: (action: "addPlaylist") => void;
}

/**
 * 右侧菜单操作
 */
function PageMenu({ data, onAction }: PageMenuProps) {
  const [showActionSheet, setShowActionSheet] = useState(false);

  function onClose() {
    setShowActionSheet(false);
  }

  const menuItems: ActionMenuItem[] = [
    {
      text: "添加到歌单",
      icon: "fa6-solid:plus",
      iconSize: 16,
      show: true,
      action() {
        onAction("addPlaylist");
        onClose();
      },
    },
    {
      show: Platform.OS === "web",
      text: "下载",
      icon: "fa6-solid:download",
      iconSize: 18,
      action() {
        onClose();
        if (!data) {
          return;
        }
        if (data.pages.length === 1) {
          globalThis.window.open(
            getBilisoundResourceUrlOnline(data.bvid, 1, useSettingsStore.getState().useLegacyID ? "av" : "bv").url,
          );
          return;
        }
        router.navigate(`/download-web?id=${data.bvid}`);
      },
    },
    {
      text: "在浏览器打开",
      icon: "fa6-solid:link",
      iconSize: 16,
      show: true,
      async action() {
        await pause();
        await Linking.openURL("https://www.bilibili.com/video/" + data.bvid + "/");
        onClose();
      },
    },
    {
      text: "复制视频链接",
      icon: "fa6-solid:copy",
      show: true,
      async action() {
        await Clipboard.setStringAsync("https://www.bilibili.com/video/" + data.bvid + "/");
        Toast.show({
          type: "success",
          text1: "视频链接已复制到剪贴板",
        });
        onClose();
      },
    },
    {
      text: "取消",
      icon: "fa6-solid:xmark",
      iconSize: 20,
      show: true,
      action() {
        onClose();
      },
    },
  ];

  return (
    <>
      <LayoutButton iconName={"fa6-solid:ellipsis-vertical"} onPress={() => setShowActionSheet(true)} />
      <Actionsheet isOpen={showActionSheet} onClose={onClose} style={{ zIndex: 999 }}>
        <ActionsheetBackdrop />
        <ActionsheetContent style={{ zIndex: 999 }}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionSheetCurrent
            line1={data.title}
            line2={data.owner.name}
            image={getImageProxyUrl(data.pic, "https://www.bilibili.com/video/" + data.bvid)}
          />
          <ActionMenu menuItems={menuItems} />
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}

interface MetaDataProps {
  data?: GetMetadataResponse;
  className?: string;
  style?: ViewStyle;
  showFullMeta?: boolean;
}

function MetaData({ data, className, style, showFullMeta }: MetaDataProps) {
  const [alwaysShowFullMeta, setAlwaysShowFullMeta] = useState(false);
  const { width } = useWindowSize();
  const showFullText = width >= 768;

  function handleCreatePlaylist() {
    if (!data) {
      log.error("使用 handleCreatePlaylist 函数时，meta 没有准备就绪！");
      return;
    }
    handleAddPlaylist(data);
  }

  const downloadItems = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.pages.map(e => ({
      id: data.bvid,
      episode: e.page,
      title: e.partDisplayName,
    }));
  }, [data]);

  const downloadWeb = () => {
    if (!data) {
      return;
    }
    if (data.pages.length === 1) {
      globalThis.window.open(
        getBilisoundResourceUrlOnline(data.bvid, 1, useSettingsStore.getState().useLegacyID ? "av" : "bv").url,
      );
      return;
    }
    router.navigate(`/download-web?id=${data.bvid}`);
  };

  let staff: ReactNode = null;
  if (data?.staff) {
    const groupedArray: Exclude<GetMetadataResponse["staff"], undefined>[] = [];
    for (let i = 0; i < data.staff.length; i += 2) {
      groupedArray.push(data.staff.slice(i, i + 2));
    }

    staff = (
      <View className={"flex-col gap-4"}>
        {groupedArray.map((e, i) => (
          <View key={i} className={"flex-row"}>
            {e.map((f, j) => (
              <View key={j} className={"flex-1 flex-row gap-3 w-full items-center"}>
                <Image
                  source={getImageProxyUrl(f.face, "https://www.bilibili.com/video/" + data.bvid)}
                  className="flex-0 basis-auto size-10 rounded-full aspect-square"
                />
                <View className={"flex-1 gap-1"}>
                  <Text className="text-sm font-semibold text-typography-700" isTruncated>
                    {f.name}
                  </Text>
                  <Text className="text-sm text-typography-500" isTruncated>
                    {f.title}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className={twMerge("gap-4", className)} style={style}>
      {data ? (
        <Image
          source={getImageProxyUrl(data.pic, "https://www.bilibili.com/video/" + data.bvid)}
          className="aspect-[16/9] rounded-lg"
        />
      ) : (
        <Skeleton className="aspect-[16/9] rounded-lg w-[unset] h-[unset]" />
      )}
      <View>
        {data ? (
          <Text
            className={`text-base font-bold ${data?.staff ? "mb-2" : "mb-4"} leading-6 text-typography-700`}
            selectable
          >
            {data.title}
          </Text>
        ) : (
          <View className="gap-2 py-1 mb-4">
            <Skeleton className="rounded-full h-4 w-full" />
            <Skeleton className="rounded-full h-4 w-1/2" />
          </View>
        )}
        <View className={`${data?.staff ? "flex-col-reverse mb-6 gap-4" : "flex-row items-center mb-4 gap-3"}`}>
          {data ? (
            <>
              {data.staff ? (
                staff
              ) : (
                <>
                  <Image
                    source={getImageProxyUrl(data.owner.face, "https://www.bilibili.com/video/" + data.bvid)}
                    className="w-9 h-9 rounded-full aspect-square flex-shrink-0"
                  />
                  <Text className="flex-grow text-sm font-bold text-typography-700" isTruncated>
                    {data.owner.name}
                  </Text>
                </>
              )}
              <Text className="flex-shrink-0 text-sm opacity-50 text-typography-700 ">
                {formatDate(data.pubDate, "yyyy-MM-dd")}
              </Text>
            </>
          ) : (
            <>
              <Skeleton className="w-9 h-9 relative flex-shrink-0 rounded-full" />
              <View className="flex-grow">
                <Skeleton className="rounded-full w-20 h-[14px]" />
              </View>
              <Skeleton className="rounded-full flex-shrink-0 w-24 h-[14px]" />
            </>
          )}
        </View>
        {data ? (
          <>
            {alwaysShowFullMeta || showFullMeta ? (
              <Text className={"text-sm leading-normal break-words"} selectable>
                {decodeHTML(data.desc)}
              </Text>
            ) : (
              <Pressable onPress={() => setAlwaysShowFullMeta(true)}>
                <Text className={"text-sm leading-normal break-words line-clamp-6"}>{decodeHTML(data.desc)}</Text>
              </Pressable>
            )}
          </>
        ) : (
          <SkeletonText lineSize={6} fontSize={14} lineHeight={21} />
        )}
        <View className={"mt-4 flex-row flex-wrap gap-2"}>
          {data ? (
            <>
              {FEATURE_MASS_DOWNLOAD ? <DownloadButton items={downloadItems} /> : null}
              {Platform.OS === "web" && (
                <ButtonOuter className={"rounded-full"}>
                  <Button
                    icon={!showFullText}
                    aria-label={"下载"}
                    className={"rounded-full"}
                    onPress={() => downloadWeb()}
                  >
                    <ButtonMonIcon name={"fa6-solid:download"} size={16} />
                    {showFullText ? <ButtonText>下载</ButtonText> : null}
                  </Button>
                </ButtonOuter>
              )}
              <ButtonOuter className={"rounded-full"}>
                <Button className={"rounded-full"} onPress={handleCreatePlaylist}>
                  <ButtonMonIcon name={"fa6-solid:plus"} size={18} />
                  <ButtonText>创建歌单</ButtonText>
                </Button>
              </ButtonOuter>
              {data?.seasonId ? (
                <ButtonOuter className={"rounded-full"}>
                  <Button
                    className={"rounded-full"}
                    variant={"outline"}
                    onPress={() => {
                      router.navigate(`/remote-list?userId=${data?.owner.mid}&listId=${data?.seasonId}&mode=season`);
                    }}
                  >
                    <ButtonMonIcon name={"fa6-solid:list"} size={16} />
                    <ButtonText>查看所属合集</ButtonText>
                  </Button>
                </ButtonOuter>
              ) : null}
            </>
          ) : (
            <Skeleton className={"w-[120px] h-[40px] rounded-full"} />
          )}
        </View>
      </View>
    </View>
  );
}

export default function Page() {
  const { id, noHistory } = useLocalSearchParams<{ id: string; noHistory?: string }>();
  const edgeInsets = useSafeAreaInsets();

  // 添加歌单 UI 部分
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [displayTrack, setDisplayTrack] = useState<PageItem | undefined>();
  const handleClose = () => {
    setShowActionSheet(false);
  };

  // 数据请求
  const { data, error } = useQuery({
    queryKey: [id],
    queryFn: () => {
      return getBilisoundMetadata({ id });
    },
  });

  // 增加历史记录条目
  const { appendHistoryList } = useHistoryStore(state => ({
    appendHistoryList: state.appendHistoryList,
  }));

  useEffect(() => {
    if (data && !noHistory) {
      appendHistoryList({
        authorName: data.owner.name,
        id: data.bvid,
        name: data.title,
        thumbnailUrl: convertToHTTPS(data.pic),
        visitedAt: new Date(),
        key: v4(),
      });
    }
  }, [appendHistoryList, data, noHistory]);

  return (
    <GestureHandlerRootView>
      <Layout
        title={"查看详情"}
        leftAccessories={"BACK_BUTTON"}
        rightAccessories={
          data ? (
            <PageMenu
              data={data}
              onAction={action => {
                switch (action) {
                  case "addPlaylist":
                    if (!data) {
                      return;
                    }
                    handleAddPlaylist(data);
                    break;
                  default:
                    break;
                }
              }}
            />
          ) : null
        }
        disableContentPadding={true}
      >
        {error ? (
          <View className={"flex-1 items-center justify-center"}>
            <ErrorContent message={error.message} />
          </View>
        ) : (
          <DualScrollView
            edgeInsets={edgeInsets}
            header={<MetaData data={data} showFullMeta />}
            list={({ contentContainerStyle }) => (
              <FlashList
                scrollIndicatorInsets={{
                  bottom: Number.MIN_VALUE,
                }}
                contentContainerStyle={contentContainerStyle}
                ListHeaderComponent={<MetaData data={data} className={"flex md:hidden px-4 pb-4"} />}
                renderItem={e => (
                  <SongItem
                    onRequestPlay={() => addTrackFromDetail(data!.bvid, e.item.page)}
                    onLongPress={() => {
                      setDisplayTrack(e.item);
                      setShowActionSheet(true);
                    }}
                    data={{
                      author: data!.owner.name,
                      bvid: data!.bvid,
                      duration: e.item.duration,
                      episode: e.item.page,
                      title: e.item.partDisplayName,
                      imgUrl: data!.pic,
                      id: 0,
                      playlistId: 0,
                      extendedData: null,
                    }}
                  />
                )}
                data={data?.pages ?? []}
              />
            )}
          />
        )}
      </Layout>

      {/* 曲目操作 */}
      {displayTrack && data ? (
        <LongPressActions
          showActionSheet={showActionSheet}
          onClose={handleClose}
          onAction={action => {
            handleClose();
            if (!displayTrack) {
              log.error("/query/[id]", `用户在没有指定操作目标的情况下，执行了菜单操作 ${action}`);
              return;
            }
            switch (action) {
              case "addPlaylist":
                openAddPlaylistPage({
                  playlistDetail: [
                    {
                      author: data?.owner.name ?? "",
                      bvid: data?.bvid ?? "",
                      duration: displayTrack.duration,
                      episode: displayTrack.page,
                      title: displayTrack.part,
                      imgUrl: data?.pic ?? "",
                      id: 0,
                      playlistId: 0,
                      extendedData: null,
                    },
                  ],
                  name: data?.title ?? "",
                  description: data?.desc ?? "",
                });
                break;
              case "close":
                break;
            }
          }}
          displayTrack={displayTrack}
          data={data}
        />
      ) : null}
    </GestureHandlerRootView>
  );
}
