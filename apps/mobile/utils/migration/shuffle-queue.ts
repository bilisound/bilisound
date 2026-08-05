import { clearQueuePlaybackOrder, hasLegacyQueueListBackup, queueStorage } from "~/storage/queue";
import log from "~/utils/logger";

/**
 * v3 起随机播放由 @bilisound/player 内部管理，不再物理打乱队列，因此以下旧版持久化
 * 数据已废弃：
 * - `queue_is_randomized`：旧版标记队列是否已被物理打乱
 *
 * `queue_playing_mode` 保留，作为随机播放偏好的持久化来源（启动时据此重新应用
 * setShuffleMode）。
 *
 * `queue_list_backup` 这个 key 被复用了：旧版存「打乱前的原始队列」（`TrackData[]`），
 * 现在存「随机播放顺序」（`number[]`）。所以只能删除仍是旧版形状的数据，不能无条件清除，
 * 否则每次启动都会把刚刚持久化的播放顺序一并删掉。
 *
 * 注意：旧版用户若在随机模式下退出，`queue_list`（现作为 canonical 队列恢复）实际是
 * 当时被物理打乱的顺序。新版不会还原原始顺序，而是保留用户当时所见的队列与当前曲目，
 * 以保证升级后的播放连续性（不在用户脚下重排队列）。
 */
const LEGACY_QUEUE_IS_RANDOMIZED = "queue_is_randomized";

export function cleanupLegacyShuffleKeys(): void {
  let cleaned = false;
  if (hasLegacyQueueListBackup()) {
    // 旧版的 TrackData[] 备份，对新版毫无用处，而且可能有数 MB 大小
    clearQueuePlaybackOrder();
    cleaned = true;
  }
  if (queueStorage.contains(LEGACY_QUEUE_IS_RANDOMIZED)) {
    queueStorage.remove(LEGACY_QUEUE_IS_RANDOMIZED);
    cleaned = true;
  }
  if (cleaned) {
    log.info("已清理旧版随机播放遗留的持久化数据（queue_list_backup / queue_is_randomized）");
  }
}
