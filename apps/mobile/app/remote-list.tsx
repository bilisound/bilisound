import { Layout } from "~/components/layout";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getBilisoundMetadata, getUserList, getUserListFull } from "~/api/bilisound";
import { twMerge } from "tailwind-merge";
import { getImageProxyUrl } from "~/business/constant-helper";
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
import useApplyPlaylistStore from "~/store/apply-playlist";
import Toast from "react-native-toast-message";
import { GetEpisodeUserResponse, UserListMode } from "@bilisound/sdk";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { DualScrollView } from "~/components/dual-scroll-view";

interface MetaDataProps {
  data?: GetEpisodeUserResponse["meta"];
  className?: string;
  style?: ViewStyle;
  mode: UserListMode;
}

function MetaData({ data, className, style, mode }: MetaDataProps) {
  const [loading, setLoading] = useState(false);
  const { colorValue } = useRawThemeValues();

  // 添加歌单
  const { setPlaylistDetail, setName, setDescription, setSource, setCover } = useApplyPlaylistStore(state => ({
    setPlaylistDetail: state.setPlaylistDetail,
    setName: state.setName,
    setDescription: state.setDescription,
    setSource: state.setSource,
    setCover: state.setCover,
  }));

  async function handleCreatePlaylist() {
    if (!data) {
      return;
    }
    setLoading(true);
    try {
      const list = await getUserListFull(mode, data.userId, data.seasonId);
      const firstEpisode = await getBilisoundMetadata({ id: list[0].bvid });
      setPlaylistDetail(
        list.map(e => ({
          author: firstEpisode.owner.name,
          bvid: e.bvid ?? "",
          duration: e.duration,
          episode: 1,
          title: e.title,
          imgUrl: e.cover ?? "",
          id: 0,
          playlistId: 0,
          extendedData: null,
        })),
      );
      setName(data.name);
      setDescription(data.description);
      setSource({
        type: "playlist",
        originalTitle: data.name,
        lastSyncAt: new Date().getTime(),
        subType: mode,
        userId: data.userId,
        listId: data.seasonId,
      });
      setCover(data.cover);
      router.push(`/apply-playlist`);
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
        <Image source={getImageProxyUrl(data.cover)} className="aspect-[16/9] rounded-lg" />
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
  const { userId, listId, mode } = useLocalSearchParams<{ userId: string; listId: string; mode: UserListMode }>();

  const edgeInsets = useSafeAreaInsets();
  const { colorValue } = useRawThemeValues();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, error } = useInfiniteQuery({
    initialPageParam: 1,
    queryKey: [`getEpisodeUser_${mode}_${userId}_${listId}`],
    queryFn: ({ pageParam = 1 }) => getUserList(mode!, userId!, listId!, pageParam),
    getNextPageParam: lastPage => {
      if (lastPage.pageNum < Math.ceil(lastPage.total / lastPage.pageSize)) {
        return lastPage.pageNum + 1;
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
    <Layout title={"合集详情"} leftAccessories={"BACK_BUTTON"} edgeInsets={{ ...edgeInsets, bottom: 0 }}>
      {error ? (
        <View className={"flex-1 items-center justify-center"}>
          <ErrorContent message={error.message} />
        </View>
      ) : (
        <DualScrollView
          edgeInsets={{ ...edgeInsets, left: 0, right: 0 }}
          header={<MetaData mode={mode} data={data?.pages[0].meta} />}
          list={({ contentContainerStyle }) => (
            <FlashList
              scrollIndicatorInsets={{
                bottom: Number.MIN_VALUE,
              }}
              contentContainerStyle={{
                ...contentContainerStyle,
              }}
              ListHeaderComponent={
                <MetaData mode={mode} data={data?.pages[0].meta} className={"flex md:hidden px-4 pb-4"} />
              }
              ListFooterComponent={
                isFetchingNextPage ? <ActivityIndicator color={colorValue("--color-typography-500")} /> : null
              }
              renderItem={e => (
                <VideoItem
                  image={getImageProxyUrl(e.item.cover)}
                  text1={e.item.title}
                  text2={formatSecond(e.item.duration)}
                  onPress={() => {
                    router.navigate(`/video/${e.item.bvid}`);
                  }}
                />
              )}
              data={data?.pages.flatMap(page => page.rows) || []}
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
