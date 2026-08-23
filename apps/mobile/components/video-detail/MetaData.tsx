import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { ViewStyle } from "react-native";
import { Platform, View } from "react-native";
import { router } from "expo-router";
import { twMerge } from "tailwind-merge";
import { decodeHTML } from "entities";
import { Image } from "expo-image";
import type { VideoMetadata } from "~/features/bilibili";

import { Text } from "~/components/ui/text";
import { Skeleton } from "~/components/ui/skeleton";
import { SkeletonText } from "~/components/skeleton-text";
import { Pressable } from "~/components/ui/pressable";
import { Button, ButtonMonIcon, ButtonOuter, ButtonText } from "~/components/ui/button";
import { DownloadButton } from "~/components/download-button";

import { getDownloadUrl, getVideoImageUrl, getVideoUrl } from "~/features/bilibili";
import { formatDate } from "~/utils/datetime";
import { FEATURE_MASS_DOWNLOAD } from "~/constants/feature";
import { useWindowSize } from "~/hooks/useWindowSize";
import log from "~/utils/logger";
import { handleAddPlaylist } from "./helpers";

export interface MetaDataProps {
  data?: VideoMetadata;
  className?: string;
  style?: ViewStyle;
  showFullMeta?: boolean;
}

export function MetaData({ data, className, style, showFullMeta }: MetaDataProps) {
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
    return data.episodes.map(episode => ({
      id: data.bvid,
      episode: episode.page,
      title: episode.displayTitle,
    }));
  }, [data]);

  const downloadWeb = () => {
    if (!data) {
      return;
    }
    if (data.episodes.length === 1) {
      globalThis.window.open(getDownloadUrl(data.bvid, 1));
      return;
    }
    router.navigate(`/download-web?id=${data.bvid}`);
  };

  let staff: ReactNode = null;
  if (data?.staff) {
    const groupedArray: NonNullable<VideoMetadata["staff"]>[] = [];
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
                  source={getVideoImageUrl(f.avatarUrl, getVideoUrl(data.bvid))}
                  className="flex-0 basis-auto size-10 rounded-full aspect-square"
                />
                <View className={"flex-1 gap-1"}>
                  <Text className="text-sm font-semibold text-typography-700" isTruncated>
                    {f.name}
                  </Text>
                  <Text className="text-sm text-typography-500" isTruncated>
                    {f.role}
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
        <Image source={getVideoImageUrl(data.coverUrl, getVideoUrl(data.bvid))} className="aspect-[16/9] rounded-lg" />
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
                    source={getVideoImageUrl(data.owner.avatarUrl, getVideoUrl(data.bvid))}
                    className="w-9 h-9 rounded-full aspect-square flex-shrink-0"
                  />
                  <Text className="flex-grow text-sm font-bold text-typography-700" isTruncated>
                    {data.owner.name}
                  </Text>
                </>
              )}
              <Text className="flex-shrink-0 text-sm opacity-50 text-typography-700 ">
                {formatDate(data.publishedAt)}
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
                {decodeHTML(data.description)}
              </Text>
            ) : (
              <Pressable onPress={() => setAlwaysShowFullMeta(true)}>
                <Text className={"text-sm leading-normal break-words line-clamp-6"}>
                  {decodeHTML(data.description)}
                </Text>
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
                      router.navigate(`/remote-list?userId=${data.owner.id}&listId=${data.seasonId}&mode=season`);
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
