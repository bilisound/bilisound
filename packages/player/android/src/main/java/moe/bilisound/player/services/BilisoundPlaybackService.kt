@file:OptIn(UnstableApi::class)

package moe.bilisound.player.services

import android.app.PendingIntent
import android.app.PendingIntent.FLAG_IMMUTABLE
import android.app.PendingIntent.FLAG_UPDATE_CURRENT
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.annotation.OptIn
import androidx.core.os.bundleOf
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.HttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import moe.bilisound.player.BilisoundPlayerModule
import moe.bilisound.player.PlaybackOrderManager
import moe.bilisound.player.ERROR_BAD_HTTP_STATUS_CODE
import moe.bilisound.player.ERROR_GENERIC
import moe.bilisound.player.ERROR_NETWORK_FAILURE
import moe.bilisound.player.EVENT_PLAYBACK_ERROR
import moe.bilisound.player.EVENT_TRACK_CHANGE
import moe.bilisound.player.TAG

class BilisoundPlaybackService : MediaSessionService() {
    companion object {
        private const val TAG = "BilisoundPlaybackService"
        private var activePlayer: ExoPlayer? = null
        private var activePlaybackOrder: PlaybackOrderManager? = null

        /**
         * A restore request that arrived before Media3 applied `shuffleModeEnabled`.
         *
         * MediaController commands propagate to the player asynchronously, so a JS restore can
         * reach the service either side of the shuffle activation that reinstalls a fresh random
         * order. Holding the request lets whichever step runs second apply it.
         */
        private var pendingPlaybackOrder: IntArray? = null

        /**
         * 正在执行 [replaceMediaItemPreservingPlaybackOrder] 时为 true。
         *
         * 替换曲目期间派发的 transition 都不代表用户切歌，只是队列操作的副作用。
         * 顺序播放时只会产生一次指向新条目的 `PLAYLIST_CHANGED`；随机播放时，旧条目被移除后
         * 播放器会按随机顺序临时选中另一首，`seekTo` 再切回来，于是还会多出 mediaId 不同的
         * `PLAYLIST_CHANGED` 和一次 `SEEK`。这些 transition 都在替换调用内同步派发，所以按
         * 「是否处在替换调用内」判断，而不是按 mediaId 匹配单次标记；替换调用之外的真实切歌不受影响。
         */
        private var replacingMediaItem = false

        val isReplacingMediaItem: Boolean
            get() = replacingMediaItem

        fun replaceMediaItemPreservingPlaybackOrder(index: Int, mediaItem: MediaItem): Boolean {
            val player = checkNotNull(activePlayer) { "Playback service is not ready" }
            require(index in 0 until player.mediaItemCount) { "Invalid media item index: $index" }

            val playbackOrder = checkNotNull(activePlaybackOrder) { "Playback order is not ready" }
            val replacingCurrentItem = index == player.currentMediaItemIndex
            val currentPosition = player.currentPosition.coerceAtLeast(0)

            replacingMediaItem = true
            try {
                player.replaceMediaItem(index, mediaItem)
                player.setShuffleOrder(playbackOrder)
                activePlaybackOrder = playbackOrder
                if (replacingCurrentItem) {
                    player.seekTo(index, currentPosition)
                }
            } finally {
                replacingMediaItem = false
            }
            return replacingCurrentItem
        }

        fun setMediaItems(
            mediaItems: List<MediaItem>,
            startIndex: Int,
            startPositionMs: Long,
            playWhenReady: Boolean,
        ) {
            val player = checkNotNull(activePlayer) { "Playback service is not ready" }
            player.pause()
            // Replacing the queue invalidates any deferred restore for the previous queue.
            pendingPlaybackOrder = null
            if (mediaItems.isEmpty()) {
                player.clearMediaItems()
                installPlaybackOrder(player, 0, C.INDEX_UNSET)
                return
            }

            player.setMediaItems(mediaItems, startIndex, startPositionMs)
            installPlaybackOrder(player, mediaItems.size, startIndex)
            if (playWhenReady) {
                player.play()
            }
        }

        /**
         * Canonical indices in playback order.
         *
         * The ShuffleOrder instance outlives shuffle mode, so canonical order must be reported
         * whenever shuffle is disabled rather than reading the retained shuffled order.
         */
        fun getPlaybackOrder(): IntArray {
            val player = checkNotNull(activePlayer) { "Playback service is not ready" }
            val playbackOrder = activePlaybackOrder
            if (!player.shuffleModeEnabled || playbackOrder == null) {
                return IntArray(player.mediaItemCount) { it }
            }
            return playbackOrder.playbackOrderIndices()
        }

        /**
         * Restores a previously captured playback order. Returns false when shuffle is disabled or
         * [order] is not a permutation of the current canonical indices.
         */
        fun setPlaybackOrder(order: IntArray): Boolean {
            val player = checkNotNull(activePlayer) { "Playback service is not ready" }
            val playbackOrder = activePlaybackOrder
            if (playbackOrder == null || order.size != player.mediaItemCount) {
                return false
            }
            if (!player.shuffleModeEnabled) {
                // Shuffle activation has not reached the player yet; apply on arrival instead.
                pendingPlaybackOrder = order.copyOf()
                return true
            }

            val restored = playbackOrder.withPlaybackOrder(order) ?: return false
            pendingPlaybackOrder = null
            activePlaybackOrder = restored
            player.setShuffleOrder(restored)
            return true
        }

        private fun installPlaybackOrder(player: ExoPlayer, size: Int, startIndex: Int) {
            val playbackOrder = PlaybackOrderManager(
                size = size,
                startIndex = startIndex,
                onOrderChanged = { updatedOrder ->
                    activePlaybackOrder = updatedOrder
                },
            )
            activePlaybackOrder = playbackOrder
            player.setShuffleOrder(playbackOrder)
        }

        /**
         * Applies a restore request that arrived before shuffle mode was active, overwriting the
         * freshly randomized order that shuffle activation just installed.
         */
        private fun consumePendingPlaybackOrder(player: ExoPlayer) {
            val pending = pendingPlaybackOrder ?: return
            pendingPlaybackOrder = null
            val playbackOrder = activePlaybackOrder ?: return
            val restored = playbackOrder.withPlaybackOrder(pending) ?: return
            activePlaybackOrder = restored
            player.setShuffleOrder(restored)
        }

        /** Drops a deferred restore, e.g. when shuffle is turned off before it could be applied. */
        private fun clearPendingPlaybackOrder() {
            pendingPlaybackOrder = null
        }
    }

    private var mediaSession: MediaSession? = null
    private var player: ExoPlayer? = null

    // Create your Player and MediaSession in the onCreate lifecycle event
    @OptIn(UnstableApi::class) override fun onCreate() {
        super.onCreate()

        // 创建自定义的 DataSource.Factory 并整合缓存功能
        val dataSourceFactory = CacheDataSource.Factory()
            .setCache(BilisoundPlayerModule.getDownloadCache(applicationContext)) // 确保 downloadCache 已正确初始化
            .setUpstreamDataSourceFactory {
                BilisoundPlayerModule.getDataSourceFactory(this)
                    .createDataSource()
            }
            .setCacheWriteDataSinkFactory(null) // 禁用写入

        // 使用整合后的 DataSource.Factory 创建 MediaSourceFactory
        val mediaSourceFactory = DefaultMediaSourceFactory(dataSourceFactory)

        // 使用自定义的 MediaSourceFactory 创建 ExoPlayer
        val exoPlayer = ExoPlayer.Builder(this)
            .setMediaSourceFactory(mediaSourceFactory)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                    .build(),
                /* handleAudioFocus= */ true,
            )
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_NETWORK)
            .build()
        installPlaybackOrder(exoPlayer, 0, C.INDEX_UNSET)
        activePlayer = exoPlayer
        player = exoPlayer

        // 设置 sessionActivity
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        intent?.putExtra("DESTINATION", "player")
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, FLAG_IMMUTABLE or FLAG_UPDATE_CURRENT)


        mediaSession = MediaSession
            .Builder(this, exoPlayer)
            .setId("moe.bilisound.player")
            .setCallback(PlaybackCallback())
            .setSessionActivity(pendingIntent)
            .build()

        exoPlayer.clearMediaItems()
        exoPlayer.prepare()
        exoPlayer.addListener(playerListener)

    }

    /**
     * 幂等释放本服务持有的 player 与 session。
     *
     * 服务销毁、以及「未播放时任务被移除」都会走到这里。静态引用只在仍指向本次释放的
     * player 时清空，避免误清下一个服务实例已经设置好的状态。
     */
    private fun releaseAll() {
        val releasingPlayer = player
        val releasingSession = mediaSession
        player = null
        mediaSession = null

        releasingPlayer?.let {
            it.removeListener(playerListener)
            it.stop()
            it.clearMediaItems()
            it.release()
        }
        releasingSession?.release()

        if (activePlayer === releasingPlayer) {
            activePlayer = null
            activePlaybackOrder = null
            pendingPlaybackOrder = null
        }
    }

    // Remember to release the player and media session in onDestroy
    override fun onDestroy() {
        releaseAll()
        super.onDestroy()
    }

    // This example always accepts the connection request
    override fun onGetSession(
        controllerInfo: MediaSession.ControllerInfo
    ): MediaSession? = mediaSession

    fun emitJSEvent(bundle: Bundle) {
        val service = Intent(applicationContext, BilisoundTaskService::class.java)
        service.putExtras(bundle)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                applicationContext.startForegroundService(service)
            } else {
                applicationContext.startService(service)
            }
        } catch (e: IllegalStateException) {
            // ForegroundServiceStartNotAllowedException 是 IllegalStateException 的子类。
            // 没有前台启动许可时丢弃这次事件，而不是让播放进程崩溃。
            Log.w(TAG, "无法启动播放事件服务，丢弃本次事件", e)
        }
    }

    private val playerListener = object : Player.Listener {
        override fun onPlayerError(error: PlaybackException) {
            val cause = error.cause
            if (cause is HttpDataSource.HttpDataSourceException) {
                // An HTTP error occurred.
                val httpError = cause
                // It's possible to find out more about the error both by casting and by querying
                // the cause.
                if (httpError is HttpDataSource.InvalidResponseCodeException) {
                    // Cast to InvalidResponseCodeException and retrieve the response code, message
                    // and headers.
                    emitJSEvent(
                        bundleOf(
                            "event" to EVENT_PLAYBACK_ERROR,
                            "data" to bundleOf(
                                "type" to ERROR_BAD_HTTP_STATUS_CODE,
                                "message" to httpError.message,
                                "code" to httpError.responseCode
                            )
                        )
                    )
                } else {
                    // Try calling httpError.getCause() to retrieve the underlying cause, although
                    // note that it may be null.
                    emitJSEvent(
                        bundleOf(
                            "event" to EVENT_PLAYBACK_ERROR,
                            "data" to bundleOf(
                                "type" to ERROR_NETWORK_FAILURE,
                                "message" to httpError.message,
                            )
                        )
                    )
                }
            } else {
                emitJSEvent(
                    bundleOf(
                        "event" to EVENT_PLAYBACK_ERROR,
                        "data" to bundleOf(
                            "type" to ERROR_GENERIC,
                            "message" to cause?.message,
                        )
                    )
                )
            }
        }

        override fun onShuffleModeEnabledChanged(shuffleModeEnabled: Boolean) {
            val player = player ?: return
            if (!shuffleModeEnabled) {
                // Leaving shuffle discards any deferred restore for the abandoned order.
                clearPendingPlaybackOrder()
                return
            }
            installPlaybackOrder(
                player = player,
                size = player.mediaItemCount,
                startIndex = player.currentMediaItemIndex,
            )
            // A restore issued before this activation must win over the fresh random order.
            consumePendingPlaybackOrder(player)
        }


        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
            if (isReplacingMediaItem) {
                Log.d(TAG, "onMediaItemTransition: 忽略替换曲目产生的 transition（reason=$reason, mediaId=${mediaItem?.mediaId}）")
                return
            }
            if (mediaItem == null) {
                emitJSEvent(
                    bundleOf(
                        "event" to EVENT_TRACK_CHANGE,
                        "data" to bundleOf(
                            "track" to null
                        )
                    )
                )
                return
            }
            emitJSEvent(
                bundleOf(
                    "event" to EVENT_TRACK_CHANGE,
                    "data" to null
                )
            )
        }
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // 当应用被从「最近任务」中移除时调用。
        // 未播放时释放 session 与服务，避免残留一条失活的媒体通知，详见
        // https://github.com/androidx/media/issues/1557 。
        // Controller 会在下一次命令时按需重连（见 BilisoundPlayerModule.withController）。
        if (player?.isPlaying != true) {
            releaseAll()
            stopSelf()
        }
        super.onTaskRemoved(rootIntent)
    }
}

private class PlaybackCallback : MediaSession.Callback {
    override fun onPlaybackResumption(
        mediaSession: MediaSession,
        controller: MediaSession.ControllerInfo
    ): ListenableFuture<MediaSession.MediaItemsWithStartPosition> {
        Log.d(TAG, "onPlaybackResumption: 用户试图唤醒播放器。mediaSession: $mediaSession, controller: $controller")
        // 创建一个立即完成的 Future，返回空的媒体项目列表和起始位置 0
        return Futures.immediateFuture(
            MediaSession.MediaItemsWithStartPosition(
                /* mediaItems = */ emptyList(),
                /* startIndex = */ 0,
                /* startPositionMs = */ 0L
            )
        )
    }
}
