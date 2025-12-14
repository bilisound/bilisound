import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { v4 } from "uuid";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Layout } from "~/components/layout";
import { SongItem } from "~/components/song-item";
import { ErrorContent } from "~/components/error-content";
import { DualScrollView } from "~/components/dual-scroll-view";

import { getBilisoundMetadata } from "~/api/bilisound";
import { addTrackFromDetail } from "~/business/playlist/handler";
import { openAddPlaylistPage } from "~/business/playlist/misc";
import { convertToHTTPS } from "~/utils/string";
import useHistoryStore from "~/store/history";
import log from "~/utils/logger";

import { LongPressActions, PageMenu, MetaData, handleAddPlaylist, type PageItem } from "~/components/video-detail";

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
