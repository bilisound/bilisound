import { Button, DualScrollView, StateContent, Text } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useState } from "react";
import { Platform } from "react-native";

import { AppLayout } from "~/components/app-layout";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { reportError } from "~/components/feedback";
import { PlaylistActionSheet } from "~/components/playlist-action-sheet";
import type { PlaylistSheetAction } from "~/components/playlist-action-sheet";
import { PlaylistDetailHeader } from "~/components/playlist-detail-header";
import { PLAYLIST_EDIT_BAR_HEIGHT, PlaylistEditBar } from "~/components/playlist-edit-bar";
import { PlaylistFilterField } from "~/components/playlist-filter-field";
import { PlaylistTrackRow } from "~/components/playlist-track-row";
import { getVideoImageUrl } from "~/features/bilibili";
import { usePlaylistPlayer } from "~/features/playback";
import {
  collectUniqueCoverImages,
  getPlaylistDetail,
  getPlaylistMeta,
  usePlaylistEditor,
  usePlaylistSearch,
} from "~/features/playlist";

interface ConfirmRequest {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}

/**
 * 歌单详情页，搬运自 v2 `apps/mobile/app/(main)/(playlist)/detail/[id].tsx`。
 *
 * 保留:曲目搜索过滤、播放/替换队列确认、多选批量（长按进入、全选/反选/复制/删除）、
 * 「修改封面」（跳转 utils/cover-picker，仅本地歌单且曲目数 > 0 时展示）、
 * 「批量管理」、头部批量下载、在线歌单同步（头部组件内）、编辑态返回拦截。
 */
export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlistId = Number(id);
  const validId = Number.isInteger(playlistId);

  const metaQuery = useQuery({
    queryKey: [`playlist_meta_${id}`],
    queryFn: () => getPlaylistMeta(playlistId),
    enabled: validId,
  });

  const detailQuery = useQuery({
    queryKey: [`playlist_detail_${id}`],
    queryFn: () => getPlaylistDetail(playlistId),
    enabled: validId,
  });

  const meta = metaQuery.data ?? undefined;
  const playlistDetail = detailQuery.data;

  const { searchQuery, setSearchQuery, filteredPlaylistDetail, getOriginalIndex } = usePlaylistSearch(playlistDetail);

  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const showConfirmDialog = (options: ConfirmRequest) => setConfirmRequest(options);

  const { handlePlay } = usePlaylistPlayer({
    playlistId,
    filteredPlaylistDetail,
    getOriginalIndex,
    showConfirmDialog,
  });

  const editor = usePlaylistEditor({
    playlistId,
    meta,
    playlistDetail,
    filteredPlaylistDetail,
    refetchData: async () => {
      await Promise.all([metaQuery.refetch(), detailQuery.refetch()]);
    },
    showConfirmDialog,
  });

  // 返回时先关闭编辑模式（与 v2 相同：iOS 交给手势取消，其余平台拦截一次返回）。
  usePreventRemove(Platform.OS !== "ios" && editor.editing, () => {
    editor.exitEditMode();
  });

  const [showActionSheet, setShowActionSheet] = useState(false);

  const detailActions: PlaylistSheetAction[] = [
    {
      id: "editMeta",
      text: "修改信息",
      icon: "fa6-solid:pen",
      onPress: () => router.push(`/playlist/meta/${id}`),
    },
    {
      id: "editCover",
      text: "修改封面",
      icon: "fa6-solid:images",
      // 与 v2 相同：在线歌单的封面跟随上游，只有本地歌单且有曲目时才能改。
      show: !meta?.source && (meta?.amount ?? 0) > 0,
      onPress: () => router.push(`/utils/cover-picker?listId=${id}`),
    },
    {
      id: "editMass",
      text: "批量管理",
      icon: "fa6-solid:list-check",
      onPress: () => editor.enterEditMode(),
    },
    {
      id: "close",
      text: "取消",
      icon: "fa6-solid:xmark",
      iconSize: 20,
      onPress: () => {},
    },
  ];

  function renderBody() {
    if (!validId) {
      return <StateContent title="歌单不存在" description="链接中的歌单编号无效" />;
    }

    if (metaQuery.isPending || detailQuery.isPending) {
      return <StateContent title="正在加载歌单" loading />;
    }

    if (metaQuery.isError || detailQuery.isError) {
      const cause = metaQuery.error ?? detailQuery.error;
      return (
        <StateContent
          title="歌单加载失败"
          description={cause instanceof Error ? cause.message : String(cause)}
          onRetry={() => {
            void metaQuery.refetch();
            void detailQuery.refetch();
          }}
        />
      );
    }

    if (!meta || !playlistDetail) {
      return (
        <StateContent
          title="歌单不存在"
          description="该歌单可能已被删除"
          onRetry={() => {
            void metaQuery.refetch();
          }}
        />
      );
    }

    const images = collectUniqueCoverImages(playlistDetail);
    const hasTracks = playlistDetail.length > 0;

    return (
      <View flex={1} minWidth={0}>
        <DualScrollView
          edgeInsets={{ left: 0, right: 0, top: 0, bottom: 0 }}
          header={
            <PlaylistDetailHeader
              detail={playlistDetail}
              images={images}
              meta={meta}
              showPlayButton={hasTracks}
              onPlay={() => void handlePlay()}
            />
          }
          list={() => (
            <FlashList
              contentContainerStyle={{ paddingBottom: editor.editing ? PLAYLIST_EDIT_BAR_HEIGHT + 16 : 16 }}
              data={filteredPlaylistDetail}
              extraData={[editor.editing, editor.selected.size, searchQuery]}
              keyExtractor={item => String(item.id)}
              ListEmptyComponent={
                hasTracks ? (
                  <View alignItems="center" padding="$6">
                    <Text color="$textMuted">没有匹配的曲目</Text>
                  </View>
                ) : (
                  <View alignItems="center" padding="$6" gap="$2">
                    <Text color="$textMuted" semiBold>
                      这个歌单还没有曲目
                    </Text>
                    <Text color="$textMuted" size="sm">
                      去「查询」页搜索内容，或从播放队列填充歌单
                    </Text>
                  </View>
                )
              }
              ListHeaderComponent={
                <View>
                  <View $gtSm={{ display: "none" }}>
                    <View paddingHorizontal="$4">
                      <PlaylistDetailHeader
                        detail={playlistDetail}
                        images={images}
                        meta={meta}
                        showPlayButton={hasTracks}
                        onPlay={() => void handlePlay()}
                      />
                    </View>
                  </View>
                  {hasTracks ? (
                    <PlaylistFilterField
                      accessibilityHint="输入关键词后过滤当前歌单内的歌曲"
                      accessibilityLabel="过滤歌曲或作者"
                      placeholder="过滤歌曲或作者……"
                      resultLabel={`过滤后有 ${filteredPlaylistDetail.length} 首歌曲`}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  ) : null}
                </View>
              }
              renderItem={({ item, index }) => (
                <PlaylistTrackRow
                  data={item}
                  index={item.originalIndex + 1}
                  isChecked={editor.selected.has(index)}
                  isChecking={editor.editing}
                  onLongPress={() => editor.handleLongPress(index)}
                  onRequestPlay={() => void handlePlay(index)}
                  onToggle={() => editor.toggle(index)}
                />
              )}
              style={{ flex: 1 }}
            />
          )}
        />

        {editor.editing ? (
          <PlaylistEditBar
            isEditLocked={editor.isEditLocked}
            selectedCount={editor.selected.size}
            onCopy={editor.handleCopy}
            onDelete={editor.handleDelete}
            onSelectAll={editor.selectAll}
            onSelectReverse={editor.selectReverse}
          />
        ) : null}
      </View>
    );
  }

  return (
    <AppLayout
      back
      title="查看详情"
      actions={
        editor.editing ? (
          <Button
            aria-label="完成"
            icon="fa6-solid:check"
            shape="rounded"
            variant="ghost"
            onPress={editor.exitEditMode}
          />
        ) : (
          <Button
            aria-label="更多操作"
            icon="fa6-solid:ellipsis-vertical"
            shape="rounded"
            variant="ghost"
            onPress={() => setShowActionSheet(true)}
          />
        )
      }
    >
      {renderBody()}

      <PlaylistActionSheet
        actions={detailActions}
        open={showActionSheet}
        summary={
          meta
            ? {
                line1: meta.title,
                line2: `${meta.amount} 首歌曲`,
                image: meta.imgUrl ? getVideoImageUrl(meta.imgUrl) : undefined,
              }
            : undefined
        }
        onClose={() => setShowActionSheet(false)}
      />

      <ConfirmDialog
        open={!!confirmRequest}
        title={confirmRequest?.title ?? ""}
        description={confirmRequest?.description ?? ""}
        onClose={confirmed => {
          const request = confirmRequest;
          setConfirmRequest(null);
          if (confirmed && request) {
            request.onConfirm().catch(reportError);
          }
        }}
      />
    </AppLayout>
  );
}
