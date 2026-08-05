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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.serialization.json.Json
import moe.bilisound.player.BilisoundPlayerModule
import moe.bilisound.player.PlaybackOrderManager
import moe.bilisound.player.ERROR_BAD_HTTP_STATUS_CODE
import moe.bilisound.player.ERROR_GENERIC
import moe.bilisound.player.ERROR_NETWORK_FAILURE
import moe.bilisound.player.EVENT_IS_PLAYING_CHANGE
import moe.bilisound.player.EVENT_PLAYBACK_ERROR
import moe.bilisound.player.EVENT_PLAYBACK_STATE_CHANGE
import moe.bilisound.player.EVENT_PLAYING_PROGRESS_CHANGE
import moe.bilisound.player.EVENT_TRACK_CHANGE
import moe.bilisound.player.STATE_BUFFERING
import moe.bilisound.player.STATE_ENDED
import moe.bilisound.player.STATE_IDLE
import moe.bilisound.player.STATE_READY
import moe.bilisound.player.TAG
import moe.bilisound.player.mediaItemToBundle

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

        fun replaceMediaItemPreservingPlaybackOrder(index: Int, mediaItem: MediaItem): Boolean {
            val player = checkNotNull(activePlayer) { "Playback service is not ready" }
            require(index in 0 until player.mediaItemCount) { "Invalid media item index: $index" }

            val playbackOrder = checkNotNull(activePlaybackOrder) { "Playback order is not ready" }
            val replacingCurrentItem = index == player.currentMediaItemIndex
            val currentPosition = player.currentPosition.coerceAtLeast(0)
            if (replacingCurrentItem) {
                BilisoundPlayerModule.beginCurrentItemReplacementTransitionSuppression()
            }

            player.replaceMediaItem(index, mediaItem)
            player.setShuffleOrder(playbackOrder)
            activePlaybackOrder = playbackOrder
            if (replacingCurrentItem) {
                player.seekTo(index, currentPosition)
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
    private var progressUpdateJob: Job? = null
    private val coroutineScope = CoroutineScope(Dispatchers.Main + Job())

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
        val player = ExoPlayer.Builder(this)
            .setMediaSourceFactory(mediaSourceFactory)
            .build()
        installPlaybackOrder(player, 0, C.INDEX_UNSET)
        activePlayer = player

        // 设置 sessionActivity
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        intent?.putExtra("DESTINATION", "player")
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, FLAG_IMMUTABLE or FLAG_UPDATE_CURRENT)


        mediaSession = MediaSession
            .Builder(this, player)
            .setId("moe.bilisound.player")
            .setCallback(PlaybackCallback())
            .setSessionActivity(pendingIntent)
            .build()

        player.clearMediaItems()
        player.prepare()
        startProgressUpdates()
        player.addListener(playerListener)

    }

    // Remember to release the player and media session in onDestroy
    override fun onDestroy() {
        progressUpdateJob?.cancel()
        coroutineScope.cancel()
        mediaSession?.run {
            player.stop()
            player.clearMediaItems()
            player.removeListener(playerListener)
            player.release()
            release()
        }
        mediaSession = null
        activePlayer = null
        activePlaybackOrder = null
        super.onDestroy()
    }

    // This example always accepts the connection request
    override fun onGetSession(
        controllerInfo: MediaSession.ControllerInfo
    ): MediaSession? = mediaSession

    fun emitJSEvent(bundle: Bundle) {
        val service = Intent(applicationContext, BilisoundTaskService::class.java)
        service.putExtras(bundle)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            applicationContext.startForegroundService(service)
        } else {
            applicationContext.startService(service)
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

        override fun onPlaybackStateChanged(playbackState: Int) {
            var type = STATE_IDLE
            if (playbackState == Player.STATE_IDLE) {
                type = STATE_IDLE
            }
            if (playbackState == Player.STATE_BUFFERING) {
                type = STATE_BUFFERING
            }
            if (playbackState == Player.STATE_READY) {
                type = STATE_READY
            }
            if (playbackState == Player.STATE_ENDED) {
                type = STATE_ENDED
            }

            emitJSEvent(
                bundleOf(
                    "event" to EVENT_PLAYBACK_STATE_CHANGE,
                    "data" to bundleOf(
                        "type" to type
                    )
                )
            )
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
            emitJSEvent(
                bundleOf(
                    "event" to EVENT_IS_PLAYING_CHANGE,
                    "data" to bundleOf(
                        "isPlaying" to isPlaying
                    )
                )
            )
        }
        override fun onShuffleModeEnabledChanged(shuffleModeEnabled: Boolean) {
            val player = mediaSession?.player as? ExoPlayer ?: return
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
            if (BilisoundPlayerModule.isSuppressingCurrentItemReplacementTransition()) {
                Log.d(TAG, "onMediaItemTransition: suppress current item replacement transition")
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
            Log.d(TAG, "onMediaItemTransition: 正在运行 setHeadersOnBank: ${mediaItem.mediaId}")
            BilisoundPlayerModule.setHeadersOnBank(
                mediaItem.mediaId,
                Json.decodeFromString(mediaItem.mediaMetadata.extras?.getString("headers") ?: "{}")
            )
            emitJSEvent(
                bundleOf(
                    "event" to EVENT_TRACK_CHANGE,
                    "data" to null
                )
            )
        }
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // 当应用被从「最近任务」中移除时调用
        // 目前还不能移除用户打开 app 后加载播放列表，不开始播放并直接在「最近任务」中划掉应用，
        // 最终导致失活的媒体通知，详见 https://github.com/androidx/media/issues/1557
        mediaSession?.run {
            if (!player.isPlaying) {
                mediaSession!!.release()
                mediaSession = null
                stopSelf()
            }
        }
        super.onTaskRemoved(rootIntent)
    }

    private fun startProgressUpdates() {
        progressUpdateJob?.cancel()
        progressUpdateJob = coroutineScope.launch {
            while (isActive) {
                if (mediaSession?.player?.isPlaying == true) {
                    emitJSEvent(
                        bundleOf(
                            "event" to EVENT_PLAYING_PROGRESS_CHANGE,
                            "data" to bundleOf(
                                "duration" to (mediaSession?.player?.duration?.div(1000) ?: 0),
                                "position" to (mediaSession?.player?.currentPosition?.div(1000) ?: 0),
                                "buffered" to (mediaSession?.player?.bufferedPosition?.div(1000) ?: 0)
                            )
                        )
                    )
                }
                delay(10000) // 延迟 10 秒
            }
        }
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
