package moe.bilisound.player

const val BACKGROUND_PLAYBACK_TASK = "background_playback_task"

// ============================================================================
// 事件
// ============================================================================

/**
 * 播放状态变更
 */
const val EVENT_PLAYBACK_STATE_CHANGE = "onPlaybackStateChange"

/**
 * 播放错误
 */
const val EVENT_PLAYBACK_ERROR = "onPlaybackError"

/**
 * 播放队列变更
 */
const val EVENT_QUEUE_CHANGE = "onQueueChange"

/**
 * 播放曲目变更
 */
const val EVENT_TRACK_CHANGE = "onTrackChange"

/**
 * 是否播放变更
 */
const val EVENT_IS_PLAYING_CHANGE = "onIsPlayingChange"

/**
 * 播放进度变更
 */
const val EVENT_PLAYING_PROGRESS_CHANGE = "onPlayingProgressChange"

/**
 * 下载状态更新
 */
const val EVENT_DOWNLOAD_UPDATE = "onDownloadUpdate"

/**
 * 播放状态恢复（未使用）
 */
const val EVENT_PLAYBACK_RESUME = "onPlaybackResume"

/**
 * 循环状态变更
 */
const val EVENT_LOOP_MODE_CHANGE = "onRepeatModeChange"

// ============================================================================
// 播放状态
// ============================================================================

const val STATE_IDLE = "STATE_IDLE"
const val STATE_BUFFERING = "STATE_BUFFERING"
const val STATE_READY = "STATE_READY"
const val STATE_ENDED = "STATE_ENDED"

// ============================================================================
// 下载状态
// ============================================================================

const val DOWNLOAD_CHANGE = "DOWNLOAD_CHANGE"
const val DOWNLOAD_REMOVE = "DOWNLOAD_REMOVE"
const val DOWNLOAD_GLOBAL_STATE_CHANGE = "DOWNLOAD_GLOBAL_STATE_CHANGE"

// ============================================================================
// 错误信息
// ============================================================================

/**
 * 网络请求失败
 */
const val ERROR_NETWORK_FAILURE = "ERROR_NETWORK_FAILURE"

/**
 * HTTP 状态码异常
 */
const val ERROR_BAD_HTTP_STATUS_CODE = "ERROR_BAD_HTTP_STATUS_CODE"

/**
 * 其它错误
 */
const val ERROR_GENERIC = "ERROR_GENERIC"
