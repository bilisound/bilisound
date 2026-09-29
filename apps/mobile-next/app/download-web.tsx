import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { HStack, StateContent, Text, VStack } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { Image } from "expo-image";
import { Linking, Platform, Pressable } from "react-native";

import { AppLayout } from "~/components/app-layout";
import { getDownloadUrl, getVideoImageUrl, getVideoMetadata, type VideoEpisode } from "~/features/bilibili";

function DownloadRow({ bvid, episode }: { bvid: string; episode: VideoEpisode }) {
  const url = getDownloadUrl(bvid, episode.page);
  const content = (
    <>
      <View
        alignItems="center"
        backgroundColor="$primarySolid"
        borderRadius="$1.5"
        height={22}
        justifyContent="center"
        minWidth={22}
        paddingHorizontal="$2"
      >
        <Text color="$primaryOnSolid" size="sm">
          {episode.page}
        </Text>
      </View>
      <Text flex={1} numberOfLines={1} size="sm">
        {episode.displayTitle}
      </Text>
    </>
  );

  // Web 端保留真实 <a>，支持右键「另存为」；native 端点击后在浏览器打开。
  if (Platform.OS === "web") {
    return (
      <a href={url} rel="noreferrer" style={styles.row} target="_blank">
        {content}
      </a>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => void Linking.openURL(url)}
      style={({ pressed }) => (pressed ? { ...styles.row, opacity: 0.7 } : styles.row)}
    >
      {content}
    </Pressable>
  );
}

/**
 * 下载音频页（Web 入口）：按分 P 提供下载链接（搬运 v2 `download-web.tsx`）。
 */
export default function DownloadWebScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["video-metadata", id],
    queryFn: () => getVideoMetadata(id),
  });

  return (
    <AppLayout back title="下载音频">
      {isPending ? (
        <StateContent loading title="正在加载" />
      ) : error ? (
        <StateContent description={error.message} onRetry={refetch} title="无法加载视频信息" />
      ) : data ? (
        <VStack gap="$2" paddingBottom="$4" paddingHorizontal="$4">
          <HStack alignItems="center" gap="$4" paddingVertical="$4">
            <Image contentFit="cover" source={getVideoImageUrl(data.coverUrl)} style={styles.cover} />
            <VStack flex={1} gap="$1">
              <Text bold color="$text" numberOfLines={1} size="sm">
                {data.title}
              </Text>
              <Text color="$textMuted" numberOfLines={1} size="sm">
                {data.owner.name}
              </Text>
            </VStack>
          </HStack>
          <Text color="$textMuted" size="sm">
            {Platform.OS === "web"
              ? "本视频含有多个分集，请直接点击您要下载的分集，或右键点击「另存为」下载音频："
              : "请点击要下载的分集，将在浏览器中打开下载地址："}
          </Text>
          {data.episodes.map(episode => (
            <DownloadRow bvid={data.bvid} episode={episode} key={episode.page} />
          ))}
        </VStack>
      ) : null}
    </AppLayout>
  );
}

const styles = {
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  cover: {
    height: 48,
    aspectRatio: 3 / 2,
    borderRadius: 8,
  },
};
