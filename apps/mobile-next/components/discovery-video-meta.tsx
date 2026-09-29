import { useState } from "react";
import { Platform, Pressable } from "react-native";
import { router } from "expo-router";
import { Button, Text } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { decodeHTML } from "entities";
import { Image } from "expo-image";

import { getVideoImageUrl, getVideoUrl, type VideoMetadata } from "~/features/bilibili";
import { openAddPlaylistPage } from "~/features/playlist";
import { buildVideoPlaylistDraft } from "~/features/bilibili/discovery";
import { openDownloadWebEntry } from "~/components/discovery-download";
import { formatDate } from "~/utils/datetime";

/**
 * discovery-video-meta — 视频详情元数据面板（封面、标题、作者/参与者、简介与操作）。
 *
 * 宽屏时作为 DualScrollView 左栏（showFullMeta 直接展开简介），
 * 窄屏时作为列表头（折叠简介，点击展开）。
 */
export interface DiscoveryVideoMetaProps {
  data: VideoMetadata;
  showFullMeta?: boolean;
}

export function DiscoveryVideoMeta({ data, showFullMeta = false }: DiscoveryVideoMetaProps) {
  const [expanded, setExpanded] = useState(false);
  const showFullDescription = showFullMeta || expanded;
  const coverUrl = getVideoImageUrl(data.coverUrl, getVideoUrl(data.bvid));

  const staffRows: NonNullable<VideoMetadata["staff"]>[] = [];
  if (data.staff) {
    for (let index = 0; index < data.staff.length; index += 2) {
      staffRows.push(data.staff.slice(index, index + 2));
    }
  }

  return (
    <View gap="$4">
      <Image contentFit="cover" source={coverUrl} style={styles.cover} />
      <View>
        <Text bold color="$text" size="md" style={{ marginBottom: data.staff ? 8 : 16 }}>
          {data.title}
        </Text>
        <View
          alignItems="center"
          flexDirection={data.staff ? "column-reverse" : "row"}
          gap="$3"
          style={{ marginBottom: data.staff ? 24 : 16 }}
        >
          {data.staff ? (
            <View gap="$4" width="100%">
              {staffRows.map((row, rowIndex) => (
                <View flexDirection="row" gap="$3" key={rowIndex}>
                  {row.map(member => (
                    <View alignItems="center" flex={1} flexDirection="row" gap="$3" key={member.id}>
                      <Image
                        contentFit="cover"
                        source={getVideoImageUrl(member.avatarUrl, getVideoUrl(data.bvid))}
                        style={styles.avatar}
                      />
                      <View flex={1} gap="$1">
                        <Text color="$text" numberOfLines={1} semiBold size="sm">
                          {member.name}
                        </Text>
                        <Text color="$textMuted" numberOfLines={1} size="sm">
                          {member.role}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <>
              <Image
                contentFit="cover"
                source={getVideoImageUrl(data.owner.avatarUrl, getVideoUrl(data.bvid))}
                style={styles.ownerAvatar}
              />
              <Text color="$text" flex={1} numberOfLines={1} semiBold size="sm">
                {data.owner.name}
              </Text>
            </>
          )}
          <Text color="$textMuted" size="sm">
            {formatDate(data.publishedAt)}
          </Text>
        </View>
        {showFullDescription ? (
          <Text selectable size="sm">
            {decodeHTML(data.description)}
          </Text>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setExpanded(true)}>
            <Text numberOfLines={6} size="sm">
              {decodeHTML(data.description)}
            </Text>
          </Pressable>
        )}
        <View flexDirection="row" flexWrap="wrap" gap="$2" style={{ marginTop: 16 }}>
          {Platform.OS === "web" ? (
            <Button icon="fa6-solid:download" onPress={() => openDownloadWebEntry(data)} shape="rounded">
              下载
            </Button>
          ) : null}
          <Button
            icon="fa6-solid:plus"
            onPress={() => openAddPlaylistPage(buildVideoPlaylistDraft(data))}
            shape="rounded"
          >
            创建歌单
          </Button>
          {data.seasonId ? (
            <Button
              icon="fa6-solid:list"
              onPress={() =>
                router.navigate(`/remote-list?userId=${data.owner.id}&listId=${data.seasonId}&mode=season`)
              }
              shape="rounded"
              variant="outline"
            >
              查看所属合集
            </Button>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = {
  cover: {
    aspectRatio: 16 / 9,
    borderRadius: 8,
    width: "100%" as const,
  },
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  ownerAvatar: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
};
