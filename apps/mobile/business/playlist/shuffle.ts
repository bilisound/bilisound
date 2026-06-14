import { getShuffleMode, setShuffleMode, ShuffleMode } from "@bilisound/player";

import { QueuePlayingMode, setQueuePlayingMode } from "~/storage/queue";

/**
 * 切换随机播放模式。
 *
 * v3 起随机播放由 @bilisound/player 内部管理：Android 走 Media3 原生 shuffle，
 * iOS/Web 在 player 内部模拟播放顺序。app 层不再物理打乱队列，只负责持久化用户偏好，
 * 这样 getTracks() 始终返回 canonical 顺序，无需 QUEUE_LIST_BACKUP 备份还原。
 */
export async function setMode(): Promise<QueuePlayingMode> {
  const current = await getShuffleMode();
  const next = current === ShuffleMode.ON ? ShuffleMode.OFF : ShuffleMode.ON;
  await setShuffleMode(next);

  const mode: QueuePlayingMode = next === ShuffleMode.ON ? "shuffle" : "normal";
  setQueuePlayingMode(mode);
  return mode;
}
