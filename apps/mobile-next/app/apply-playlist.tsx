import { Button, Icon, StateContent, Text } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable } from "react-native";

import { AppLayout } from "~/components/app-layout";
import { notify, reportError } from "~/components/feedback";
import { PlaylistItem } from "~/components/playlist-item";
import { PlaylistVideoItem } from "~/components/playlist-video-item";
import { getVideoImageUrl, getVideoUrl } from "~/features/bilibili";
import { appendPlaylistToCurrentQueue } from "~/features/playback";
import {
  addToPlaylist,
  clearApplyPlaylistDraft,
  getPlaylistMetas,
  quickCreatePlaylist,
  syncPlaylistAmount,
  useApplyPlaylistDraft,
} from "~/features/playlist";

type PendingAction = number | "create" | null;

/**
 * 「添加到歌单」页，搬运自 v2 `apps/mobile/app/apply-playlist.tsx`。
 *
 * 保留:单曲预览、快速新建（名称/描述/来源/封面来自草稿）、添加到已有歌单 +
 * 追加到当前播放队列、失败提示与草稿清理。草稿为空时给出空态而不是空白页。
 */
export default function ApplyPlaylistScreen() {
  const queryClient = useQueryClient();
  const { playlistDetail, name, description, source, cover } = useApplyPlaylistDraft();
  const hasDraft = playlistDetail.length > 0;

  const { data, error, isError, isPending, refetch } = useQuery({
    queryKey: ["playlist_meta_apply"],
    queryFn: () => getPlaylistMetas(true),
    enabled: hasDraft,
  });

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  async function handleAddToPlaylist(id: number) {
    if (pendingAction !== null) {
      return;
    }
    setPendingAction(id);
    try {
      await addToPlaylist(id, playlistDetail);
      await syncPlaylistAmount(id);
      await appendPlaylistToCurrentQueue(id, playlistDetail);

      await queryClient.refetchQueries({ queryKey: ["playlist_meta"] });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] });
      await queryClient.refetchQueries({ queryKey: [`playlist_meta_${id}`] });
      await queryClient.refetchQueries({ queryKey: [`playlist_detail_${id}`] });

      notify(`已添加 ${playlistDetail.length} 首曲目到歌单`);
      clearApplyPlaylistDraft();
      router.back();
    } catch (addError) {
      reportError(addError);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleQuickCreate() {
    if (pendingAction !== null) {
      return;
    }
    setPendingAction("create");
    try {
      await quickCreatePlaylist(name, description, playlistDetail, source, cover);
      await queryClient.refetchQueries({ queryKey: ["playlist_meta"] });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] });

      notify(`歌单创建成功：${name}`);
      clearApplyPlaylistDraft();
      router.back();
    } catch (createError) {
      reportError(createError);
    } finally {
      setPendingAction(null);
    }
  }

  if (!hasDraft) {
    return (
      <AppLayout back title="添加到歌单">
        <View flex={1}>
          <StateContent title="没有待添加的曲目" description="请先在歌曲或视频页面选择要添加的内容" />
          <View padding="$4" alignItems="center">
            <Button onPress={() => router.back()}>返回</Button>
          </View>
        </View>
      </AppLayout>
    );
  }

  if (isPending) {
    return (
      <AppLayout back title="添加到歌单">
        <StateContent title="正在加载歌单" loading />
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout back title="添加到歌单">
        <StateContent
          title="歌单加载失败"
          description={error instanceof Error ? error.message : String(error)}
          onRetry={() => void refetch()}
        />
      </AppLayout>
    );
  }

  const isSingle = playlistDetail.length === 1;
  const busy = pendingAction !== null;

  return (
    <AppLayout back title="添加到歌单" scroll={false}>
      <View flex={1} minWidth={0}>
        <View gap="$2" paddingTop="$3" paddingBottom={isSingle ? "$2" : "$3"}>
          <Text color="$textMuted" paddingHorizontal="$5" semiBold size="sm">
            {isSingle ? "添加以下曲目到指定歌单：" : `添加 ${playlistDetail.length} 项到指定歌单：`}
          </Text>
          {isSingle ? (
            <PlaylistVideoItem
              image={getVideoImageUrl(playlistDetail[0].imgUrl, getVideoUrl(playlistDetail[0].bvid))}
              text1={playlistDetail[0].title}
              text2={playlistDetail[0].author}
            />
          ) : null}
        </View>

        <FlashList
          contentContainerStyle={{ paddingBottom: 16 }}
          data={data ?? []}
          keyExtractor={item => String(item.id)}
          ListEmptyComponent={
            <Text color="$textMuted" paddingHorizontal="$5" size="sm" textAlign="center">
              还没有可用的本地歌单，使用上方入口创建
            </Text>
          }
          ListFooterComponent={
            <Text color="$textMuted" paddingHorizontal="$5" paddingTop="$4" size="sm" textAlign="center">
              与上游播放列表绑定的歌单不在这里展示
            </Text>
          }
          ListHeaderComponent={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`创建新歌单 ${name}`}
              disabled={busy}
              onPress={() => void handleQuickCreate()}
              style={({ pressed }) => ({
                opacity: busy ? 0.5 : pressed ? 0.7 : 1,
                paddingHorizontal: 20,
                paddingVertical: 12,
              })}
            >
              <View flexDirection="row" alignItems="center" gap="$3">
                <View width={24} height={24} alignItems="center" justifyContent="center">
                  <Icon name="fa6-solid:plus" size={18} color="red" />
                </View>
                <Text flex={1} minWidth={0} color="$text" size="md" truncated>
                  {name}
                </Text>
              </View>
              <Text color="$textMuted" marginLeft={36} size="sm">
                {pendingAction === "create" ? "正在创建……" : "添加新的歌单"}
              </Text>
            </Pressable>
          }
          renderItem={({ item }) => <PlaylistItem item={item} onPress={() => void handleAddToPlaylist(item.id)} />}
          style={{ flex: 1 }}
        />
      </View>
    </AppLayout>
  );
}
