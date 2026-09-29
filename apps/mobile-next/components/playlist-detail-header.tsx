import { useQueryClient } from "@tanstack/react-query";
import { Button, Modal, ModalBackdrop, ModalBody, ModalContent, ModalPortal, Text } from "@bilisound/ui";
import { useTheme, View } from "@tamagui/core";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

import { notify, reportError } from "~/components/feedback";
import { PlaylistImagesGroup } from "~/components/playlist-images-group";
import { getVideoImageUrl } from "~/features/bilibili";
import { updatePlaylist, type Playlist } from "~/features/playlist";
import { convertToRelativeTime } from "~/utils/datetime";

export interface PlaylistDetailHeaderProps {
  meta: Playlist;
  images: string[];
  showPlayButton: boolean;
  onPlay: () => void;
}

/**
 * 歌单详情头部，由 v2 `apps/mobile/components/playlist-detail/Header.tsx` 搬运。
 *
 * 保留全部业务行为：封面/拼图、`N 首歌曲 + 上次同步` 文案、播放按钮、
 * 在线歌单同步（进度回调 + 弹窗 + 失败提示）、描述展示。
 * v2 的批量下载按钮依赖下载管理器页面，不属于本任务范围，未迁移（见任务报告）。
 */
export function PlaylistDetailHeader({ meta, images, showPlayButton, onPlay }: PlaylistDetailHeaderProps) {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastSyncString, setLastSyncString] = useState("");

  // 同步时间的相对显示，每 5 秒刷新一次（与 v2 相同）。
  useEffect(() => {
    if (!meta.source) {
      return;
    }
    const update = () => setLastSyncString(convertToRelativeTime(meta.source!.lastSyncAt));
    update();
    const handle = setInterval(update, 5000);
    return () => clearInterval(handle);
  }, [meta]);

  const source = meta.source;

  async function handleSync() {
    if (!source || syncing) {
      return;
    }
    setSyncing(true);
    setProgress(0);
    try {
      const total = await updatePlaylist(meta.id, source, value => setProgress(value));
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["playlist_meta"] }),
        queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] }),
        queryClient.refetchQueries({ queryKey: [`playlist_meta_${meta.id}`] }),
        queryClient.refetchQueries({ queryKey: [`playlist_detail_${meta.id}`] }),
      ]);
      notify(`歌单同步成功：目前歌单中有 ${total} 首歌曲`);
    } catch (error) {
      reportError(error);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <View gap="$4" paddingTop="$4">
      {meta.imgUrl ? (
        <Image
          source={getVideoImageUrl(meta.imgUrl)}
          style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 8 }}
          contentFit="cover"
        />
      ) : (
        <PlaylistImagesGroup images={images} />
      )}

      <View gap="$1">
        <Text color="$text" semiBold size="xl">
          {meta.title}
        </Text>
        <Text color="$textMuted" size="sm">
          {`${meta.amount} 首歌曲` + (source ? ` ・ 上次同步：${lastSyncString}` : "")}
        </Text>
      </View>

      {showPlayButton ? (
        <View flexDirection="row" gap="$2">
          <Button icon="fa6-solid:play" shape="rounded" onPress={onPlay}>
            播放
          </Button>
          {source ? (
            <Button
              aria-label="同步在线歌单"
              disabled={syncing}
              icon="fa6-solid:arrow-rotate-left"
              shape="rounded"
              variant="outline"
              onPress={handleSync}
            />
          ) : null}
        </View>
      ) : null}

      {(meta.description ?? "").trim() ? (
        <Text color="$textMuted" selectable size="sm">
          {meta.description}
        </Text>
      ) : null}

      <Modal open={syncing} onOpenChange={() => {}}>
        <ModalPortal>
          <ModalBackdrop />
          <ModalContent>
            <ModalBody>
              <View flexDirection="row" alignItems="center" gap="$3" paddingVertical="$2">
                <ActivityIndicator color={theme.primarySolid.get()} />
                <View gap="$1">
                  <Text color="$text" semiBold>
                    正在同步在线歌单
                  </Text>
                  <Text color="$textMuted" size="sm">{`已完成 ${Math.round(progress * 100)}%`}</Text>
                </View>
              </View>
            </ModalBody>
          </ModalContent>
        </ModalPortal>
      </Modal>
    </View>
  );
}
