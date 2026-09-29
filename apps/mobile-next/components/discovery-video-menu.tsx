import { useState } from "react";
import { Linking, Platform } from "react-native";
import { ActionMenu, Button, Text, type ActionMenuItem } from "@bilisound/ui";
import { View } from "@tamagui/core";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";

import {
  getDownloadUrl,
  getVideoImageUrl,
  getVideoUrl,
  type VideoEpisode,
  type VideoMetadata,
} from "~/features/bilibili";
import { buildEpisodePlaylistDraft, buildVideoPlaylistDraft } from "~/features/bilibili/discovery";
import { openAddPlaylistPage } from "~/features/playlist";
import { notify } from "~/components/feedback";
import { openDownloadWebEntry } from "~/components/discovery-download";
import { formatSecond } from "~/utils/datetime";

function MenuHeader({ image, title, subtitle }: { image: string; title: string; subtitle: string }) {
  return (
    <View alignItems="center" flexDirection="row" gap="$4" paddingHorizontal="$2" paddingVertical="$3" width="100%">
      <Image contentFit="cover" source={image} style={styles.headerImage} />
      <View flex={1} gap="$1">
        <Text bold color="$text" numberOfLines={1}>
          {title}
        </Text>
        <Text color="$textMuted" numberOfLines={1} size="sm">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

/**
 * discovery-video-menu — 视频详情页头部「更多操作」菜单。
 *
 * 搬运 v2 PageMenu：添加到歌单（整个视频）、下载（仅 Web）、在浏览器打开、
 * 复制视频链接；native 本地缓存 / 批量下载入口留待下载管理器切片。
 */
export function DiscoveryVideoMenu({ data }: { data: VideoMetadata }) {
  const [open, setOpen] = useState(false);
  const videoUrl = getVideoUrl(data.bvid);

  const menuItems: ActionMenuItem[] = [
    {
      text: "添加到歌单",
      icon: "fa6-solid:plus",
      iconSize: 16,
      action() {
        setOpen(false);
        openAddPlaylistPage(buildVideoPlaylistDraft(data));
      },
    },
    ...(Platform.OS === "web"
      ? [
          {
            text: "下载",
            icon: "fa6-solid:download",
            iconSize: 18,
            action() {
              setOpen(false);
              openDownloadWebEntry(data);
            },
          } satisfies ActionMenuItem,
        ]
      : []),
    {
      text: "在浏览器打开",
      icon: "fa6-solid:link",
      iconSize: 16,
      async action() {
        setOpen(false);
        await Linking.openURL(videoUrl);
      },
    },
    {
      text: "复制视频链接",
      icon: "fa6-solid:copy",
      iconSize: 18,
      async action() {
        setOpen(false);
        await Clipboard.setStringAsync(videoUrl);
        notify("视频链接已复制到剪贴板");
      },
    },
    {
      text: "取消",
      icon: "fa6-solid:xmark",
      iconSize: 20,
      action() {
        setOpen(false);
      },
    },
  ];

  return (
    <>
      <Button
        aria-label="更多操作"
        icon="fa6-solid:ellipsis-vertical"
        onPress={() => setOpen(true)}
        shape="rounded"
        size="lg"
        variant="ghost"
      />
      <ActionMenu
        header={
          <MenuHeader image={getVideoImageUrl(data.coverUrl, videoUrl)} subtitle={data.owner.name} title={data.title} />
        }
        menuItems={menuItems}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

/**
 * discovery-episode-menu — 长按分 P 的操作菜单（搬运 v2 LongPressActions 的可搬运部分）。
 *
 * `episode` 为空时菜单关闭；长按单曲「添加到歌单」只添加该分 P。
 */
export interface DiscoveryEpisodeMenuProps {
  data?: VideoMetadata;
  episode?: VideoEpisode | null;
  onClose: () => void;
}

export function DiscoveryEpisodeMenu({ data, episode, onClose }: DiscoveryEpisodeMenuProps) {
  const videoUrl = data ? getVideoUrl(data.bvid) : undefined;

  const menuItems: ActionMenuItem[] =
    data && episode
      ? [
          {
            text: "添加到歌单",
            icon: "fa6-solid:plus",
            iconSize: 16,
            action() {
              onClose();
              openAddPlaylistPage(buildEpisodePlaylistDraft(data, episode));
            },
          },
          ...(Platform.OS === "web"
            ? [
                {
                  text: "下载",
                  icon: "fa6-solid:download",
                  iconSize: 18,
                  action() {
                    onClose();
                    globalThis.window.open(getDownloadUrl(data.bvid, episode.page));
                  },
                } satisfies ActionMenuItem,
              ]
            : []),
          {
            text: "取消",
            icon: "fa6-solid:xmark",
            iconSize: 20,
            action() {
              onClose();
            },
          },
        ]
      : [];

  return (
    <ActionMenu
      header={
        data && episode && videoUrl ? (
          <MenuHeader
            image={getVideoImageUrl(data.coverUrl, videoUrl)}
            subtitle={formatSecond(episode.duration)}
            title={episode.title}
          />
        ) : undefined
      }
      menuItems={menuItems}
      open={Boolean(data && episode)}
      onOpenChange={(value: boolean) => {
        if (!value) {
          onClose();
        }
      }}
    />
  );
}

const styles = {
  headerImage: {
    height: 48,
    aspectRatio: 3 / 2,
    borderRadius: 8,
  },
};
