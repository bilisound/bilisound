import { Button, StateContent, Text } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useMemo, useState } from "react";

import { AppLayout } from "~/components/app-layout";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { notify, reportError } from "~/components/feedback";
import { PlaylistActionSheet } from "~/components/playlist-action-sheet";
import type { PlaylistSheetAction } from "~/components/playlist-action-sheet";
import { PlaylistFilterField } from "~/components/playlist-filter-field";
import { PlaylistItem } from "~/components/playlist-item";
import { breakpoints } from "~/constants/styles";
import { getVideoImageUrl } from "~/features/bilibili";
import { usePlaylistViewConfig, useSettingsActions } from "~/features/config";
import { getQueueOwnerPlaylistId, invalidateQueueOwnership } from "~/features/playback";
import { deletePlaylistMeta, filterPlaylistsByQuery, getPlaylistMetas, type Playlist } from "~/features/playlist";
import { useWindowSize } from "~/hooks/useWindowSize";
import { exportPlaylistToFile, importPlaylistFromFile } from "~/utils/exchange/playlist";
import { padArrayToColumns } from "~/utils/misc";

/**
 * 歌单列表页，搬运自 v2 `apps/mobile/app/(main)/(playlist)/playlist.tsx`。
 *
 * 保留:搜索过滤、网格偏好切换、扫码入口、创建/导入入口、长按
 * （修改信息/修改封面/导出/删除）、删除确认与队列归属清理。
 * 「修改封面」与 v2 相同：仅本地歌单（无 source）且曲目数 > 0 时展示，
 * 跳转 `/utils/cover-picker`。
 */
export default function PlaylistScreen() {
  const queryClient = useQueryClient();
  const { showPlaylistInGrid } = usePlaylistViewConfig();
  const { toggle } = useSettingsActions();
  const { width } = useWindowSize();

  const { data, error, isError, isPending, refetch } = useQuery({
    queryKey: ["playlist_meta"],
    queryFn: () => getPlaylistMetas(),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Playlist | undefined>();
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);

  const playlists = useMemo(() => data ?? [], [data]);
  const filteredPlaylists = useMemo(() => filterPlaylistsByQuery(playlists, searchQuery), [playlists, searchQuery]);

  // 与 apps/mobile-next 的 AppShell 对齐：>= md 时左侧导航占 156px。
  const sidebarWidth = width >= breakpoints.md ? 156 : 0;
  const availableWidth = Math.min(Math.max(width - sidebarWidth, 0), 1280);
  const columns = showPlaylistInGrid ? Math.max(Math.floor(availableWidth / 200), 2) : availableWidth > 1024 ? 2 : 1;
  const gridSidePadding = availableWidth >= 448 ? 12 : 8;

  async function handleImport() {
    if (importing) {
      return;
    }
    setImporting(true);
    try {
      const result = await importPlaylistFromFile();
      if (result) {
        queryClient.setQueryData(["playlist_meta"], await getPlaylistMetas());
        await queryClient.invalidateQueries({ queryKey: ["playlist_meta_apply"] });
      }
    } catch (importError) {
      reportError(importError);
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete() {
    const target = deleteTarget;
    setDeleteTarget(undefined);
    if (!target || deleting) {
      return;
    }
    setDeleting(true);
    try {
      await deletePlaylistMeta(target.id);
      if (getQueueOwnerPlaylistId() === target.id) {
        invalidateQueueOwnership();
      }
      await queryClient.refetchQueries({ queryKey: ["playlist_meta"] });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] });
      notify(`歌单「${target.title}」已删除`);
    } catch (deleteError) {
      reportError(deleteError);
    } finally {
      setDeleting(false);
    }
  }

  const addActions: PlaylistSheetAction[] = [
    {
      id: "create",
      text: "创建新歌单",
      icon: "fa6-solid:plus",
      onPress: () => router.navigate("/playlist/meta/new"),
    },
    {
      id: "import",
      text: importing ? "正在导入歌单……" : "导入歌单",
      icon: "fa6-solid:file-import",
      disabled: importing,
      onPress: () => void handleImport(),
    },
  ];

  const itemActions: PlaylistSheetAction[] = [
    {
      id: "edit",
      text: "修改信息",
      icon: "fa6-solid:pen",
      onPress: () => {
        if (activePlaylist) {
          router.push(`/playlist/meta/${activePlaylist.id}`);
        }
      },
    },
    {
      id: "editCover",
      text: "修改封面",
      icon: "fa6-solid:images",
      // 与 v2 相同：在线歌单的封面跟随上游，只有本地歌单且有曲目时才能改。
      show: !activePlaylist?.source && (activePlaylist?.amount ?? 0) > 0,
      onPress: () => {
        if (activePlaylist) {
          router.push(`/utils/cover-picker?listId=${activePlaylist.id}`);
        }
      },
    },
    {
      id: "export",
      text: "导出",
      icon: "fa6-solid:file-export",
      onPress: () => {
        if (activePlaylist) {
          void exportPlaylistToFile(activePlaylist.id).catch(reportError);
        }
      },
    },
    {
      id: "delete",
      text: "删除",
      icon: "fa6-solid:trash",
      onPress: () => {
        if (activePlaylist) {
          setDeleteTarget(activePlaylist);
        }
      },
    },
    {
      id: "close",
      text: "取消",
      icon: "fa6-solid:xmark",
      iconSize: 20,
      onPress: () => {},
    },
  ];

  const openSheet = (playlist: Playlist) => {
    setActivePlaylist(playlist);
    setSheetOpen(true);
  };

  function renderContent() {
    if (isPending) {
      return <StateContent title="正在加载歌单" loading />;
    }

    if (isError) {
      return (
        <StateContent
          title="歌单加载失败"
          description={error instanceof Error ? error.message : String(error)}
          onRetry={() => void refetch()}
        />
      );
    }

    if (playlists.length === 0) {
      return (
        <View flex={1} alignItems="center" justifyContent="center" gap="$4" padding="$6">
          <Text color="$textMuted" semiBold>
            这里空空如也
          </Text>
          <Button onPress={() => router.navigate("/")}>去查询</Button>
        </View>
      );
    }

    return (
      <>
        <PlaylistFilterField
          accessibilityHint="输入关键词后过滤当前歌单列表"
          accessibilityLabel="过滤歌单"
          placeholder="过滤歌单标题或描述……"
          resultLabel={`过滤后有 ${filteredPlaylists.length} 个歌单`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {filteredPlaylists.length === 0 ? (
          <View flex={1} alignItems="center" justifyContent="center" padding="$6">
            <Text color="$textMuted">没有匹配的歌单</Text>
          </View>
        ) : (
          <FlashList
            key={columns}
            contentContainerStyle={{
              paddingHorizontal: showPlaylistInGrid ? gridSidePadding : 0,
              paddingBottom: 16,
            }}
            data={padArrayToColumns(filteredPlaylists, columns)}
            extraData={[showPlaylistInGrid, searchQuery]}
            keyExtractor={(item, index) => (item ? String(item.id) : `placeholder-${index}`)}
            numColumns={columns}
            renderItem={({ item }) =>
              item ? (
                <PlaylistItem
                  grid={showPlaylistInGrid}
                  item={item}
                  onLongPress={() => openSheet(item)}
                  onPress={() => router.push(`/playlist/${item.id}`)}
                />
              ) : (
                <View flex={1} padding="$2" />
              )
            }
            style={{ flex: 1 }}
          />
        )}
      </>
    );
  }

  return (
    <AppLayout
      title="歌单"
      scroll={false}
      actions={
        <>
          <Button
            aria-label={showPlaylistInGrid ? "切换到列表视图" : "切换到网格视图"}
            icon={showPlaylistInGrid ? "mingcute:grid-fill" : "fa6-solid:list"}
            shape="rounded"
            variant="ghost"
            onPress={() => toggle("showPlaylistInGrid")}
          />
          <Button
            aria-label="扫描二维码"
            icon="uil:qrcode-scan"
            shape="rounded"
            variant="ghost"
            onPress={() => router.navigate("/barcode")}
          />
          <Button
            aria-label="添加或导入歌单"
            icon="fa6-solid:plus"
            shape="rounded"
            variant="ghost"
            onPress={() => setAddMenuOpen(true)}
          />
        </>
      }
    >
      <View flex={1} minWidth={0}>
        {renderContent()}
      </View>

      <PlaylistActionSheet actions={addActions} open={addMenuOpen} onClose={() => setAddMenuOpen(false)} />
      <PlaylistActionSheet
        actions={itemActions}
        open={sheetOpen}
        summary={
          activePlaylist
            ? {
                line1: activePlaylist.title,
                line2: `${activePlaylist.amount} 首歌曲`,
                image: activePlaylist.imgUrl ? getVideoImageUrl(activePlaylist.imgUrl) : undefined,
              }
            : undefined
        }
        onClose={() => setSheetOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除歌单确认"
        description={`确定要删除歌单「${deleteTarget?.title ?? ""}」吗？删除后无法恢复。`}
        onClose={confirmed => {
          if (confirmed) {
            void handleDelete();
          } else {
            setDeleteTarget(undefined);
          }
        }}
      />
    </AppLayout>
  );
}
