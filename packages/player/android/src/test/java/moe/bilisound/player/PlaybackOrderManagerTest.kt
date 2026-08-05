package moe.bilisound.player

import androidx.media3.common.C
import androidx.media3.exoplayer.source.ShuffleOrder
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PlaybackOrderManagerTest {
    @Test
    fun keepsCurrentOccurrenceFirstAndVisitsEveryOccurrenceOnce() {
        val manager = PlaybackOrderManager(size = 4, startIndex = 1, randomSeed = 7)

        val order = collectPlaybackOrder(manager)

        assertEquals(1, order.first())
        assertEquals(listOf(0, 1, 2, 3), order.sorted())
        assertEquals(4, order.toSet().size)
    }

    @Test
    fun treatsDuplicateMediaAsIndependentQueueOccurrences() {
        val mediaIds = listOf("duplicate", "duplicate", "other")
        val manager = PlaybackOrderManager(size = mediaIds.size, startIndex = 0, randomSeed = 11)

        val occurrenceOrder = collectPlaybackOrder(manager)
        val mediaIdOrder = occurrenceOrder.map(mediaIds::get)

        assertEquals(3, occurrenceOrder.toSet().size)
        assertEquals(2, mediaIdOrder.count { it == "duplicate" })
        assertNotEquals(occurrenceOrder[0], occurrenceOrder[1])
    }

    @Test
    fun rebuildsPlaybackOrderWithRequestedStartWhenReplacingQueue() {
        val manager = PlaybackOrderManager(size = 4, startIndex = 0, randomSeed = 13)

        val replacement = manager.replaceAll(3, 2)
        val order = collectPlaybackOrder(replacement)

        assertEquals(2, order.first())
        assertEquals(listOf(0, 1, 2), order.sorted())
    }

    @Test
    fun preservesExistingOrderAndAppendsInsertedOccurrences() {
        val manager = PlaybackOrderManager(size = 3, startIndex = 1, randomSeed = 17)
        val originalOrder = collectPlaybackOrder(manager)

        val inserted = manager.cloneAndInsert(1, 2)
        val insertedOrder = collectPlaybackOrder(inserted)
        val shiftedOriginalOrder = originalOrder.map { if (it >= 1) it + 2 else it }

        assertEquals(shiftedOriginalOrder, insertedOrder.take(originalOrder.size))
        assertEquals(listOf(0, 1, 2, 3, 4), insertedOrder.sorted())
    }

    @Test
    fun removesOccurrencesWithoutChangingRetainedRelativeOrder() {
        val manager = PlaybackOrderManager(size = 5, startIndex = 2, randomSeed = 19)
        val originalOrder = collectPlaybackOrder(manager)

        val removed = manager.cloneAndRemove(1, 3)
        val removedOrder = collectPlaybackOrder(removed)
        val expectedOrder = originalOrder.mapNotNull { index ->
            when {
                index < 1 -> index
                index >= 3 -> index - 2
                else -> null
            }
        }

        assertEquals(expectedOrder, removedOrder)
        assertEquals(listOf(0, 1, 2), removedOrder.sorted())
    }

    @Test
    fun remapsMovedOccurrencesWithoutChangingPlaybackOrder() {
        val manager = PlaybackOrderManager(size = 5, startIndex = 3, randomSeed = 23)
        val originalOrder = collectPlaybackOrder(manager)
        val canonicalAfterMove = listOf(1, 2, 0, 3, 4)
        val newIndexByOldIndex = canonicalAfterMove.withIndex().associate { (newIndex, oldIndex) -> oldIndex to newIndex }

        val moved = manager.move(1, 3, 0)

        assertEquals(originalOrder.map { newIndexByOldIndex.getValue(it) }, collectPlaybackOrder(moved))
    }

    @Test
    fun previousIsTheExactReverseOfNext() {
        val manager = PlaybackOrderManager(size = 6, startIndex = 4, randomSeed = 29)
        val forward = collectPlaybackOrder(manager)
        val reverse = mutableListOf(manager.lastIndex)
        var currentIndex = manager.lastIndex

        while (true) {
            val previousIndex = manager.getPreviousIndex(currentIndex)
            if (previousIndex == C.INDEX_UNSET) {
                break
            }
            reverse.add(previousIndex)
            currentIndex = previousIndex
        }

        assertEquals(forward.reversed(), reverse)
    }

    @Test
    fun reportsPlaybackOrderAsCanonicalIndices() {
        val manager = PlaybackOrderManager(size = 4, startIndex = 2, randomSeed = 31)

        assertEquals(collectPlaybackOrder(manager), manager.playbackOrderIndices().toList())
    }

    @Test
    fun restoresPersistedPlaybackOrder() {
        val manager = PlaybackOrderManager(size = 4, startIndex = 0, randomSeed = 37)

        val restored = requireNotNull(manager.withPlaybackOrder(intArrayOf(2, 0, 3, 1)))

        assertEquals(listOf(2, 0, 3, 1), collectPlaybackOrder(restored))
        assertEquals(2, restored.firstIndex)
        assertEquals(2, restored.getPreviousIndex(0))
    }

    @Test
    fun rejectsPlaybackOrderThatIsNotACanonicalPermutation() {
        val manager = PlaybackOrderManager(size = 3, startIndex = 0, randomSeed = 41)

        assertNull(manager.withPlaybackOrder(intArrayOf(0, 1)))
        assertNull(manager.withPlaybackOrder(intArrayOf(0, 1, 1)))
        assertNull(manager.withPlaybackOrder(intArrayOf(0, 1, 3)))
        assertNull(manager.withPlaybackOrder(intArrayOf(0, 1, 2, 3)))
    }

    private fun collectPlaybackOrder(order: ShuffleOrder): List<Int> {
        val firstIndex = order.firstIndex
        if (firstIndex == C.INDEX_UNSET) {
            return emptyList()
        }

        val indices = mutableListOf(firstIndex)
        var currentIndex = firstIndex
        while (true) {
            val nextIndex = order.getNextIndex(currentIndex)
            if (nextIndex == C.INDEX_UNSET) {
                return indices
            }
            indices.add(nextIndex)
            currentIndex = nextIndex
        }
    }
}
