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
import {
  getCacheAudioPath,
  getCacheStatusKey,
  useCacheExists,
  useDownloadList,
  type DownloadItem,
} from "~/features/cache";
import { getResourcePolicy } from "~/features/config";
import { pause } from "~/features/player";
import { openAddPlaylistPage } from "~/features/playlist";
import { notify } from "~/components/feedback";
import { cacheEpisodeToLocal, openDownloadWebEntry, type EpisodeCacheOutcome } from "~/components/discovery-download";
import { formatSecond } from "~/utils/datetime";
import { saveAudioFile, uriToPath } from "~/utils/file";
import log from "~/utils/logger";
import { bv2av } from "~/utils/vendors/av-bv";

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
 * 搬运 v2 PageMenu：添加到歌单（整个视频）、下载（仅 Web）、在浏览器打开
 * （先暂停播放，v2 行为）、复制视频链接；native 的批量下载入口在
 * discovery-video-meta 的下载按钮（v2 MetaData 同款位置）。
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
        // v2：跳转浏览器前先暂停播放，避免外链与播放器同时出声
        await pause();
        await Linking.openURL(videoUrl);
        setOpen(false);
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
 * 下载任务文案（v2 useDownloadMenuItem 同款：排队中 / 下载中 (x%) / 缓存到本地）。
 *
 * 额外区分「本地处理中」与「下载失败」（v2 会一直显示下载中），
 * 避免失败任务在菜单里被误报成仍在下载。
 */
function formatCacheTaskText(task: DownloadItem | undefined): string {
  if (!task) {
    return "缓存到本地";
  }
  if (task.status === 0) {
    return "排队中……";
  }
  if (task.status === 2) {
    return "本地处理中";
  }
  if (task.status === 3) {
    return "下载失败";
  }
  // v2 同款算式：总字节未知（0）时退化为 0%
  const percent = Math.round((task.progress.totalBytesWritten / task.progress.totalBytesExpectedToWrite) * 100 || 0);
  return `下载中 (${percent}%)`;
}

/** 把真实下载结果转成用户提示：只有确实产出缓存才说「已缓存到本地」，取消/重复入队都不误报成功 */
function notifyCacheOutcome(outcome: EpisodeCacheOutcome, title: string) {
  switch (outcome) {
    case "downloaded":
      notify(`「${title}」已缓存到本地`);
      break;
    case "already-cached":
      notify("该分 P 已在本地缓存");
      break;
    case "queued":
      notify("该分 P 已在下载队列中");
      break;
    case "cancelled":
      notify("下载已取消");
      break;
  }
}

/**
 * discovery-episode-menu — 长按分 P 的操作菜单（搬运 v2 LongPressActions / useDownloadMenuItem）。
 *
 * 顺序与 v2 一致：下载（native 缓存到本地 / Web 下载）→ 保存到文件（native 且已缓存）→
 * 添加到歌单 → 取消。缓存到本地期间菜单保持打开并实时显示进度；已在队列中的任务不可重复触发。
 *
 * v2 的「删除缓存」有意不搬运：v2 该项实际删除的是当前播放曲目的缓存（v2 自身缺陷，
 * 对未播放分 P 并不生效），当前曲目路径由播放器面板菜单覆盖。
 */
export interface DiscoveryEpisodeMenuProps {
  data?: VideoMetadata;
  episode?: VideoEpisode | null;
  onClose: () => void;
}

export function DiscoveryEpisodeMenu({ data, episode, onClose }: DiscoveryEpisodeMenuProps) {
  const videoUrl = data ? getVideoUrl(data.bvid) : undefined;
  const cached = useCacheExists(data?.bvid, episode?.page);
  const { downloadList } = useDownloadList();
  const downloadTask = data && episode ? downloadList.get(getCacheStatusKey(data.bvid, episode.page)) : undefined;

  const menuItems: ActionMenuItem[] =
    data && episode
      ? [
          ...(Platform.OS !== "web" && !cached
            ? [
                {
                  text: formatCacheTaskText(downloadTask),
                  icon: "fa6-solid:download",
                  iconSize: 18,
                  disabled: Boolean(downloadTask),
                  async action() {
                    const title = episode.displayTitle;
                    try {
                      notifyCacheOutcome(await cacheEpisodeToLocal(data.bvid, episode.page, title), title);
                    } catch (cause) {
                      log.error(`缓存分 P 失败，原因：${cause}`);
                      notify(`下载失败：${cause instanceof Error ? cause.message : String(cause)}`, true);
                    }
                  },
                } satisfies ActionMenuItem,
              ]
            : []),
          ...(Platform.OS !== "web" && cached
            ? [
                {
                  text: "保存到文件",
                  icon: "fa6-solid:floppy-disk",
                  iconSize: 18,
                  async action() {
                    onClose();
                    // 目标一律取长按的分 P（而非当前播放曲目），与 v2 useDownloadMenuItem 的公式一致
                    const { useLegacyID } = getResourcePolicy();
                    const fileName = `[${useLegacyID ? "av" + bv2av(data.bvid) : data.bvid}] [P${episode.page}] ${episode.title}.m4a`;
                    try {
                      await saveAudioFile(uriToPath(getCacheAudioPath(data.bvid, episode.page, false)), fileName);
                      // 底层（Android SAF / iOS 分享面板）在用户取消时不会回报确认信息，不能宣称「已保存」
                      notify("保存或分享操作已结束");
                    } catch (cause) {
                      log.error(`文件未保存：${cause}`);
                      notify(`文件未保存：${cause instanceof Error ? cause.message : String(cause)}`, true);
                    }
                  },
                } satisfies ActionMenuItem,
              ]
            : []),
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
            text: "添加到歌单",
            icon: "fa6-solid:plus",
            iconSize: 16,
            action() {
              onClose();
              openAddPlaylistPage(buildEpisodePlaylistDraft(data, episode));
            },
          },
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
