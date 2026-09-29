import * as Player from "@bilisound/player";
import { PLAYLIST_ON_QUEUE, playlistStorage, usePlaylistOnQueue } from "~/storage/playlist";
import { playPlaylist } from "./track-operations";
import type { PlayableItem } from "~/features/playlist";
import log from "~/utils/logger";

interface UsePlaylistPlayerOptions {
  playlistId: number;
  filteredPlaylistDetail: PlayableItem[];
  getOriginalIndex: (filteredIndex: number) => number;
  showConfirmDialog: (options: { title: string; description: string; onConfirm: () => Promise<void> }) => void;
}

export function usePlaylistPlayer({
  playlistId,
  filteredPlaylistDetail,
  getOriginalIndex,
  showConfirmDialog,
}: UsePlaylistPlayerOptions) {
  const [, setPlaylistOnQueue] = usePlaylistOnQueue();

  async function handlePlayConfirm(index: number) {
    log.debug("将队列中的内容设置为本歌单");
    // playPlaylist 内部已重置随机模式（Player.setShuffleMode + 持久化偏好）
    await playPlaylist(playlistId, index);
    setPlaylistOnQueue({ value: { id: playlistId } });
  }

  async function handlePlay(index = 0) {
    try {
      const from = (await Player.getTracks())?.[index];
      const to = filteredPlaylistDetail?.[index];
      const originalIndex = getOriginalIndex(index);

      let activeTrack = null;
      try {
        activeTrack = await Player.getCurrentTrack();
      } catch (error) {
        // TODO Bilisound 播放器在 iOS 的行为与其它端不一样，如果没有播放曲目会直接抛出错误
        log.debug("错误兜底：" + error);
      }

      const onQueue = JSON.parse(playlistStorage.getString(PLAYLIST_ON_QUEUE) ?? "{}")?.value;

      // 检查是否可以就地跳转
      if (
        onQueue?.id === playlistId &&
        activeTrack &&
        from?.extendedData?.id === to?.bvid &&
        from?.extendedData?.episode === to?.episode
      ) {
        log.debug("当前队列中的内容来自本歌单，就地跳转");
        await Player.jump(originalIndex);
        return;
      }

      // 空队列或仍关联任意歌单（未 tainted）的队列可以直接切换；
      // 只有非空且没有歌单归属标记的队列需要确认替换
      if (onQueue || (await Player.getTracks()).length <= 0) {
        return handlePlayConfirm(originalIndex);
      }

      // 需要确认替换队列
      showConfirmDialog({
        title: "替换播放队列确认",
        description: "播放本歌单中的歌曲，将会把当前播放队列替换为本歌单。确定要继续吗？",
        onConfirm: () => handlePlayConfirm(originalIndex),
      });
    } catch (e) {
      log.error("操作失败：" + e);
    }
  }

  return { handlePlay };
}
