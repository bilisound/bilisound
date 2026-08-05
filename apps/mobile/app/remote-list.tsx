import { Layout } from "~/components/layout";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getFullRemotePlaylist,
  getRemotePlaylist,
  getVideoImageUrl,
  getVideoMetadata,
  type RemotePlaylistMetadata,
  type RemotePlaylistMode,
} from "~/features/bilibili";
import { openAddPlaylistPage } from "~/features/playlist";
import { twMerge } from "tailwind-merge";
import { Skeleton } from "~/components/ui/skeleton";
import { formatSecond } from "~/utils/datetime";
import { decodeHTML } from "entities";
import { SkeletonText } from "~/components/skeleton-text";
import { Button, ButtonMonIcon, ButtonOuter, ButtonText } from "~/components/ui/button";
import { ActivityIndicator, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
import { ErrorContent } from "~/components/error-content";
import { FlashList } from "@shopify/flash-list";
import { VideoItem } from "~/components/video-item";
import Toast from "react-native-toast-message";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { DualScrollView } from "~/components/dual-scroll-view";

interface MetaDataProps {
  data?: RemotePlaylistMetadata;
  className?: string;
  style?: ViewStyle;
  mode: RemotePlaylistMode;
}

function MetaData({ data, className, style, mode }: MetaDataProps) {
  const [loading, setLoading] = useState(false);
  const { colorValue } = useRawThemeValues();

  async function handleCreatePlaylist() {
    if (!data) {
      return;
    }
    setLoading(true);
    try {
      const list = await getFullRemotePlaylist(mode, data.userId, data.playlistId);
      const needsFallback = list.some(episode => !episode.author);
      const firstEpisode = needsFallback ? await getVideoMetadata(list[0].bvid) : null;
      openAddPlaylistPage({
        playlistDetail: list.map(episode => ({
          author: episode.author?.name ?? firstEpisode?.owner.name ?? "",
          bvid: episode.bvid,
          duration: episode.duration,
          episode: 1,
          title: episode.title,
          imgUrl: episode.coverUrl,
        })),
        name: data.name,
        description: data.description,
        source: {
          type: "playlist",
          originalTitle: data.name,
          lastSyncAt: new Date().getTime(),
          subType: mode,
          userId: data.userId,
          listId: data.playlistId,
        },
        cover: data.coverUrl,
      });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "歌单创建操作失败",
        text2: (e as Error)?.message || `${e}`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className={twMerge("gap-4", className)} style={style}>
      {data ? (
        <Image source={getVideoImageUrl(data.coverUrl)} className="aspect-[16/9] rounded-lg" />
      ) : (
        <Skeleton className="aspect-[16/9] rounded-lg w-[unset] h-[unset]" />
      )}
      <View>
        {data ? (
          <Text className="text-base font-bold mb-4 leading-6 text-typography-700" selectable>
            {data.name}
          </Text>
        ) : (
          <View className="gap-2 py-1 mb-4">
            <Skeleton className="rounded-full h-4 w-2/3" />
          </View>
        )}
        {data ? (
          !!data.description.trim() && (
            <Text className={"text-sm leading-normal break-words"}>{decodeHTML(data.description)}</Text>
          )
        ) : (
          <SkeletonText lineSize={6} fontSize={14} lineHeight={21} />
        )}
        <View className={"mt-4 flex-row gap-2"}>
          {data ? (
            <>
              <ButtonOuter className={"rounded-full"}>
                <Button className={"rounded-full"} onPress={handleCreatePlaylist} disabled={loading}>
                  {loading ? (
                    <View className={"size-[18px] items-center justify-center"}>
                      <ActivityIndicator className={"size-4"} color={colorValue("--color-typography-0")} />
                    </View>
                  ) : (
                    <ButtonMonIcon name={"fa6-solid:plus"} size={18} />
                  )}
                  <ButtonText>创建歌单</ButtonText>
                </Button>
              </ButtonOuter>
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
  const { userId, listId, mode } = useLocalSearchParams<{ userId: string; listId: string; mode: RemotePlaylistMode }>();

  const edgeInsets = useSafeAreaInsets();
  const { colorValue } = useRawThemeValues();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, error } = useInfiniteQuery({
    initialPageParam: 1,
    queryKey: [`getEpisodeUser_${mode}_${userId}_${listId}`],
    queryFn: ({ pageParam = 1 }) => getRemotePlaylist(mode!, userId!, listId!, pageParam),
    getNextPageParam: lastPage => {
      if (lastPage.page < Math.ceil(lastPage.total / lastPage.pageSize)) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });

  const loadMore = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Layout
      title={mode === "favorite" ? "收藏夹详情" : "合集详情"}
      leftAccessories={"BACK_BUTTON"}
      edgeInsets={{ ...edgeInsets, bottom: 0 }}
    >
      {error ? (
        <View className={"flex-1 items-center justify-center"}>
          <ErrorContent message={error.message} />
        </View>
      ) : (
        <DualScrollView
          edgeInsets={{ ...edgeInsets, left: 0, right: 0 }}
          header={<MetaData mode={mode} data={data?.pages[0].metadata} />}
          list={({ contentContainerStyle }) => (
            <FlashList
              scrollIndicatorInsets={{
                bottom: Number.MIN_VALUE,
              }}
              contentContainerStyle={{
                ...contentContainerStyle,
              }}
              ListHeaderComponent={
                <MetaData mode={mode} data={data?.pages[0].metadata} className={"flex md:hidden px-4 pb-4"} />
              }
              ListFooterComponent={
                isFetchingNextPage ? <ActivityIndicator color={colorValue("--color-typography-500")} /> : null
              }
              renderItem={e => (
                <VideoItem
                  image={getVideoImageUrl(e.item.coverUrl)}
                  text1={e.item.title}
                  text2={formatSecond(e.item.duration)}
                  onPress={() => {
                    router.navigate(`/video/${e.item.bvid}`);
                  }}
                />
              )}
              data={data?.pages.flatMap(page => page.episodes) || []}
              keyExtractor={item => item.bvid}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
            />
          )}
        />
      )}
    </Layout>
  );
}
