import Foundation

/// Owns canonical queue occurrences and the playback order derived from them.
///
/// Occurrence tokens are independent from track metadata ids so duplicate media
/// entries remain distinct throughout a shuffle cycle.
final class PlaybackOrderManager {
    private var canonicalTokens: [Int] = []
    private var playbackOrderTokens: [Int] = []
    private var canonicalIndexByToken: [Int: Int] = [:]
    private var playbackPositionByToken: [Int: Int] = [:]
    private var nextToken = 0
    private(set) var isShuffleEnabled = false

    var size: Int {
        canonicalTokens.count
    }

    func reset(size: Int, currentIndex: Int = -1) {
        precondition(size >= 0, "Queue size must be non-negative")

        canonicalTokens = (0..<size).map { _ in
            defer { nextToken += 1 }
            return nextToken
        }
        reindexCanonical()
        if isShuffleEnabled {
            rebuildPlaybackOrder(currentIndex: currentIndex)
        } else {
            playbackOrderTokens.removeAll()
            playbackPositionByToken.removeAll()
        }
    }

    func insert(at index: Int, count: Int, currentIndex: Int = -1) {
        precondition(index >= 0 && index <= canonicalTokens.count, "Insert index is outside the canonical queue")
        precondition(count >= 0, "Insert count must be non-negative")
        guard count > 0 else { return }

        let newTokens = (0..<count).map { _ in
            defer { nextToken += 1 }
            return nextToken
        }
        canonicalTokens.insert(contentsOf: newTokens, at: index)
        reindexCanonical()

        guard isShuffleEnabled else { return }
        if playbackOrderTokens.isEmpty {
            rebuildPlaybackOrder(currentIndex: currentIndex)
            return
        }

        playbackOrderTokens.append(contentsOf: shuffled(newTokens))
        reindexPlaybackOrder()
    }

    func remove(indices: [Int]) {
        guard !indices.isEmpty else { return }

        let normalized = Array(Set(indices)).sorted(by: >)
        precondition(
            normalized.allSatisfy { canonicalTokens.indices.contains($0) },
            "Remove index is outside the canonical queue"
        )

        var removedTokens = Set<Int>()
        for index in normalized {
            removedTokens.insert(canonicalTokens.remove(at: index))
        }
        playbackOrderTokens.removeAll { removedTokens.contains($0) }
        reindexCanonical()
        reindexPlaybackOrder()
    }

    @discardableResult
    func setShuffleEnabled(_ enabled: Bool, currentIndex: Int) -> Bool {
        guard enabled != isShuffleEnabled else { return false }

        isShuffleEnabled = enabled
        if enabled {
            rebuildPlaybackOrder(currentIndex: currentIndex)
        } else {
            playbackOrderTokens.removeAll()
            playbackPositionByToken.removeAll()
        }
        return true
    }

    func nextIndex(after currentIndex: Int) -> Int? {
        guard isShuffleEnabled else {
            return currentIndex < canonicalTokens.count - 1 ? currentIndex + 1 : nil
        }

        guard let currentToken = canonicalTokens[safe: currentIndex] else {
            return firstIndex()
        }
        guard let position = playbackPositionByToken[currentToken], position < playbackOrderTokens.count - 1 else {
            return nil
        }
        return canonicalIndexByToken[playbackOrderTokens[position + 1]]
    }

    func previousIndex(before currentIndex: Int) -> Int? {
        guard isShuffleEnabled else {
            return currentIndex > 0 && currentIndex < canonicalTokens.count ? currentIndex - 1 : nil
        }

        guard
            let currentToken = canonicalTokens[safe: currentIndex],
            let position = playbackPositionByToken[currentToken],
            position > 0
        else {
            return nil
        }
        return canonicalIndexByToken[playbackOrderTokens[position - 1]]
    }

    func firstIndex() -> Int? {
        guard !canonicalTokens.isEmpty else { return nil }
        guard isShuffleEnabled else { return 0 }
        guard let firstToken = playbackOrderTokens.first else { return nil }
        return canonicalIndexByToken[firstToken]
    }

    func occurrenceToken(at index: Int) -> Int? {
        canonicalTokens[safe: index]
    }

    func canonicalIndex(for token: Int) -> Int? {
        canonicalIndexByToken[token]
    }

    private func rebuildPlaybackOrder(currentIndex: Int) {
        let effectiveCurrentIndex: Int
        if canonicalTokens.indices.contains(currentIndex) {
            effectiveCurrentIndex = currentIndex
        } else if canonicalTokens.isEmpty {
            effectiveCurrentIndex = -1
        } else {
            effectiveCurrentIndex = 0
        }

        let currentToken = canonicalTokens[safe: effectiveCurrentIndex]
        let remaining = canonicalTokens.filter { $0 != currentToken }
        playbackOrderTokens.removeAll(keepingCapacity: true)
        if let currentToken = currentToken {
            playbackOrderTokens.append(currentToken)
        }
        playbackOrderTokens.append(contentsOf: shuffled(remaining))
        reindexPlaybackOrder()
    }

    private func shuffled(_ tokens: [Int]) -> [Int] {
        guard tokens.count > 1 else { return tokens }
        var result = tokens
        for index in stride(from: result.count - 1, through: 1, by: -1) {
            result.swapAt(index, Int.random(in: 0...index))
        }
        return result
    }

    private func reindexCanonical() {
        canonicalIndexByToken.removeAll(keepingCapacity: true)
        for (index, token) in canonicalTokens.enumerated() {
            canonicalIndexByToken[token] = index
        }
    }

    private func reindexPlaybackOrder() {
        playbackPositionByToken.removeAll(keepingCapacity: true)
        for (index, token) in playbackOrderTokens.enumerated() {
            playbackPositionByToken[token] = index
        }
    }
}

private extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
