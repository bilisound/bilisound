package moe.bilisound.player
import androidx.activity.result.contract.ActivityResultContracts
import kotlinx.serialization.Serializable

@Serializable
data class TrackData(
    val id: String,
    /**
     * Track File URI
     */
    val uri: String,
    /**
     * Artwork File URI
     */
    val artworkUri: String?,
    /**
     * Title
     */
    val title: String?,
    /**
     * Artist
     */
    val artist: String?,
    /**
     * Duration
     */
    val duration: Long?,
    /**
     * Override mine type, in case when the server returns wrong Content-Type in HTTP response headers.
     */
    val mimeType: String?,
    /**
     * HTTP Headers, stored in key-value pair.
     *
     * Example:
     *
     * ```json
     * {"foo":"bar","User-Agent":"something 123456"}
     * ```
     */
    val headers: String?,
    /**
     * Extended data of track, maybe useful for JavaScript/TypeScript side.
     */
    val extendedData: String?,
)
