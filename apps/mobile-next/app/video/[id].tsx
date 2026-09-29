import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { DualScrollView, StateContent } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { v4 } from "uuid";

import { AppLayout } from "~/components/app-layout";
import { DiscoverySongItem } from "~/components/discovery-song-item";
import { DiscoveryVideoMeta } from "~/components/discovery-video-meta";
import { DiscoveryEpisodeMenu, DiscoveryVideoMenu } from "~/components/discovery-video-menu";
import { notify } from "~/components/feedback";
import { getVideoMetadata, type VideoEpisode } from "~/features/bilibili";
import { appendPlaybackHistory, playEpisode } from "~/features/playback";
import { convertToHTTPS } from "~/utils/string";
import log from "~/utils/logger";

/**
 * 视频详情页：元数据 + 分 P 列表，点击播放、长按加入歌单（搬运 v2 `video/[id].tsx`）。
 *
 * `noHistory` 传入时不写访问历史（供播放中跳转等场景避让）。
 */
export default function VideoDetailScreen() {
  const { id, noHistory } = useLocalSearchParams<{ id: string; noHistory?: string }>();
  const insets = useSafeAreaInsets();
  const [displayTrack, setDisplayTrack] = useState<VideoEpisode | null>(null);

  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["video-metadata", id],
    queryFn: () => getVideoMetadata(id),
  });

  useEffect(() => {
    if (data && !noHistory) {
      appendPlaybackHistory({
        authorName: data.owner.name,
        id: data.bvid,
        name: data.title,
        thumbnailUrl: convertToHTTPS(data.coverUrl),
        visitedAt: new Date(),
        key: v4(),
      });
    }
  }, [data, noHistory]);

  const handlePlay = async (bvid: string, episode: VideoEpisode) => {
    try {
      await playEpisode(bvid, episode.page);
    } catch (cause) {
      log.error(`播放操作失败，原因：${cause}`);
      notify(cause instanceof Error ? cause.message : String(cause), true);
    }
  };

  return (
    <AppLayout actions={data ? <DiscoveryVideoMenu data={data} /> : undefined} back scroll={false} title="查看详情">
      {isPending ? (
        <StateContent loading title="正在加载" />
      ) : error ? (
        <StateContent description={error.message} onRetry={refetch} title="无法加载视频信息" />
      ) : data ? (
        <DualScrollView
          edgeInsets={insets}
          header={<DiscoveryVideoMeta data={data} showFullMeta />}
          list={({ contentContainerStyle }) => (
            <View flex={1}>
              <FlashList
                contentContainerStyle={contentContainerStyle}
                data={data.episodes}
                keyExtractor={item => String(item.page)}
                ListHeaderComponent={
                  <View $gtSm={{ display: "none" }} display="flex" paddingBottom="$4" paddingHorizontal="$4">
                    <DiscoveryVideoMeta data={data} />
                  </View>
                }
                renderItem={({ item }) => (
                  <DiscoverySongItem
                    duration={item.duration}
                    onLongPress={() => setDisplayTrack(item)}
                    onPress={() => void handlePlay(data.bvid, item)}
                    page={item.page}
                    title={item.displayTitle}
                  />
                )}
              />
            </View>
          )}
        />
      ) : null}
      <DiscoveryEpisodeMenu data={data} episode={displayTrack} onClose={() => setDisplayTrack(null)} />
    </AppLayout>
  );
}
