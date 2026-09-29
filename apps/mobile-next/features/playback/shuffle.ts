import { getShuffleMode, setShuffleMode, ShuffleMode } from "@bilisound/player";

import { QueuePlayingMode, setQueuePlayingMode } from "~/storage/queue";

import { savePlaybackOrder } from "./queue-snapshot";

/**
 * 切换随机播放模式。
 *
 * v3 起随机播放由 @bilisound/player 内部管理：Android 走 Media3 原生 shuffle，
 * iOS/Web 在 player 内部模拟播放顺序。app 层不再物理打乱队列，`getTracks()` 始终返回
 * canonical 顺序；UI 通过 `usePlaybackOrder()` 展示打乱后的顺序。
 *
 * app 层负责持久化：用户偏好存 QUEUE_PLAYING_MODE，打乱后的顺序存 QUEUE_LIST_BACKUP，
 * 这样重启后看到的队列顺序与退出前一致。
 */
export async function toggleShuffleMode(): Promise<QueuePlayingMode> {
  const current = await getShuffleMode();
  const next = current === ShuffleMode.ON ? ShuffleMode.OFF : ShuffleMode.ON;
  await setShuffleMode(next);

  const mode: QueuePlayingMode = next === ShuffleMode.ON ? "shuffle" : "normal";
  setQueuePlayingMode(mode);
  // 开启时持久化刚生成的顺序，关闭时清除
  await savePlaybackOrder();
  return mode;
}
