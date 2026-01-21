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
import androidx.core.os.bundleOf
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
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
import com.google.common.util.concurrent.MoreExecutors
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

            Log.d(TAG, "下载管理器初始化！")
            return downloadManager!!
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
    private var pendingSaveFilePromise: Promise? = null
    private var pendingSaveFilePath: String? = null

    private fun getController(): MediaController {
        val controller = controllerFuture?.get() ?: throw Exception("Controller not ready")
        return controller
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
            EVENT_DOWNLOAD_UPDATE,
            EVENT_LOOP_MODE_CHANGE,
        )

        OnCreate {
            Log.d(TAG, "definition: 执行主程序初始化操作！")
            mainHandler.post {
                val sessionToken =
                    SessionToken(context, ComponentName(context, BilisoundPlaybackService::class.java))
                controllerFuture = MediaController.Builder(context, sessionToken).buildAsync()
                controllerFuture!!.addListener(
                    {
                        // Call controllerFuture.get() to retrieve the MediaController.
                        // MediaController implements the Player interface, so it can be
                        // attached to the PlayerView UI component.
                        // playerView.setPlayer(controllerFuture.get())
                    },
                    MoreExecutors.directExecutor()
                )
            }
        }

        OnDestroy {
            Log.d(TAG, "definition: 执行主程序销毁操作！")
            mainHandler.post {
                val controller = getController()
                controller.removeListener(playerListener)
                getDownloadManager(context.applicationContext).removeListener(downloadListener)
                controller.release()
            }
        }

        OnStartObserving {
            Log.d(TAG, "definition: 执行监听器初始化操作！")
            mainHandler.post {
                getController().addListener(playerListener)
                getDownloadManager(context.applicationContext).addListener(downloadListener)
            }
        }

        OnStopObserving {
            Log.d(TAG, "definition: 执行监听器停止操作！")
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
            mainHandler.post {
                try {
                    val controller = getController()
                    controller.play()
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法执行播放操作 (${e.message})", e)
                }
            }
        }

        AsyncFunction("pause") { promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    controller.pause()
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法执行暂停操作 (${e.message})", e)
                }
            }
        }

        AsyncFunction("prev") { promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    controller.seekToPrevious()
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法执行暂停操作 (${e.message})", e)
                }
            }
        }

        AsyncFunction("next") { promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    controller.seekToNext()
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法执行暂停操作 (${e.message})", e)
                }
            }
        }

        AsyncFunction("toggle") { promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    if (controller.isPlaying()) {
                        controller.pause()
                    } else {
                        controller.play()
                    }
                    promise.resolve()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法切换播放暂停状态 (${e.message})", e)
                }
            }
        }

        AsyncFunction("seek") { to: Long, promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    controller.seekTo(to * 1000)
                    promise.resolve()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法调整播放进度 (${e.message})", e)
                }
            }
        }

        AsyncFunction("jump") { to: Int, promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    controller.seekTo(to, 0)
                    promise.resolve()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法调整当前播放曲目 (${e.message})", e)
                }
            }
        }

        AsyncFunction("getIsPlaying") { promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    promise.resolve(controller.isPlaying)
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法获取播放状态 (${e.message})", e)
                }
            }
        }

        AsyncFunction("getCurrentTrack") { promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    val mediaItem = controller.currentMediaItem
                    if (mediaItem == null) {
                        promise.resolve(null)
                        return@post
                    }
                    promise.resolve(mediaItemToBundle(mediaItem))
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法获取播放状态 (${e.message})", e)
                }
            }
        }

        AsyncFunction("getCurrentTrackIndex") { promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    promise.resolve(controller.currentMediaItemIndex)
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法获取播放状态 (${e.message})", e)
                }
            }
        }

        AsyncFunction("getPlaybackState") { promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    when (controller.playbackState) {
                        Player.STATE_IDLE -> promise.resolve(STATE_IDLE)
                        Player.STATE_BUFFERING -> promise.resolve(STATE_BUFFERING)
                        Player.STATE_READY -> promise.resolve(STATE_READY)
                        Player.STATE_ENDED -> promise.resolve(STATE_ENDED)
                        else -> promise.resolve(STATE_IDLE)
                    }
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法获取播放状态 (${e.message})", e)
                }
            }
        }

        AsyncFunction("getProgress") { promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    promise.resolve(bundleOf(
                        // 总时长（毫秒转秒）
                        "duration" to controller.duration.coerceAtLeast(0) / 1000.0,
                        // 当前播放进度（毫秒转秒）
                        "position" to controller.currentPosition.coerceAtLeast(0) / 1000.0,
                        // 已缓冲进度（毫秒转秒）
                        "buffered" to controller.bufferedPosition.coerceAtLeast(0) / 1000.0
                    ))
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法获取播放进度 (${e.message})", e)
                }
            }
        }

        AsyncFunction("setSpeed") { speed: Float, retainPitch: Boolean, promise: Promise ->
            mainHandler.post {
                try {
                    Log.d(TAG, "用户尝试调整播放速度。speed: $speed, retainPitch: $retainPitch")
                    val controller = getController()
                    controller.playbackParameters = PlaybackParameters(
                        speed,
                        if (retainPitch) 1.0f else speed
                    )
                    promise.resolve()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法调整播放速度 (${e.message})", e)
                }
            }
        }

        AsyncFunction("addTrack") { jsonContent: String, promise: Promise ->
            mainHandler.post {
                try {
                    Log.d(TAG, "用户尝试添加曲目。接收内容：$jsonContent")
                    val mediaItem = createMediaItemFromTrack(jsonContent)
                    val controller = getController()
                    controller.addMediaItem(mediaItem)
                    promise.resolve()
                    firePlaylistChangeEvent()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法添加单曲目 (${e.message})", e)
                }
            }
        }

        AsyncFunction("addTrackAt") { jsonContent: String, index: Int, promise: Promise ->
            mainHandler.post {
                try {
                    Log.d(TAG, "用户尝试添加曲目到指定位置。接收内容：$jsonContent")
                    val mediaItem = createMediaItemFromTrack(jsonContent)
                    val controller = getController()

                    // 添加曲目到指定的 index
                    controller.addMediaItem(index, mediaItem)

                    promise.resolve()
                    firePlaylistChangeEvent()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法在指定位置添加曲目 (${e.message})", e)
                }
            }
        }

        AsyncFunction("addTracks") { jsonContent: String, promise: Promise ->
            mainHandler.post {
                try {
                    Log.d(TAG, "用户尝试添加多首曲目")
                    val jsonArray = JSONArray(jsonContent)
                    val mediaItems = mutableListOf<MediaItem>()

                    for (i in 0 until jsonArray.length()) {
                        val trackJson = jsonArray.getString(i)
                        Log.d(TAG, "接收内容：$trackJson")
                        val mediaItem = createMediaItemFromTrack(trackJson)
                        mediaItems.add(mediaItem)
                    }

                    val controller = getController()
                    controller.addMediaItems(mediaItems)
                    promise.resolve()
                    firePlaylistChangeEvent()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法批量添加曲目 (${e.message})", e)
                }
            }
        }

        AsyncFunction("addTracksAt") { jsonContent: String, index: Int, promise: Promise ->
            mainHandler.post {
                try {
                    Log.d(TAG, "用户尝试添加多首曲目到指定位置。接收内容：$jsonContent")
                    val jsonArray = JSONArray(jsonContent)
                    val mediaItems = mutableListOf<MediaItem>()

                    for (i in 0 until jsonArray.length()) {
                        val trackJson = jsonArray.getString(i)
                        Log.d(TAG, "接收内容：$trackJson")
                        val mediaItem = createMediaItemFromTrack(trackJson)
                        mediaItems.add(mediaItem)
                    }

                    val controller = getController()
                    controller.addMediaItems(index, mediaItems)
                    promise.resolve()
                    firePlaylistChangeEvent()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法在指定位置批量添加曲目 (${e.message})", e)
                }
            }
        }

        AsyncFunction("getTracks") { promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
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
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法获取曲目列表 (${e.message})", e)
                }
            }
        }

        AsyncFunction("replaceTrack") { index: Int, jsonContent: String, promise: Promise ->
            mainHandler.post {
                try {
                    Log.d(TAG, "用户尝试替换曲目。被替换 index: $index, 接收内容: $jsonContent")
                    val controller = getController()
                    if (index < 0 || index >= controller.mediaItemCount) {
                        throw IllegalArgumentException("无效的索引")
                    }

                    val mediaItem = createMediaItemFromTrack(jsonContent)
                    controller.replaceMediaItem(index, mediaItem)

                    promise.resolve()
                    firePlaylistChangeEvent()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法修改指定曲目信息 (${e.message})", e)
                }
            }
        }

        AsyncFunction("deleteTrack") { index: Int, promise: Promise ->
            mainHandler.post {
                try {
                    Log.d(TAG, "用户尝试删除曲目。被删除 index: $index")
                    val controller = getController()

                    // 验证所有索引是否有效
                    if (index < 0 || index >= controller.mediaItemCount) {
                        throw IllegalArgumentException("无效的索引: $index")
                    }

                    // 删除单个曲目
                    controller.removeMediaItem(index)

                    promise.resolve()
                    firePlaylistChangeEvent()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法删除指定曲目 (${e.message})", e)
                }
            }
        }

        AsyncFunction("deleteTracks") { jsonContent: String, promise: Promise ->
            mainHandler.post {
                try {
                    Log.d(TAG, "用户尝试删除多个曲目。接收内容: $jsonContent")
                    val controller = getController()
                    val jsonArray = JSONArray(jsonContent)

                    // 将索引转换为列表并排序（从大到小）
                    val indices = mutableListOf<Int>()
                    for (i in 0 until jsonArray.length()) {
                        indices.add(jsonArray.getInt(i))
                    }

                    // 验证所有索引是否有效
                    val invalidIndex = indices.find { it < 0 || it >= controller.mediaItemCount }
                    if (invalidIndex != null) {
                        throw IllegalArgumentException("无效的索引: $invalidIndex")
                    }

                    // 从大到小排序
                    indices.sortDescending()

                    // 从大到小依次删除，这样不会影响后面要删除项目的索引
                    for (index in indices) {
                        controller.removeMediaItem(index)
                    }

                    promise.resolve()
                    firePlaylistChangeEvent()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法删除指定曲目 (${e.message})", e)
                }
            }
        }

        AsyncFunction("clearQueue") { promise: Promise ->
            mainHandler.post {
                try {
                    val controller = getController()
                    controller.clearMediaItems()
                    promise.resolve()
                    firePlaylistChangeEvent()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法清空曲目列表 (${e.message})", e)
                }
            }
        }

        AsyncFunction("setQueue") { jsonContent: String, beginIndex: Int, promise: Promise ->
            mainHandler.post {
                try {
                    Log.d(TAG, "用户尝试替换整个播放队列。接收内容：$jsonContent")
                    val jsonArray = JSONArray(jsonContent)
                    val mediaItems = mutableListOf<MediaItem>()

                    for (i in 0 until jsonArray.length()) {
                        val trackJson = jsonArray.getString(i)
                        Log.d(TAG, "接收内容：$trackJson")
                        val mediaItem = createMediaItemFromTrack(trackJson)
                        mediaItems.add(mediaItem)
                    }

                    val controller = getController()
                    controller.clearMediaItems()
                    controller.addMediaItems(0, mediaItems)
                    controller.seekTo(beginIndex, 0)
                    promise.resolve()
                    firePlaylistChangeEvent()
                } catch (e: Exception) {
                    promise.reject("PLAYER_ERROR", "无法在指定位置批量添加曲目 (${e.message})", e)
                }
            }
        }

        AsyncFunction("getRepeatMode") { promise: Promise ->
            mainHandler.post {
                try {
                    val repeatMode = when (getController().repeatMode) {
                        Player.REPEAT_MODE_OFF -> 0
                        Player.REPEAT_MODE_ONE -> 1
                        Player.REPEAT_MODE_ALL -> 2
                        else -> 0
                    }
                    promise.resolve(repeatMode)
                } catch (e: Exception) {
                    promise.reject("GET_REPEAT_MODE_ERROR", "无法获取循环模式（${e.message}）", e)
                }
            }
        }

        AsyncFunction("setRepeatMode") { mode: Int, promise: Promise ->
            mainHandler.post {
                try {
                    val repeatMode = when (mode) {
                        0 -> Player.REPEAT_MODE_OFF
                        1 -> Player.REPEAT_MODE_ONE
                        2 -> Player.REPEAT_MODE_ALL
                        else -> Player.REPEAT_MODE_OFF
                    }
                    getController().repeatMode = repeatMode
                    this@BilisoundPlayerModule.sendEvent(EVENT_LOOP_MODE_CHANGE, bundleOf(
                        "mode" to repeatMode,
                    ))
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("SET_REPEAT_MODE_ERROR", "无法设置循环模式（${e.message}）", e)
                }
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
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
            this@BilisoundPlayerModule.sendEvent(EVENT_IS_PLAYING_CHANGE, bundleOf(
                "isPlaying" to getController().isPlaying
            ))
        }

        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
            this@BilisoundPlayerModule.sendEvent(EVENT_TRACK_CHANGE)
        }
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
