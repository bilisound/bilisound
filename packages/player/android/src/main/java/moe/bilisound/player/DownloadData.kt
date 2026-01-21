package moe.bilisound.player
import kotlinx.serialization.Serializable

@Serializable
data class DownloadData(
    /**
     * Download Headers
     */
    val headers: Map<String, String>,
)
