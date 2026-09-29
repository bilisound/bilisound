import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { Button, DualScrollView, StateContent, Text } from "@bilisound/ui";
import { View, useTheme } from "@tamagui/core";
import { decodeHTML } from "entities";
import { Image } from "expo-image";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppLayout } from "~/components/app-layout";
import { DiscoveryVideoItem } from "~/components/discovery-video-item";
import { notify } from "~/components/feedback";
import {
  getFullRemotePlaylist,
  getRemotePlaylist,
  getVideoImageUrl,
  getVideoMetadata,
  type RemotePlaylistMetadata,
  type RemotePlaylistMode,
} from "~/features/bilibili";
import {
  buildRemotePlaylistDraft,
  getNextRemoteListPage,
  remoteEpisodesNeedAuthorFallback,
} from "~/features/bilibili/discovery";
import { openAddPlaylistPage } from "~/features/playlist";
import { formatSecond } from "~/utils/datetime";
import log from "~/utils/logger";

function RemoteListMeta({
  data,
  creating,
  onCreatePlaylist,
}: {
  data?: RemotePlaylistMetadata;
  creating: boolean;
  onCreatePlaylist: () => void;
}) {
  return (
    <View gap="$4">
      {data ? (
        <Image contentFit="cover" source={getVideoImageUrl(data.coverUrl)} style={styles.cover} />
      ) : (
        <View backgroundColor="$surfaceMuted" style={styles.cover} />
      )}
      <View>
        {data ? (
          <Text bold color="$text" size="md" style={{ marginBottom: 16 }}>
            {data.name}
          </Text>
        ) : null}
        {data && data.description.trim() ? <Text size="sm">{decodeHTML(data.description)}</Text> : null}
        <View flexDirection="row" flexWrap="wrap" gap="$2" style={{ marginTop: 16 }}>
          {data ? (
            <Button disabled={creating} icon="fa6-solid:plus" onPress={onCreatePlaylist} shape="rounded">
              {creating ? "创建中…" : "创建歌单"}
            </Button>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/**
 * 远程列表页（合集 / 收藏夹）：分页拉取条目、显示元数据并支持全量导入歌单
 * （搬运 v2 `remote-list.tsx`）。
 */
export default function RemoteListScreen() {
  const { userId, listId, mode } = useLocalSearchParams<{
    userId?: string;
    listId?: string;
    mode?: RemotePlaylistMode;
  }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [creating, setCreating] = useState(false);

  const valid = Boolean(userId && listId && mode);

  const { data, error, isPending, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["remote-list", mode, userId, listId],
    initialPageParam: 1,
    enabled: valid,
    queryFn: ({ pageParam }) => getRemotePlaylist(mode!, userId!, listId!, pageParam),
    getNextPageParam: lastPage => getNextRemoteListPage(lastPage),
  });

  const metadata = data?.pages[0]?.metadata;
  const episodes = data?.pages.flatMap(page => page.episodes) ?? [];

  const handleCreatePlaylist = async () => {
    if (!mode || !metadata) {
      return;
    }
    setCreating(true);
    try {
      const list = await getFullRemotePlaylist(mode, metadata.userId, metadata.playlistId);
      const fallbackAuthor =
        remoteEpisodesNeedAuthorFallback(list) && list[0] ? (await getVideoMetadata(list[0].bvid)).owner.name : "";
      openAddPlaylistPage(buildRemotePlaylistDraft(metadata, mode, list, fallbackAuthor));
    } catch (cause) {
      log.error(`歌单创建操作失败，原因：${cause}`);
      notify(`歌单创建操作失败：${cause instanceof Error ? cause.message : String(cause)}`, true);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout back scroll={false} title={mode === "favorite" ? "收藏夹详情" : "合集详情"}>
      {!valid ? (
        <StateContent description="缺少必要的参数，无法打开该列表" title="无法打开列表" />
      ) : isPending ? (
        <StateContent loading title="正在加载" />
      ) : error ? (
        <StateContent description={error.message} onRetry={refetch} title="无法加载列表" />
      ) : (
        <DualScrollView
          edgeInsets={insets}
          header={<RemoteListMeta creating={creating} data={metadata} onCreatePlaylist={handleCreatePlaylist} />}
          list={({ contentContainerStyle }) => (
            <View flex={1}>
              <FlashList
                contentContainerStyle={contentContainerStyle}
                data={episodes}
                keyExtractor={item => item.bvid}
                ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={theme.textMuted.get()} /> : null}
                ListHeaderComponent={
                  <View $gtSm={{ display: "none" }} display="flex" paddingBottom="$4" paddingHorizontal="$4">
                    <RemoteListMeta creating={creating} data={metadata} onCreatePlaylist={handleCreatePlaylist} />
                  </View>
                }
                onEndReached={() => {
                  if (hasNextPage) {
                    void fetchNextPage();
                  }
                }}
                onEndReachedThreshold={0.5}
                renderItem={({ item }) => (
                  <DiscoveryVideoItem
                    image={getVideoImageUrl(item.coverUrl)}
                    onPress={() => router.navigate(`/video/${item.bvid}`)}
                    subtitle={formatSecond(item.duration)}
                    title={item.title}
                  />
                )}
              />
            </View>
          )}
        />
      )}
    </AppLayout>
  );
}

const styles = {
  cover: {
    aspectRatio: 16 / 9,
    borderRadius: 8,
    width: "100%" as const,
  },
};
