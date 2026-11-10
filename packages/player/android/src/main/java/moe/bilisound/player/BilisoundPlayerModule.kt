@file:UnstableApi package moe.bilisound.player

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.annotation.OptIn
import androidx.core.content.ContextCompat
import androidx.core.os.bundleOf
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import androidx.media3.database.DatabaseProvider
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.HttpDataSource
import androidx.media3.datasource.ResolvingDataSource
import androidx.media3.datasource.cache.NoOpCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.exoplayer.offline.Download
import androidx.media3.exoplayer.offline.DownloadManager
import androidx.media3.exoplayer.offline.DownloadNotificationHelper
import androidx.media3.exoplayer.offline.DownloadRequest
import androidx.media3.exoplayer.offline.DownloadService
import androidx.media3.exoplayer.scheduler.Requirements
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.ReactContext
import com.google.common.util.concurrent.ListenableFuture
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Enumerable
import kotlinx.serialization.json.Json
import moe.bilisound.player.services.BilisoundDownloadService
import moe.bilisound.player.services.BilisoundPlaybackService
import org.jetbrains.annotations.Async
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.util.concurrent.Executor
import kotlin.math.roundToLong


const val TAG = "BilisoundPlayerModule"

class BilisoundPlayerModule : Module() {
    companion object {
        // 下载管理器相关
        private var downloadNotificationHelper: DownloadNotificationHelper? = null
        private var databaseProvider: DatabaseProvider? = null
        private var downloadCache: SimpleCache? = null
        private var dataSourceFactory: ResolvingDataSource.Factory? = null
        private var downloadManager: DownloadManager? = null

        @Synchronized
        fun getDownloadCache(context: Context): SimpleCache {
            Log.d(TAG, "缓存初始化！orig: $downloadCache, context: $context")
            return downloadCache ?: SimpleCache(
                File(context.filesDir, "bilisound_cache"),
                NoOpCacheEvictor(),
                getDatabaseProvider(context)
            ).also {
                downloadCache = it
            }
        }

        @Synchronized
        fun getDatabaseProvider(context: Context): DatabaseProvider {
            Log.d(TAG, "数据库初始化！orig: $databaseProvider, context: $context")
            if (databaseProvider == null) {
                databaseProvider = StandaloneDatabaseProvider(context)
            }
            return databaseProvider!!
        }

        @Synchronized
        fun getDownloadNotificationHelper(
            context: Context?
        ): DownloadNotificationHelper {
            Log.d(TAG, "下载提示初始化！orig: $downloadNotificationHelper, context: $context")
            if (downloadNotificationHelper == null) {
                downloadNotificationHelper =
                    DownloadNotificationHelper(context!!, BilisoundDownloadService.DOWNLOAD_NOTIFICATION_CHANNEL_ID)
            }
            return downloadNotificationHelper!!
        }

        @Synchronized
        fun getDataSourceFactory(context: Context): ResolvingDataSource.Factory {
            if (dataSourceFactory == null) {
                val defaultDataSourceFactory = DefaultDataSource.Factory(context)
                dataSourceFactory = ResolvingDataSource.Factory(defaultDataSourceFactory) { dataSpec: DataSpec ->
                    val got = getHeadersOnBank(dataSpec.key ?: "")
                    if (got != null) {
                        Log.d(TAG, "getDataSourceFactory: 已经进行 header 消费操作。key: ${dataSpec.key}, got: $got")
                        return@Factory dataSpec.withAdditionalHeaders(got)
                    }
                    return@Factory dataSpec
                }
            }
            return dataSourceFactory!!
        }

        @Synchronized
        fun getDownloadManager(context: Context): DownloadManager {
            if (downloadManager != null) {
                return downloadManager!!
            }
            val databaseProvider = getDatabaseProvider(context)
            val downloadCache = getDownloadCache(context)
            val dataSourceFactory = getDataSourceFactory(context)
            val downloadExecutor = Executor(Runnable::run)

            // Create the download manager.
            val newlyDownloadManager =
                DownloadManager(context, databaseProvider, downloadCache, dataSourceFactory, downloadExecutor)
            newlyDownloadManager.maxParallelDownloads = 1
            downloadManager = newlyDownloadManager
            restoreHeadersFromDownloads(newlyDownloadManager)

            Log.d(TAG, "下载管理器初始化！")
            return downloadManager!!
        }

        /**
         * 进程重启后 header bank 是空的。下载请求里保存了完整的 header，遍历一次补回去，
         * 否则恢复下载时会丢掉 Referer / User-Agent。
         */
        private fun restoreHeadersFromDownloads(downloadManager: DownloadManager) {
            val cursor = try {
                downloadManager.downloadIndex.getDownloads()
            } catch (e: Exception) {
                Log.w(TAG, "读取下载索引失败", e)
                return
            }
            try {
                while (cursor.moveToNext()) {
                    val request = cursor.download.request
                    if (request.data.isEmpty()) {
                        continue
                    }
                    try {
                        val data = Json.decodeFromString<DownloadData>(request.data.toString(Charsets.UTF_8))
                        setHeadersOnBank(request.id, data.headers)
                    } catch (e: Exception) {
                        Log.w(TAG, "无法恢复下载 ${request.id} 的 header", e)
                    }
                }
            } finally {
                cursor.close()
            }
        }

        // 下载项目的 headers
        private var headersBank: Map<String, Map<String, String>> = mapOf()

        @Synchronized
        fun getHeadersOnBank(key: String): Map<String, String>? {
            return headersBank[key]
        }

        @Synchronized
        fun setHeadersOnBank(key: String, headers: Map<String, String>) {
            headersBank = headersBank + (key to headers)
        }

        @Synchronized
        fun deleteHeadersOnBank(key: String) {
            headersBank = headersBank - key
        }

        @Synchronized
        fun clearHeadersOnBank() {
            headersBank = mapOf()
        }

    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var controller: MediaController? = null
    private var observing = false
    private val pendingControllerActions = mutableListOf<PendingControllerAction>()
    private var pendingSaveFilePromise: Promise? = null
    private var pendingSaveFilePath: String? = null

    private class PendingControllerAction(
        val promise: Promise,
        val errorCode: String,
        val errorMessage: String,
        val block: (MediaController) -> Unit,
    )

    /**
     * 在主线程上用可用的 MediaController 执行 [block]。
     *
     * 服务可能已经被销毁（例如未播放时从最近任务划掉 App），此时按需重建 Controller，
     * 把 [block] 排队，连接成功后再依次执行；连接失败时统一 reject 队列中的 promise。
     * 绝不阻塞主线程等待连接，避免与同在主线程的连接回调互相等待导致 ANR。
     */
    private fun withController(
        promise: Promise,
        errorCode: String,
        errorMessage: String,
        block: (MediaController) -> Unit,
    ) {
        mainHandler.post {
            val current = controller
            if (current != null && current.isConnected) {
                runControllerAction(current, promise, errorCode, errorMessage, block)
            } else {
                pendingControllerActions.add(PendingControllerAction(promise, errorCode, errorMessage, block))
                connectController()
            }
        }
    }

    private fun connectController() {
        if (controllerFuture != null) {
            return
        }
        val reactContext = appContext.reactContext
        if (reactContext == null) {
            rejectPendingControllerActions("无法连接播放器服务", Exceptions.ReactContextLost())
            return
        }
        val sessionToken =
            SessionToken(reactContext, ComponentName(reactContext, BilisoundPlaybackService::class.java))
        val future = MediaController.Builder(reactContext, sessionToken)
            .setListener(controllerConnectionListener)
            .buildAsync()
        controllerFuture = future
        future.addListener({
            mainHandler.post {
                if (controllerFuture !== future) {
                    // 已被释放或替换；迟到的连接结果由对应的清理路径回收。
                    return@post
                }
                val connected = try {
                    future.get()
                } catch (e: Exception) {
                    controllerFuture = null
                    rejectPendingControllerActions("无法连接播放器服务", e)
                    return@post
                }
                controller = connected
                if (observing) {
                    connected.addListener(playerListener)
                }
                drainPendingControllerActions(connected)
            }
        }, ContextCompat.getMainExecutor(reactContext))
    }

    private fun drainPendingControllerActions(controller: MediaController) {
        if (pendingControllerActions.isEmpty()) {
            return
        }
        val actions = pendingControllerActions.toList()
        pendingControllerActions.clear()
        actions.forEach { runControllerAction(controller, it.promise, it.errorCode, it.errorMessage, it.block) }
    }

    private fun rejectPendingControllerActions(errorMessage: String, cause: Exception) {
        if (pendingControllerActions.isEmpty()) {
            return
        }
        val actions = pendingControllerActions.toList()
        pendingControllerActions.clear()
        actions.forEach { it.promise.reject(it.errorCode, "$errorMessage (${cause.message})", cause) }
    }

    private fun runControllerAction(
        controller: MediaController,
        promise: Promise,
        errorCode: String,
        errorMessage: String,
        block: (MediaController) -> Unit,
    ) {
        try {
            block(controller)
        } catch (e: Exception) {
            Log.w(TAG, "$errorMessage：${e.message}", e)
            promise.reject(errorCode, "$errorMessage (${e.message})", e)
        }
    }

    private val controllerConnectionListener = object : MediaController.Listener {
        override fun onDisconnected(controller: MediaController) {
            mainHandler.post {
                if (this@BilisoundPlayerModule.controller !== controller) {
                    return@post
                }
                try {
                    controller.removeListener(playerListener)
                } catch (e: Exception) {
                    Log.w(TAG, "移除已断连 Controller 的监听器失败", e)
                }
                this@BilisoundPlayerModule.controller = null
                controllerFuture = null
                // 不在这里主动重连：任务被划掉后立刻重连会再次拉起服务，
                // 可能重新产生 androidx/media#1557 那种残留通知。只有已经排队的命令才立即重连。
                if (pendingControllerActions.isNotEmpty()) {
                    connectController()
                }
            }
        }
    }

    private fun replaceQueue(
        controller: MediaController,
        jsonContent: String,
        beginIndex: Int,
        position: Double,
        preservePlaybackState: Boolean,
    ) {
        val jsonArray = JSONArray(jsonContent)
        val mediaItems = mutableListOf<MediaItem>()
        for (index in 0 until jsonArray.length()) {
            val trackJson = jsonArray.getString(index)
            Log.d(TAG, "接收内容：$trackJson")
            mediaItems.add(createMediaItemFromTrack(trackJson))
        }

        require(if (mediaItems.isEmpty()) beginIndex == 0 else beginIndex in mediaItems.indices) {
            "无效的起始索引: $beginIndex"
        }
        require(position.isFinite() && position >= 0 && position <= Long.MAX_VALUE / 1000.0) {
            "无效的播放进度: $position"
        }

        // 队列整批替换时就把 header 写进 bank，避免进程重启或预先加载时缺 Referer/UA。
        mediaItems.forEach { rememberMediaItemHeaders(it) }

        val shouldResume = preservePlaybackState && controller.playWhenReady
        BilisoundPlaybackService.setMediaItems(
            mediaItems = mediaItems,
            startIndex = beginIndex,
            startPositionMs = (position * 1000).roundToLong(),
            playWhenReady = shouldResume,
        )
        firePlaylistChangeEvent()
    }




    @OptIn(UnstableApi::class)
    override fun definition() = ModuleDefinition {
        Name("BilisoundPlayer")

        Events(
            EVENT_PLAYBACK_STATE_CHANGE,
            EVENT_PLAYBACK_ERROR,
            EVENT_QUEUE_CHANGE,
            EVENT_TRACK_CHANGE,
            EVENT_IS_PLAYING_CHANGE,
            EVENT_SHOULD_SHOW_PLAY_BUTTON_CHANGE,
            EVENT_DOWNLOAD_UPDATE,
            EVENT_LOOP_MODE_CHANGE,
            EVENT_SHUFFLE_MODE_CHANGE,
        )

        OnCreate {
            Log.d(TAG, "definition: 执行主程序初始化操作！")
            mainHandler.post { connectController() }
        }

        OnDestroy {
            Log.d(TAG, "definition: 执行主程序销毁操作！")
            mainHandler.post {
                val future = controllerFuture
                val current = controller
                controllerFuture = null
                controller = null
                observing = false
                try {
                    current?.removeListener(playerListener)
                } catch (e: Exception) {
                    Log.w(TAG, "移除 Controller 监听器失败", e)
                }
                try {
                    if (future != null) {
                        // 兼容「已连接」和「仍在连接」两种状态；失败也不能影响模块销毁。
                        MediaController.releaseFuture(future)
                    } else {
                        current?.release()
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "释放 Controller 失败", e)
                }
                try {
                    appContext.reactContext?.let {
                        getDownloadManager(it.applicationContext).removeListener(downloadListener)
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "移除下载监听器失败", e)
                }
            }
        }

        OnStartObserving {
            Log.d(TAG, "definition: 执行监听器初始化操作！")
            mainHandler.post {
                observing = true
                try {
                    controller?.addListener(playerListener)
                    appContext.reactContext?.let {
                        getDownloadManager(it.applicationContext).addListener(downloadListener)
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "注册监听器失败", e)
                }
            }
        }

        OnStopObserving {
            Log.d(TAG, "definition: 执行监听器停止操作！")
            mainHandler.post {
                observing = false
                try {
                    controller?.removeListener(playerListener)
                } catch (e: Exception) {
                    Log.w(TAG, "移除播放器监听器失败", e)
                }
            }
        }

        OnActivityResult { _, (requestCode, resultCode, data) ->
            if (requestCode == 43) {
                val promise = pendingSaveFilePromise
                val sourcePath = pendingSaveFilePath

                // Clear the pending promise and path
                pendingSaveFilePromise = null
                pendingSaveFilePath = null

                if (promise == null || sourcePath == null) {
                    return@OnActivityResult
                }

                if (resultCode != Activity.RESULT_OK || data?.data == null) {
                    promise.reject("SAVE_FILE_ERROR", "用户取消了保存操作或发生错误", null)
                    return@OnActivityResult
                }

                try {
                    val sourceFile = File(sourcePath)
                    val uri = data.data!!

                    context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                        FileInputStream(sourceFile).use { inputStream ->
                            inputStream.copyTo(outputStream)
                        }
                    } ?: throw FileNotFoundException("无法打开输出流")

                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("SAVE_FILE_ERROR", "保存文件时发生错误 (${e.message})", e)
                }
            }
        }

        AsyncFunction("play") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法执行播放操作") { controller ->
                controller.play()
                promise.resolve(null)
            }
        }

        AsyncFunction("pause") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法执行暂停操作") { controller ->
                controller.pause()
                promise.resolve(null)
            }
        }

        AsyncFunction("prev") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法跳转到上一首曲目") { controller ->
                controller.seekToPrevious()
                promise.resolve(null)
            }
        }

        AsyncFunction("next") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法跳转到下一首曲目") { controller ->
                controller.seekToNext()
                promise.resolve(null)
            }
        }

        AsyncFunction("toggle") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法切换播放暂停状态") { controller ->
                // playWhenReady 才是「播放意图」；缓冲或音频焦点被抑制时 isPlaying 为 false，
                // 用 isPlaying 判断会导致缓冲中无法暂停。
                Util.handlePlayPauseButtonAction(controller)
                promise.resolve()
            }
        }

        AsyncFunction("seek") { to: Long, promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法调整播放进度") { controller ->
                controller.seekTo(to * 1000)
                promise.resolve()
            }
        }

        AsyncFunction("jump") { to: Int, promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法调整当前播放曲目") { controller ->
                controller.seekTo(to, 0)
                promise.resolve()
            }
        }

        AsyncFunction("getIsPlaying") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法获取播放状态") { controller ->
                promise.resolve(controller.isPlaying)
            }
        }

        AsyncFunction("getShouldShowPlayButton") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法获取播放按钮状态") { controller ->
                promise.resolve(Util.shouldShowPlayButton(controller))
            }
        }

        AsyncFunction("prepare") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法准备播放") { controller ->
                controller.prepare()
                promise.resolve(null)
            }
        }

        AsyncFunction("getCurrentTrack") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法获取播放状态") { controller ->
                val mediaItem = controller.currentMediaItem
                promise.resolve(mediaItem?.let { mediaItemToBundle(it) })
            }
        }

        AsyncFunction("getCurrentTrackIndex") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法获取播放状态") { controller ->
                promise.resolve(controller.currentMediaItemIndex)
            }
        }

        AsyncFunction("getNextTrackIndex") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法获取下一首曲目索引") { controller ->
                promise.resolve(controller.nextMediaItemIndex)
            }
        }

        AsyncFunction("getPlaybackState") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法获取播放状态") { controller ->
                promise.resolve(
                    when (controller.playbackState) {
                        Player.STATE_IDLE -> STATE_IDLE
                        Player.STATE_BUFFERING -> STATE_BUFFERING
                        Player.STATE_READY -> STATE_READY
                        Player.STATE_ENDED -> STATE_ENDED
                        else -> STATE_IDLE
                    }
                )
            }
        }

        AsyncFunction("getProgress") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法获取播放进度") { controller ->
                promise.resolve(bundleOf(
                    // 总时长（毫秒转秒）
                    "duration" to controller.duration.coerceAtLeast(0) / 1000.0,
                    // 当前播放进度（毫秒转秒）
                    "position" to controller.currentPosition.coerceAtLeast(0) / 1000.0,
                    // 已缓冲进度（毫秒转秒）
                    "buffered" to controller.bufferedPosition.coerceAtLeast(0) / 1000.0
                ))
            }
        }

        AsyncFunction("setSpeed") { speed: Float, retainPitch: Boolean, promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法调整播放速度") { controller ->
                Log.d(TAG, "用户尝试调整播放速度。speed: $speed, retainPitch: $retainPitch")
                controller.playbackParameters = PlaybackParameters(
                    speed,
                    if (retainPitch) 1.0f else speed
                )
                promise.resolve()
            }
        }

        AsyncFunction("addTrack") { jsonContent: String, promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法添加单曲目") { controller ->
                Log.d(TAG, "用户尝试添加曲目。接收内容：$jsonContent")
                val mediaItem = createMediaItemFromTrack(jsonContent)
                rememberMediaItemHeaders(mediaItem)
                controller.addMediaItem(mediaItem)
                promise.resolve()
                firePlaylistChangeEvent()
            }
        }

        AsyncFunction("addTrackAt") { jsonContent: String, index: Int, promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法在指定位置添加曲目") { controller ->
                Log.d(TAG, "用户尝试添加曲目到指定位置。接收内容：$jsonContent")
                val mediaItem = createMediaItemFromTrack(jsonContent)
                rememberMediaItemHeaders(mediaItem)

                // 添加曲目到指定的 index
                controller.addMediaItem(index, mediaItem)

                promise.resolve()
                firePlaylistChangeEvent()
            }
        }

        AsyncFunction("addTracks") { jsonContent: String, promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法批量添加曲目") { controller ->
                Log.d(TAG, "用户尝试添加多首曲目")
                val jsonArray = JSONArray(jsonContent)
                val mediaItems = mutableListOf<MediaItem>()

                for (i in 0 until jsonArray.length()) {
                    val trackJson = jsonArray.getString(i)
                    Log.d(TAG, "接收内容：$trackJson")
                    val mediaItem = createMediaItemFromTrack(trackJson)
                    rememberMediaItemHeaders(mediaItem)
                    mediaItems.add(mediaItem)
                }

                controller.addMediaItems(mediaItems)
                promise.resolve()
                firePlaylistChangeEvent()
            }
        }

        AsyncFunction("addTracksAt") { jsonContent: String, index: Int, promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法在指定位置批量添加曲目") { controller ->
                Log.d(TAG, "用户尝试添加多首曲目到指定位置。接收内容：$jsonContent")
                val jsonArray = JSONArray(jsonContent)
                val mediaItems = mutableListOf<MediaItem>()

                for (i in 0 until jsonArray.length()) {
                    val trackJson = jsonArray.getString(i)
                    Log.d(TAG, "接收内容：$trackJson")
                    val mediaItem = createMediaItemFromTrack(trackJson)
                    rememberMediaItemHeaders(mediaItem)
                    mediaItems.add(mediaItem)
                }

                controller.addMediaItems(index, mediaItems)
                promise.resolve()
                firePlaylistChangeEvent()
            }
        }

        AsyncFunction("getTracks") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法获取曲目列表") { controller ->
                val tracks = JSONArray()

                for (i in 0 until controller.mediaItemCount) {
                    val mediaItem = controller.getMediaItemAt(i)
                    val metadata = mediaItem.mediaMetadata

                    val trackInfo = JSONObject().apply {
                        put("id", mediaItem.mediaId)
                        put("uri", mediaItem.localConfiguration?.uri?.toString() ?: "")
                        put("artworkUri", metadata.artworkUri?.toString())
                        put("title", metadata.title)
                        put("artist", metadata.artist)
                        put("duration", metadata.durationMs?.div(1000) ?: 0)
                        put("headers", metadata.extras?.getString("headers"))
                        put("extendedData", metadata.extras?.getString("extendedData"))
                    }

                    tracks.put(trackInfo)
                }

                promise.resolve(tracks.toString())
            }
        }

        AsyncFunction("replaceTrack") { index: Int, jsonContent: String, promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法修改指定曲目信息") { controller ->
                Log.d(TAG, "用户尝试替换曲目。被替换 index: $index, 接收内容: $jsonContent")
                if (index < 0 || index >= controller.mediaItemCount) {
                    throw IllegalArgumentException("无效的索引")
                }

                val mediaItem = createMediaItemFromTrack(jsonContent)
                rememberMediaItemHeaders(mediaItem)
                BilisoundPlaybackService.replaceMediaItemPreservingPlaybackOrder(index, mediaItem)

                promise.resolve()
                firePlaylistChangeEvent()
            }
        }

        AsyncFunction("deleteTrack") { index: Int, promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法删除指定曲目") { controller ->
                Log.d(TAG, "用户尝试删除曲目。被删除 index: $index")

                // 验证所有索引是否有效
                if (index < 0 || index >= controller.mediaItemCount) {
                    throw IllegalArgumentException("无效的索引: $index")
                }

                controller.removeMediaItem(index)

                promise.resolve()
                firePlaylistChangeEvent()
            }
        }

        AsyncFunction("deleteTracks") { jsonContent: String, promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法删除指定曲目") { controller ->
                Log.d(TAG, "用户尝试删除多个曲目。接收内容: $jsonContent")
                val jsonArray = JSONArray(jsonContent)

                val indices = mutableSetOf<Int>()
                for (i in 0 until jsonArray.length()) {
                    indices.add(jsonArray.getInt(i))
                }

                // 验证所有索引有效后，从大到小删除，避免索引位移。
                val invalidIndex = indices.find { it < 0 || it >= controller.mediaItemCount }
                if (invalidIndex != null) {
                    throw IllegalArgumentException("无效的索引: $invalidIndex")
                }
                val sortedIndices = indices.sortedDescending()
                for (index in sortedIndices) {
                    controller.removeMediaItem(index)
                }

                promise.resolve()
                firePlaylistChangeEvent()
            }
        }

        AsyncFunction("clearQueue") { promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法清空曲目列表") { _ ->
                BilisoundPlaybackService.setMediaItems(emptyList(), 0, 0, false)
                promise.resolve()
                firePlaylistChangeEvent()
            }
        }

        AsyncFunction("setQueue") { jsonContent: String, beginIndex: Int, promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法替换播放队列") { controller ->
                Log.d(TAG, "用户尝试替换整个播放队列。接收内容：$jsonContent")
                replaceQueue(
                    controller = controller,
                    jsonContent = jsonContent,
                    beginIndex = beginIndex,
                    position = 0.0,
                    preservePlaybackState = false,
                )
                promise.resolve()
            }
        }

        AsyncFunction("setQueueWithOptions") {
                jsonContent: String,
                optionsContent: String,
                promise: Promise ->
            withController(promise, "PLAYER_ERROR", "无法按选项替换播放队列") { controller ->
                Log.d(TAG, "用户尝试按选项替换整个播放队列。接收内容：$jsonContent")
                val options = JSONObject(optionsContent)
                replaceQueue(
                    controller = controller,
                    jsonContent = jsonContent,
                    beginIndex = options.getInt("beginIndex"),
                    position = options.getDouble("position"),
                    preservePlaybackState = options.getBoolean("preservePlaybackState"),
                )
                promise.resolve()
            }
        }

        AsyncFunction("getRepeatMode") { promise: Promise ->
            withController(promise, "GET_REPEAT_MODE_ERROR", "无法获取循环模式") { controller ->
                val repeatMode = when (controller.repeatMode) {
                    Player.REPEAT_MODE_OFF -> 0
                    Player.REPEAT_MODE_ONE -> 1
                    Player.REPEAT_MODE_ALL -> 2
                    else -> 0
                }
                promise.resolve(repeatMode)
            }
        }

        AsyncFunction("setRepeatMode") { mode: Int, promise: Promise ->
            withController(promise, "SET_REPEAT_MODE_ERROR", "无法设置循环模式") { controller ->
                val repeatMode = when (mode) {
                    0 -> Player.REPEAT_MODE_OFF
                    1 -> Player.REPEAT_MODE_ONE
                    2 -> Player.REPEAT_MODE_ALL
                    else -> Player.REPEAT_MODE_OFF
                }
                controller.repeatMode = repeatMode
                this@BilisoundPlayerModule.sendEvent(EVENT_LOOP_MODE_CHANGE, bundleOf(
                    "mode" to repeatMode,
                ))
                promise.resolve(null)
            }
        }

        AsyncFunction("getShuffleMode") { promise: Promise ->
            withController(promise, "GET_SHUFFLE_MODE_ERROR", "无法获取随机播放模式") { controller ->
                promise.resolve(if (controller.shuffleModeEnabled) 1 else 0)
            }
        }

        AsyncFunction("setShuffleMode") { mode: Int, promise: Promise ->
            withController(promise, "SET_SHUFFLE_MODE_ERROR", "无法设置随机播放模式") { controller ->
                require(mode == 0 || mode == 1) { "Invalid shuffle mode: $mode" }
                controller.shuffleModeEnabled = mode == 1
                promise.resolve(null)
            }
        }

        AsyncFunction("getPlaybackOrder") { promise: Promise ->
            withController(promise, "GET_PLAYBACK_ORDER_ERROR", "无法获取播放顺序") { _ ->
                val order = BilisoundPlaybackService.getPlaybackOrder()
                promise.resolve(JSONArray(order.toList()).toString())
            }
        }

        AsyncFunction("setPlaybackOrder") { orderJson: String, promise: Promise ->
            withController(promise, "SET_PLAYBACK_ORDER_ERROR", "无法设置播放顺序") { _ ->
                val jsonArray = JSONArray(orderJson)
                val order = IntArray(jsonArray.length()) { jsonArray.getInt(it) }
                promise.resolve(BilisoundPlaybackService.setPlaybackOrder(order))
            }
        }

        AsyncFunction("addDownload") { id: String, uri: String, metadata: String, promise: Promise ->
            mainHandler.post {
                try {
                    val downloadRequest = DownloadRequest.Builder(id, Uri.parse(uri))
                        .setData(metadata.toByteArray())
                        .setCustomCacheKey(id)
                        .build()

                    val downloadData = Json.decodeFromString<DownloadData>(metadata)
                    setHeadersOnBank(id, downloadData.headers)
                    DownloadService.sendAddDownload(
                        context,
                        BilisoundDownloadService::class.java,
                        downloadRequest,
                        /* foreground= */ false
                    )
                    promise.resolve()
                } catch (e: Exception) {
                    promise.reject("DOWNLOADER_ERROR", "无法下载所请求的文件：${e.message}", e)
                }
            }
        }

        AsyncFunction("getDownload") { id: String, promise: Promise ->
            mainHandler.post {
                try {
                    val downloadManager = getDownloadManager(context.applicationContext)
                    val download = downloadManager.downloadIndex.getDownload(id)

                    promise.resolve(download?.let { downloadToJSONObject(it) })
                } catch (e: Exception) {
                    promise.reject("DOWNLOADER_ERROR", "无法获取下载内容：${e.message}", e)
                }
            }
        }

        AsyncFunction("getDownloads") { state: DownloadState?, promise: Promise ->
            mainHandler.post {
                try {
                    val downloadManager = getDownloadManager(context.applicationContext)
                    val downloadIndex = if (state != null) {
                        downloadManager.downloadIndex.getDownloads(state.value)
                    } else {
                        downloadManager.downloadIndex.getDownloads()
                    }
                    val downloads = JSONArray()

                    while (downloadIndex.moveToNext()) {
                        downloads.put(downloadToJSONObject(downloadIndex.download))
                    }
                    downloadIndex.close()

                    promise.resolve(downloads.toString())
                } catch (e: Exception) {
                    promise.reject("DOWNLOADER_ERROR", "无法获取下载列表：${e.message}", e)
                }
            }
        }

        AsyncFunction("pauseDownload") { id: String, promise: Promise ->
            mainHandler.post {
                try {
                    // Set the stop reason for a single download.
                    DownloadService.sendSetStopReason(
                        context,
                        BilisoundDownloadService::class.java,
                        id,
                        1,
                        /* foreground= */ false
                    )
                    promise.resolve()
                } catch (e: Exception) {
                    promise.reject("DOWNLOADER_ERROR", "无法暂停所请求的下载任务：${e.message}", e)
                }
            }
        }

        AsyncFunction("resumeDownload") { id: String, promise: Promise ->
            mainHandler.post {
                try {
                    // 恢复 header 信息
                    val downloadManager = getDownloadManager(context.applicationContext)
                    val download = downloadManager.downloadIndex.getDownload(id)
                    if (download != null) {
                        val downloadData = Json.decodeFromString<DownloadData>(download.request.data.toString(Charsets.UTF_8))
                        setHeadersOnBank(id, downloadData.headers)
                    }

                    // Set the stop reason for a single download.
                    DownloadService.sendSetStopReason(
                        context,
                        BilisoundDownloadService::class.java,
                        id,
                        Download.STOP_REASON_NONE,
                        /* foreground= */ false
                    )
                    promise.resolve()
                } catch (e: Exception) {
                    promise.reject("DOWNLOADER_ERROR", "无法恢复所请求的下载任务：${e.message}", e)
                }
            }
        }

        AsyncFunction("pauseAllDownloads") { promise: Promise ->
            mainHandler.post {
                try {
                    // Pause all downloads.
                    DownloadService.sendPauseDownloads(
                        context,
                        BilisoundDownloadService::class.java,
                        /* foreground= */ false
                    )
                    promise.resolve()
                } catch (e: Exception) {
                    promise.reject("DOWNLOADER_ERROR", "无法暂停全部下载任务：${e.message}", e)
                }
            }
        }

        AsyncFunction("resumeAllDownloads") { promise: Promise ->
            mainHandler.post {
                try {
                    // Resume all downloads.
                    DownloadService.sendResumeDownloads(
                        context,
                        BilisoundDownloadService::class.java,
                        /* foreground= */ false
                    )
                    promise.resolve()
                } catch (e: Exception) {
                    promise.reject("DOWNLOADER_ERROR", "无法恢复全部下载任务：${e.message}", e)
                }
            }
        }

        AsyncFunction("removeDownload") { id: String, promise: Promise ->
            mainHandler.post {
                try {
                    DownloadService.sendRemoveDownload(
                        context,
                        BilisoundDownloadService::class.java,
                        id,
                        /* foreground= */ false
                    )
                    promise.resolve()
                } catch (e: Exception) {
                    promise.reject("DOWNLOADER_ERROR", "无法移除所请求的下载任务：${e.message}", e)
                }
            }
        }

        AsyncFunction("saveFile") { path: String, mimeType: String, replaceName: String?, promise: Promise ->
            mainHandler.post {
                try {
                    val reactContext = context as ReactContext
                    val activity = reactContext.currentActivity ?: throw Exception("Activity is not available")
                    val sourceFile = File(path)
                    if (!sourceFile.exists()) {
                        throw Exception("Source file does not exist")
                    }

                    val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = mimeType
                        if (replaceName == null || replaceName == "") {
                            putExtra(Intent.EXTRA_TITLE, sourceFile.name)
                        } else {
                            putExtra(Intent.EXTRA_TITLE, replaceName)
                        }
                    }

                    activity.startActivityForResult(intent, 43)

                    // Store the promise and source file path for later use in onActivityResult
                    pendingSaveFilePromise = promise
                    pendingSaveFilePath = path
                } catch (e: Exception) {
                    promise.reject("SAVE_FILE_ERROR", "无法保存文件 (${e.message})", e)
                }
            }
        }
    }

    private fun firePlaylistChangeEvent() {
        this@BilisoundPlayerModule.sendEvent(EVENT_QUEUE_CHANGE)
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
                    this@BilisoundPlayerModule.sendEvent(EVENT_PLAYBACK_ERROR, bundleOf(
                        "type" to ERROR_BAD_HTTP_STATUS_CODE,
                        "message" to httpError.message,
                        "code" to httpError.responseCode
                    ))
                } else {
                    // Try calling httpError.getCause() to retrieve the underlying cause, although
                    // note that it may be null.
                    this@BilisoundPlayerModule.sendEvent(EVENT_PLAYBACK_ERROR, bundleOf(
                        "type" to ERROR_NETWORK_FAILURE,
                        "message" to httpError.message,
                    ))
                }
            } else {
                this@BilisoundPlayerModule.sendEvent(EVENT_PLAYBACK_ERROR, bundleOf(
                    "type" to ERROR_GENERIC,
                    "message" to cause?.message,
                ))
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

            this@BilisoundPlayerModule.sendEvent(EVENT_PLAYBACK_STATE_CHANGE, bundleOf(
                "type" to type,
            ))
            emitShouldShowPlayButton()
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
            this@BilisoundPlayerModule.sendEvent(EVENT_IS_PLAYING_CHANGE, bundleOf(
                "isPlaying" to isPlaying
            ))
            emitShouldShowPlayButton()
        }

        override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) {
            emitShouldShowPlayButton()
        }

        override fun onPlaybackSuppressionReasonChanged(playbackSuppressionReason: Int) {
            emitShouldShowPlayButton()
        }

        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
            this@BilisoundPlayerModule.sendEvent(EVENT_TRACK_CHANGE)
        }

        override fun onShuffleModeEnabledChanged(shuffleModeEnabled: Boolean) {
            this@BilisoundPlayerModule.sendEvent(EVENT_SHUFFLE_MODE_CHANGE, bundleOf(
                "mode" to if (shuffleModeEnabled) 1 else 0,
            ))
        }
    }

    /**
     * 播放/暂停按钮应当显示「暂停」当且仅当用户表达了播放意图
     * （`playWhenReady` 为 true 且没有被音频焦点等抑制），而不是 [Player.isPlaying]。
     */
    private fun emitShouldShowPlayButton() {
        val current = controller ?: return
        this@BilisoundPlayerModule.sendEvent(EVENT_SHOULD_SHOW_PLAY_BUTTON_CHANGE, bundleOf(
            "shouldShowPlayButton" to Util.shouldShowPlayButton(current),
        ))
    }

    private val downloadListener = object : DownloadManager.Listener {
        override fun onDownloadChanged(
            downloadManager: DownloadManager,
            download: Download,
            finalException: java.lang.Exception?
        ) {
            this@BilisoundPlayerModule.sendEvent(
                EVENT_DOWNLOAD_UPDATE, bundleOf(
                    "type" to DOWNLOAD_CHANGE,
                    "download" to downloadToBundle(download),
                    "error" to finalException?.message
                ))
        }

        override fun onDownloadRemoved(downloadManager: DownloadManager, download: Download) {
            this@BilisoundPlayerModule.sendEvent(
                EVENT_DOWNLOAD_UPDATE, bundleOf(
                    "type" to DOWNLOAD_REMOVE,
                    "download" to downloadToBundle(download)
            ))
        }

        override fun onDownloadsPausedChanged(
            downloadManager: DownloadManager,
            downloadsPaused: Boolean
        ) {
            this@BilisoundPlayerModule.sendEvent(
                EVENT_DOWNLOAD_UPDATE, bundleOf(
                    "type" to DOWNLOAD_GLOBAL_STATE_CHANGE,
                    "paused" to downloadsPaused
                )
            )
        }

        override fun onWaitingForRequirementsChanged(
            downloadManager: DownloadManager,
            waitingForRequirements: Boolean
        ) {
        }

        override fun onRequirementsStateChanged(
            downloadManager: DownloadManager,
            requirements: Requirements,
            notMetRequirements: Int
        ) {
        }
    }
}

enum class DownloadState(val value: Int) : Enumerable {
    STATE_QUEUED(Download.STATE_QUEUED),
    STATE_STOPPED(Download.STATE_STOPPED),
    STATE_DOWNLOADING(Download.STATE_DOWNLOADING),
    STATE_COMPLETED(Download.STATE_COMPLETED),
    STATE_FAILED(Download.STATE_FAILED),
    STATE_REMOVING(Download.STATE_REMOVING),
    STATE_RESTARTING(Download.STATE_RESTARTING)
}
