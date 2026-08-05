package moe.bilisound.player

import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.source.ShuffleOrder
import kotlin.random.Random

/**
 * Immutable Media3 shuffle order owned by @bilisound/player.
 *
 * Canonical indices identify queue occurrences, not media ids, so duplicate tracks remain
 * independent. Existing occurrences keep their relative playback order across queue mutations,
 * and newly inserted occurrences are appended in random order.
 */
@UnstableApi
internal class PlaybackOrderManager private constructor(
    private val playbackOrder: IntArray,
    private val randomSeed: Long,
    private val onOrderChanged: ((PlaybackOrderManager) -> Unit)?,
) : ShuffleOrder {
    private val playbackPositionByCanonicalIndex = buildPlaybackPositions(playbackOrder)

    constructor(
        size: Int,
        startIndex: Int = C.INDEX_UNSET,
        randomSeed: Long = Random.nextLong(),
        onOrderChanged: ((PlaybackOrderManager) -> Unit)? = null,
    ) : this(
        playbackOrder = buildPlaybackOrder(size, startIndex, randomSeed),
        randomSeed = nextSeed(randomSeed),
        onOrderChanged = onOrderChanged,
    )

    override fun getLength(): Int = playbackOrder.size

    override fun getNextIndex(index: Int): Int {
        if (index !in playbackPositionByCanonicalIndex.indices) {
            return C.INDEX_UNSET
        }
        val playbackPosition = playbackPositionByCanonicalIndex[index]
        return playbackOrder.getOrNull(playbackPosition + 1) ?: C.INDEX_UNSET
    }

    override fun getPreviousIndex(index: Int): Int {
        if (index !in playbackPositionByCanonicalIndex.indices) {
            return C.INDEX_UNSET
        }
        val playbackPosition = playbackPositionByCanonicalIndex[index]
        return playbackOrder.getOrNull(playbackPosition - 1) ?: C.INDEX_UNSET
    }

    override fun getLastIndex(): Int = playbackOrder.lastOrNull() ?: C.INDEX_UNSET

    override fun getFirstIndex(): Int = playbackOrder.firstOrNull() ?: C.INDEX_UNSET

    override fun cloneAndInsert(insertionIndex: Int, insertionCount: Int): ShuffleOrder {
        require(insertionIndex in 0..playbackOrder.size) { "Insert index is outside the canonical queue" }
        require(insertionCount >= 0) { "Insert count must be non-negative" }
        if (insertionCount == 0) {
            return this
        }

        val random = Random(randomSeed)
        val adjustedExistingOrder = playbackOrder.map { index ->
            if (index >= insertionIndex) index + insertionCount else index
        }
        val insertedOrder = (insertionIndex until insertionIndex + insertionCount).toMutableList().apply {
            shuffle(random)
        }
        return updatedOrder(
            playbackOrder = (adjustedExistingOrder + insertedOrder).toIntArray(),
            randomSeed = random.nextLong(),
        )
    }

    override fun cloneAndRemove(indexFrom: Int, indexToExclusive: Int): ShuffleOrder {
        require(indexFrom in 0..indexToExclusive) { "Invalid remove range" }
        require(indexToExclusive <= playbackOrder.size) { "Remove range is outside the canonical queue" }
        if (indexFrom == indexToExclusive) {
            return this
        }

        val removedCount = indexToExclusive - indexFrom
        val retainedOrder = mutableListOf<Int>()
        playbackOrder.forEach { index ->
            when {
                index < indexFrom -> retainedOrder.add(index)
                index >= indexToExclusive -> retainedOrder.add(index - removedCount)
            }
        }
        return updatedOrder(retainedOrder.toIntArray(), nextSeed(randomSeed))
    }

    override fun cloneAndClear(): ShuffleOrder = updatedOrder(IntArray(0), nextSeed(randomSeed))

    fun move(indexFrom: Int, indexToExclusive: Int, newIndexFrom: Int): PlaybackOrderManager {
        require(indexFrom in 0..indexToExclusive) { "Invalid move range" }
        require(indexToExclusive <= playbackOrder.size) { "Move range is outside the canonical queue" }
        val movedCount = indexToExclusive - indexFrom
        require(newIndexFrom in 0..playbackOrder.size - movedCount) { "Move target is outside the canonical queue" }
        if (movedCount == 0 || newIndexFrom == indexFrom) {
            return this
        }

        val canonicalOccurrences = (0 until playbackOrder.size).toMutableList()
        val movedOccurrences = canonicalOccurrences.subList(indexFrom, indexToExclusive).toList()
        repeat(movedCount) {
            canonicalOccurrences.removeAt(indexFrom)
        }
        canonicalOccurrences.addAll(newIndexFrom, movedOccurrences)

        val newCanonicalIndexByOldIndex = IntArray(playbackOrder.size)
        canonicalOccurrences.forEachIndexed { newIndex, oldIndex ->
            newCanonicalIndexByOldIndex[oldIndex] = newIndex
        }
        return updatedOrder(
            playbackOrder = playbackOrder.map { newCanonicalIndexByOldIndex[it] }.toIntArray(),
            randomSeed = nextSeed(randomSeed),
        )
    }

    fun replaceAll(size: Int, startIndex: Int): PlaybackOrderManager {
        return updatedOrder(
            playbackOrder = buildPlaybackOrder(size, startIndex, nextSeed(randomSeed)),
            randomSeed = nextSeed(nextSeed(randomSeed)),
        )
    }

    /** Canonical indices in playback order. */
    fun playbackOrderIndices(): IntArray = playbackOrder.copyOf()

    /**
     * Returns a copy of this order restored from [order], or null when [order] is not a
     * permutation of the current canonical indices. Rejecting mismatched input keeps a stale
     * persisted order from desynchronizing traversal from the queue.
     */
    fun withPlaybackOrder(order: IntArray): PlaybackOrderManager? {
        if (!isCanonicalPermutation(order, playbackOrder.size)) {
            return null
        }
        return updatedOrder(order.copyOf(), nextSeed(randomSeed))
    }

    private fun updatedOrder(playbackOrder: IntArray, randomSeed: Long): PlaybackOrderManager {
        return PlaybackOrderManager(playbackOrder, randomSeed, onOrderChanged).also { updated ->
            onOrderChanged?.invoke(updated)
        }
    }

    companion object {
        private fun buildPlaybackOrder(size: Int, startIndex: Int, randomSeed: Long): IntArray {
            require(size >= 0) { "Queue size must be non-negative" }
            if (size == 0) {
                return IntArray(0)
            }

            val effectiveStartIndex = if (startIndex in 0 until size) startIndex else 0
            val random = Random(randomSeed)
            val remaining = (0 until size).filter { it != effectiveStartIndex }.toMutableList().apply {
                shuffle(random)
            }
            return (listOf(effectiveStartIndex) + remaining).toIntArray()
        }

        private fun buildPlaybackPositions(playbackOrder: IntArray): IntArray {
            val positions = IntArray(playbackOrder.size) { C.INDEX_UNSET }
            playbackOrder.forEachIndexed { playbackPosition, canonicalIndex ->
                require(canonicalIndex in playbackOrder.indices) { "Playback order contains an invalid canonical index" }
                require(positions[canonicalIndex] == C.INDEX_UNSET) { "Playback order contains a duplicate occurrence" }
                positions[canonicalIndex] = playbackPosition
            }
            return positions
        }

        private fun nextSeed(seed: Long): Long = Random(seed).nextLong()

        private fun isCanonicalPermutation(order: IntArray, size: Int): Boolean {
            if (order.size != size) {
                return false
            }
            val seen = BooleanArray(size)
            order.forEach { index ->
                if (index !in 0 until size || seen[index]) {
                    return false
                }
                seen[index] = true
            }
            return true
        }
    }
}
