import { queueStorage } from "~/storage/queue";
import log from "~/utils/logger";

/**
 * v3 起随机播放由 @bilisound/player 内部管理，不再物理打乱队列，因此以下旧版持久化
 * 数据已废弃：
 * - `queue_list_backup`：旧版用于退出随机模式时还原原始顺序
 * - `queue_is_randomized`：旧版标记队列是否已被物理打乱
 *
 * 这里做一次性清理。`queue_playing_mode` 保留，作为随机播放偏好的持久化来源
 * （启动时据此重新应用 setShuffleMode）。
 *
 * 注意：旧版用户若在随机模式下退出，`queue_list`（现作为 canonical 队列恢复）实际是
 * 当时被物理打乱的顺序。新版不会还原原始顺序，而是保留用户当时所见的队列与当前曲目，
 * 以保证升级后的播放连续性（不在用户脚下重排队列）。
 */
const LEGACY_QUEUE_LIST_BACKUP = "queue_list_backup";
const LEGACY_QUEUE_IS_RANDOMIZED = "queue_is_randomized";

export function cleanupLegacyShuffleKeys(): void {
  let cleaned = false;
  if (queueStorage.contains(LEGACY_QUEUE_LIST_BACKUP)) {
    queueStorage.remove(LEGACY_QUEUE_LIST_BACKUP);
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
