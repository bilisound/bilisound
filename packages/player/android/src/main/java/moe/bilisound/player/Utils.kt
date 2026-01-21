@file:OptIn(UnstableApi::class) package moe.bilisound.player

import android.net.Uri
import android.os.Bundle
import androidx.annotation.OptIn
import androidx.core.os.bundleOf
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.offline.Download
import kotlinx.serialization.json.Json
import org.json.JSONObject

fun createMediaItemFromTrack(json: String): MediaItem {
    val output = Json.decodeFromString<TrackData>(json)

    val extras = Bundle().apply {
        if (!output.mimeType.isNullOrEmpty()) {
            putString("mimeType", output.extendedData)
        }
        if (!output.headers.isNullOrEmpty()) {
            putString("headers", output.headers)
        }
        if (!output.extendedData.isNullOrEmpty()) {
            putString("extendedData", output.extendedData)
        }
    }

    val mediaMetadata = MediaMetadata.Builder().apply {
        if (output.artworkUri != null) {
            setArtworkUri(Uri.parse(output.artworkUri))
        }
        if (output.title != null) {
            setTitle(output.title)
        }
        if (output.artist != null) {
            setArtist(output.artist)
        }
        if (output.duration != null) {
            setDurationMs(output.duration * 1000)
        }
        setExtras(extras)
    }.build()

    val testItem = MediaItem
        .Builder()
        .setUri(output.uri)
        .setMediaId(output.id)
        .setCustomCacheKey(output.id)
        .setMediaMetadata(mediaMetadata)
        .build()

    return testItem
}

fun mediaItemToBundle(mediaItem: MediaItem): Bundle {
    val metadata = mediaItem.mediaMetadata
    return bundleOf(
        "id" to mediaItem.mediaId,
        "uri" to mediaItem.localConfiguration?.uri?.toString(),
        "artworkUri" to metadata.artworkUri?.toString(),
        "title" to metadata.title,
        "artist" to metadata.artist,
        "duration" to (metadata.durationMs?.div(1000) ?: 0),
        "mimeType" to metadata.extras?.getString("mimeType"),
        "headers" to metadata.extras?.getString("headers"),
        "extendedData" to metadata.extras?.getString("extendedData")
    )
}

fun downloadToJSONObject(download: Download): JSONObject {
    return JSONObject().apply {
        put("id", download.request.id)
        put("uri", download.request.uri.toString())
        put("bytesDownloaded", download.bytesDownloaded)
        put("bytesTotal", download.contentLength)
        put("state", download.state)
    }
}

fun downloadToBundle(download: Download): Bundle {
    return bundleOf(
        "id" to download.request.id,
        "uri" to download.request.uri.toString(),
        "bytesDownloaded" to download.bytesDownloaded,
        "bytesTotal" to download.contentLength,
        "state" to download.state
    )
}