import { useState } from "react";
import { Platform, Vibration } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import useMultiSelect from "~/hooks/useMultiSelect";
import useApplyPlaylistStore from "~/store/apply-playlist";
import { deletePlaylistDetail, syncPlaylistAmount } from "~/storage/sqlite/playlist";
import { PLAYLIST_ON_QUEUE, playlistStorage, usePlaylistOnQueue } from "~/storage/playlist";
import { PlaylistDetail, PlaylistMeta } from "~/storage/sqlite/schema";

interface UsePlaylistEditorOptions {
  playlistId: number;
  meta: PlaylistMeta | undefined;
  playlistDetail: PlaylistDetail[] | undefined;
  filteredPlaylistDetail: PlaylistDetail[];
  refetchData: () => Promise<void>;
  showConfirmDialog: (options: { title: string; description: string; onConfirm: () => Promise<void> }) => void;
}

export function usePlaylistEditor({
  playlistId,
  meta,
  playlistDetail,
  filteredPlaylistDetail,
  refetchData,
  showConfirmDialog,
}: UsePlaylistEditorOptions) {
  const queryClient = useQueryClient();
  const [, setPlaylistOnQueue] = usePlaylistOnQueue();

  // 多选状态
  const { clear, toggle, selected, setAll, reverse } = useMultiSelect<number>();
  const [editing, setEditing] = useState(false);

  // 是否锁定编辑（在线歌单不能删除）
  const isEditLocked = !meta || !!meta?.source;

  // 长按进入编辑模式
  function handleLongPress(index: number) {
    if (!editing) {
      if (Platform.OS === "android") {
        Vibration.vibrate(25);
      }
      setEditing(true);
      toggle(index);
    }
  }

  // 进入编辑模式
  function enterEditMode() {
    setEditing(true);
  }

  // 退出编辑模式
  function exitEditMode() {
    setEditing(false);
    clear();
  }

  // 删除选中项目
  function handleDelete() {
    showConfirmDialog({
      title: "删除曲目确认",
      description: `确定要从本歌单中删除 ${selected.size} 首曲目吗？`,
      onConfirm: async () => {
        if (!playlistDetail || !filteredPlaylistDetail) {
          return;
        }
        const onQueue = JSON.parse(playlistStorage.getString(PLAYLIST_ON_QUEUE) ?? "{}")?.value;

        // 注意，这里的 selected 是过滤后数组的 index，需要映射到原始数据的 id
        for (const e of selected) {
          const itemToDelete = filteredPlaylistDetail[e];
          if (itemToDelete) {
            await deletePlaylistDetail(itemToDelete.id);
          }
        }
        await syncPlaylistAmount(playlistId);
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["playlist_meta"] }),
          queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] }),
          queryClient.refetchQueries({ queryKey: [`playlist_meta_${playlistId}`] }),
          queryClient.refetchQueries({ queryKey: [`playlist_detail_${playlistId}`] }),
        ]);
        await refetchData();
        if (onQueue?.id === playlistId) {
          setPlaylistOnQueue(undefined);
        }
        clear();
      },
    });
  }

  // 复制选中项目到新歌单
  function handleCopy() {
    if (!meta || !filteredPlaylistDetail) {
      return;
    }
    const state = useApplyPlaylistStore.getState();
    state.setName(meta.title + "（副本）");
    state.setPlaylistDetail([...selected].map(e => filteredPlaylistDetail[e]).filter(Boolean));
    state.setSource(undefined);
    router.push("/apply-playlist");
  }

  // 全选
  function selectAll() {
    setAll(Array.from({ length: filteredPlaylistDetail.length }).map((_, i) => i));
  }

  // 反选
  function selectReverse() {
    reverse(Array.from({ length: filteredPlaylistDetail.length }).map((_, i) => i));
  }

  return {
    // 状态
    editing,
    selected,
    isEditLocked,
    // 操作
    toggle,
    handleLongPress,
    handleDelete,
    handleCopy,
    selectAll,
    selectReverse,
    enterEditMode,
    exitEditMode,
  };
}
