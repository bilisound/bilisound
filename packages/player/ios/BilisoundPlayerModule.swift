import AVFoundation
import ExpoModulesCore
import MediaPlayer

public class BilisoundPlayerModule: Module {
    private static let TAG = "BilisoundPlayerModule"
    private var player: AVQueuePlayer?
    private var playerItems: [AVPlayerItem] = []
    private var currentIndex: Int = 0
    private var timeObserverToken: Any?
    private var artworkCache: [String: MPMediaItemArtwork] = [:]
    private var repeatMode: Int = 0  // 0: OFF, 1: ONE, 2: ALL
    private let playbackOrderManager = PlaybackOrderManager()
    private var remoteCommandTargets: [(command: MPRemoteCommand, target: Any)] = []

    // Playback states
    private let STATE_IDLE = "STATE_IDLE"
    private let STATE_BUFFERING = "STATE_BUFFERING"
    private let STATE_READY = "STATE_READY"
    private let STATE_ENDED = "STATE_ENDED"

    deinit {
        // Remove observer when module is destroyed
        if let token = timeObserverToken {
            player?.removeTimeObserver(token)
        }

        // Remove playback state observer
        if let observer = playbackStateObserver {
            player?.removeObserver(observer, forKeyPath: #keyPath(AVPlayer.timeControlStatus))
        }
        playbackStateObserver = nil

        // Remove media item transition observer
        if let observer = mediaItemTransitionObserver {
            player?.removeObserver(observer, forKeyPath: #keyPath(AVPlayer.currentItem))
        }
        mediaItemTransitionObserver = nil
    }

    // Define your module's methods
    public func definition() -> ModuleDefinition {
        Name("BilisoundPlayer")

        // Events that can be emitted to JavaScript
        Events(
            "onPlaybackStateChange",
            "onPlaybackError",
            "onQueueChange",
            "onTrackChange",
            "onIsPlayingChange",
            "onDownloadUpdate",
            "onMediaItemTransition",
            "onRepeatModeChange",
            "onShuffleModeChange"
        )

        OnCreate {
            print("\(BilisoundPlayerModule.TAG): Initializing player module")
            self.setupPlayer()
        }

        OnDestroy {
            print("\(BilisoundPlayerModule.TAG): Destroying player module")
            self.cleanupPlayer()
        }

        AsyncFunction("play") { (promise: Promise) in
            self.player?.play()
            promise.resolve()
        }

        AsyncFunction("pause") { (promise: Promise) in
            self.player?.pause()
            promise.resolve()
        }

        AsyncFunction("prev") { (promise: Promise) in
            do {
                if self.skipToPrevious() {
                    promise.resolve()
                } else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "No previous track available"])
                }
            } catch {
                promise.reject(
                    "PLAYER_ERROR",
                    "Failed to skip to previous track: \(error.localizedDescription)")
            }
        }

        AsyncFunction("next") { (promise: Promise) in
            do {
                if self.skipToNext() {
                    promise.resolve()
                } else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "No next track available"])
                }
            } catch {
                promise.reject(
                    "PLAYER_ERROR", "Failed to skip to next track: \(error.localizedDescription)")
            }
        }

        AsyncFunction("toggle") { (promise: Promise) in
            do {
                if let player = self.player {
                    if player.timeControlStatus == .playing {
                        player.pause()
                    } else {
                        player.play()
                    }
                    promise.resolve()
                } else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Player is not initialized"])
                }
            } catch {
                promise.reject(
                    "PLAYER_ERROR", "Failed to toggle playback: \(error.localizedDescription)")
            }
        }

        AsyncFunction("seek") { (position: Double, promise: Promise) in
            let time = CMTime(seconds: position, preferredTimescale: 1000)
            self.player?.seek(to: time) { _ in
                promise.resolve()
            }
        }

        AsyncFunction("jump") { (to: Int, promise: Promise) in
            do {
                try self.jumpToTrack(at: to)
                promise.resolve()
            } catch {
                promise.reject("PLAYER_ERROR", "Failed to jump to track: \(error.localizedDescription)")
            }
        }

        AsyncFunction("getIsPlaying") { (promise: Promise) in
            guard let player = self.player else {
                promise.resolve(false)
                return
            }

            promise.resolve(player.timeControlStatus == .playing)
        }

        AsyncFunction("getCurrentTrack") { (promise: Promise) in
            guard let player = self.player,
                let currentItem = player.currentItem,
                let metadata = self.getTrackMetadata(from: currentItem)
            else {
                promise.reject("PLAYER_ERROR", "No track is currently playing")
                return
            }
            promise.resolve(metadata)
        }

        AsyncFunction("getCurrentTrackIndex") { (promise: Promise) in
            guard self.currentIndex < self.playerItems.count else {
                promise.reject("PLAYER_ERROR", "Invalid track index")
                return
            }
            promise.resolve(self.currentIndex)
        }

        AsyncFunction("getNextTrackIndex") { (promise: Promise) in
            promise.resolve(self.nextIndexInOrder() ?? -1)
        }

        AsyncFunction("getPlaybackState") { (promise: Promise) in
            guard let player = self.player,
                let currentItem = player.currentItem
            else {
                promise.resolve(self.STATE_IDLE)
                return
            }

            switch (currentItem.status, player.timeControlStatus) {
            case (.failed, _):
                promise.resolve(self.STATE_IDLE)
            case (_, .waitingToPlayAtSpecifiedRate):
                promise.resolve(self.STATE_BUFFERING)
            case (.readyToPlay, _):
                if currentItem.duration.seconds == player.currentTime().seconds
                    && currentItem.duration.seconds > 0
                {
                    promise.resolve(self.STATE_ENDED)
                } else {
                    promise.resolve(self.STATE_READY)
                }
            default:
                promise.resolve(self.STATE_IDLE)
            }
        }

        AsyncFunction("getProgress") { (promise: Promise) in
            guard let player = self.player,
                let currentItem = player.currentItem
            else {
                promise.resolve([
                    "duration": 0.0,
                    "position": 0.0,
                    "buffered": 0.0,
                ])
                return
            }

            let duration = currentItem.duration.seconds
            let position = player.currentTime().seconds
            let timeRanges = currentItem.loadedTimeRanges
            var buffered = 0.0

            if let timeRange = timeRanges.first?.timeRangeValue {
                buffered = timeRange.start.seconds + timeRange.duration.seconds
            }

            promise.resolve([
                "duration": duration.isNaN ? 0.0 : duration,
                "position": position.isNaN ? 0.0 : position,
                "buffered": buffered.isNaN ? 0.0 : buffered,
            ])
        }

        AsyncFunction("setSpeed") { (speed: Float, retainPitch: Bool, promise: Promise) in
            guard let player = self.player,
                let currentItem = player.currentItem
            else {
                promise.reject("PLAYER_ERROR", "Player is not initialized")
                return
            }

            // Set pitch algorithm
            currentItem.audioTimePitchAlgorithm = retainPitch ? .timeDomain : .varispeed

            // Set playback rate
            player.rate = speed

            promise.resolve()
        }

        AsyncFunction("addTrack") { (jsonContent: String, promise: Promise) in
            do {
                print("\(BilisoundPlayerModule.TAG): User attempting to add a track")
                guard let jsonData = jsonContent.data(using: .utf8),
                    let trackDict = try JSONSerialization.jsonObject(with: jsonData)
                        as? [String: Any]
                else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid JSON format"])
                }

                // Create AVPlayerItem for the track
                let newItem = try self.createPlayerItem(from: trackDict)

                // Add the item using our helper method
                self.addTracksToPlayer([newItem])

                promise.resolve()
            } catch {
                promise.reject("PLAYER_ERROR", "Failed to add track: \(error.localizedDescription)")
            }
        }

        AsyncFunction("addTrackAt") { (jsonContent: String, index: Int, promise: Promise) in
            do {
                print(
                    "\(BilisoundPlayerModule.TAG): User attempting to add a track at index \(index)"
                )
                guard let jsonData = jsonContent.data(using: .utf8),
                    let trackDict = try JSONSerialization.jsonObject(with: jsonData)
                        as? [String: Any]
                else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid JSON format"])
                }

                // Create AVPlayerItem for the track
                let newItem = try self.createPlayerItem(from: trackDict)

                // Insert the item at the specified index
                if index >= 0 && index <= self.playerItems.count {
                    let hadCurrentItem = !self.playerItems.isEmpty
                    self.playerItems.insert(newItem, at: index)
                    if hadCurrentItem && index <= self.currentIndex {
                        self.currentIndex += 1
                    }
                    self.playbackOrderManager.insert(at: index, count: 1, currentIndex: self.currentIndex)
                    self.updatePlayerQueue()
                    self.firePlaylistChangeEvent()
                    promise.resolve()
                } else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid index"])
                }
            } catch {
                promise.reject(
                    "PLAYER_ERROR", "Failed to add track at index: \(error.localizedDescription)")
            }
        }

        AsyncFunction("addTracks") { (jsonContent: String, promise: Promise) in
            do {
                print("\(BilisoundPlayerModule.TAG): User attempting to add multiple tracks")
                guard let jsonData = jsonContent.data(using: .utf8),
                    let tracksArray = try JSONSerialization.jsonObject(with: jsonData)
                        as? [[String: Any]]
                else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid JSON format"])
                }

                // Create AVPlayerItems for each track
                let newItems = try tracksArray.map { try self.createPlayerItem(from: $0) }

                // Add items using our helper method
                self.addTracksToPlayer(newItems)

                promise.resolve()
            } catch {
                promise.reject(
                    "PLAYER_ERROR", "Failed to add tracks: \(error.localizedDescription)")
            }
        }

        AsyncFunction("addTracksAt") { (jsonContent: String, index: Int, promise: Promise) in
            do {
                print(
                    "\(BilisoundPlayerModule.TAG): User attempting to add multiple tracks at index \(index)"
                )
                guard let jsonData = jsonContent.data(using: .utf8),
                    let tracksArray = try JSONSerialization.jsonObject(with: jsonData)
                        as? [[String: Any]]
                else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid JSON format"])
                }

                // Create AVPlayerItems for each track
                let newItems = try tracksArray.map { try self.createPlayerItem(from: $0) }

                // Insert items at the specified index
                if index >= 0 && index <= self.playerItems.count {
                    let hadCurrentItem = !self.playerItems.isEmpty
                    self.playerItems.insert(contentsOf: newItems, at: index)
                    if hadCurrentItem && index <= self.currentIndex {
                        self.currentIndex += newItems.count
                    }
                    self.playbackOrderManager.insert(
                        at: index,
                        count: newItems.count,
                        currentIndex: self.currentIndex
                    )
                    self.updatePlayerQueue()
                    self.firePlaylistChangeEvent()
                    promise.resolve()
                } else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid index"])
                }
            } catch {
                promise.reject(
                    "PLAYER_ERROR", "Failed to add tracks at index: \(error.localizedDescription)")
            }
        }

        AsyncFunction("getTracks") { (promise: Promise) in
            do {
                guard self.player != nil else {
                    promise.resolve("[]")
                    return
                }

                var tracks: [[String: Any]] = []

                for (_, item) in self.playerItems.enumerated() {
                    if let metadata = self.getTrackMetadata(from: item) {
                        var trackInfo: [String: Any] = [
                            "id": metadata["id"] as? String ?? "",
                            "uri": metadata["uri"] as? String ?? "",
                            "title": metadata["title"] as? String ?? "",
                            "artist": metadata["artist"] as? String ?? "",
                            "duration": metadata["duration"] as? Double ?? 0,
                        ]

                        if let artworkUri = metadata["artworkUri"] as? String {
                            trackInfo["artworkUri"] = artworkUri
                        }
                        if let mimeType = metadata["mimeType"] as? String {
                            trackInfo["mimeType"] = mimeType
                        }
                        if let headers = metadata["headers"] as? String {
                            trackInfo["headers"] = headers
                        }
                        if let extendedData = metadata["extendedData"] as? String {
                            trackInfo["extendedData"] = extendedData
                        }

                        tracks.append(trackInfo)
                    }
                }

                let jsonData = try JSONSerialization.data(withJSONObject: tracks)
                if let jsonString = String(data: jsonData, encoding: .utf8) {
                    promise.resolve(jsonString)
                } else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [
                            NSLocalizedDescriptionKey: "Failed to encode tracks to JSON string"
                        ])
                }
            } catch {
                promise.reject(
                    "PLAYER_ERROR", "Failed to get track list (\(error.localizedDescription))")
            }
        }

        AsyncFunction("replaceTrack") { (index: Int, jsonContent: String, promise: Promise) in
            do {
                print(
                    "\(BilisoundPlayerModule.TAG): User attempting to replace track at index \(index)"
                )
                guard let jsonData = jsonContent.data(using: .utf8),
                    let trackDict = try JSONSerialization.jsonObject(with: jsonData)
                        as? [String: Any]
                else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid JSON format"])
                }

                // Validate index
                guard index >= 0 && index < self.playerItems.count else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid index"])
                }

                // Create new AVPlayerItem for the track
                let newItem = try self.createPlayerItem(from: trackDict)

                // Replace the item at the specified index
                self.playerItems[index] = newItem
                self.updatePlayerQueue()
                self.firePlaylistChangeEvent()

                promise.resolve()
            } catch {
                promise.reject(
                    "PLAYER_ERROR", "Failed to replace track: \(error.localizedDescription)")
            }
        }

        AsyncFunction("deleteTrack") { (index: Int, promise: Promise) in
            do {
                print(
                    "\(BilisoundPlayerModule.TAG): User attempting to delete track at index \(index)"
                )

                // Validate index
                guard index >= 0 && index < self.playerItems.count else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid index"])
                }

                // Remove the item
                self.playerItems.remove(at: index)
                self.playbackOrderManager.remove(indices: [index])

                // If we're deleting the current track, handle it properly
                if index == self.currentIndex {
                    if self.playerItems.isEmpty {
                        // If no tracks left, reset everything
                        self.currentIndex = 0
                        self.player?.replaceCurrentItem(with: nil)
                    } else if index >= self.playerItems.count {
                        // If we deleted the last track, move to the previous one
                        self.currentIndex = self.playerItems.count - 1
                        self.updatePlayerQueue()
                    } else {
                        // Keep the same index (it will now point to the next track)
                        self.updatePlayerQueue()
                    }
                } else if index < self.currentIndex {
                    // If we deleted a track before the current one, adjust the index
                    self.currentIndex -= 1
                    self.updatePlayerQueue()
                } else {
                    // For tracks after the current one, just update the queue
                    self.updatePlayerQueue()
                }

                self.firePlaylistChangeEvent()
                promise.resolve()
            } catch {
                promise.reject(
                    "PLAYER_ERROR", "Failed to delete track: \(error.localizedDescription)")
            }
        }

        AsyncFunction("deleteTracks") { (jsonContent: String, promise: Promise) in
            do {
                print("\(BilisoundPlayerModule.TAG): User attempting to delete multiple tracks")
                guard let jsonData = jsonContent.data(using: .utf8),
                    let indices = try JSONSerialization.jsonObject(with: jsonData) as? [Int]
                else {
                    throw NSError(
                        domain: "BilisoundPlayer", code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid JSON format"])
                }

                // Sort unique indices in descending order to avoid index shifting problems
                let sortedIndices = Array(Set(indices)).sorted(by: >)

                // Validate all indices first
                for index in sortedIndices {
                    guard index >= 0 && index < self.playerItems.count else {
                        throw NSError(
                            domain: "BilisoundPlayer", code: -1,
                            userInfo: [NSLocalizedDescriptionKey: "Invalid index: \(index)"])
                    }
                }

                // Keep track of whether we need to adjust currentIndex
                var currentIndexAdjustment = 0
                var deletedCurrentTrack = false

                // Remove items from highest index to lowest
                for index in sortedIndices {
                    self.playerItems.remove(at: index)

                    if index == self.currentIndex {
                        deletedCurrentTrack = true
                    } else if index < self.currentIndex {
                        currentIndexAdjustment += 1
                    }
                }
                self.playbackOrderManager.remove(indices: sortedIndices)

                // Handle current index adjustment
                if deletedCurrentTrack {
                    if self.playerItems.isEmpty {
                        // If no tracks left, reset everything
                        self.currentIndex = 0
                        self.player?.replaceCurrentItem(with: nil)
                    } else if self.currentIndex >= self.playerItems.count {
                        // If we deleted the last track(s), move to the last available track
                        self.currentIndex = self.playerItems.count - 1
                        self.updatePlayerQueue()
                    } else {
                        // Keep the same index (it will now point to the next track)
                        self.updatePlayerQueue()
                    }
                } else {
                    // Adjust current index based on how many tracks were deleted before it
                    self.currentIndex -= currentIndexAdjustment
                    self.updatePlayerQueue()
                }

                self.firePlaylistChangeEvent()
                promise.resolve()
            } catch {
                promise.reject(
                    "PLAYER_ERROR", "Failed to delete tracks: \(error.localizedDescription)")
            }
        }

        AsyncFunction("clearQueue") { (promise: Promise) in
            self.playerItems.removeAll()
            self.playbackOrderManager.reset(size: 0)
            self.currentIndex = 0
            self.player?.replaceCurrentItem(with: nil)
            self.firePlaylistChangeEvent()
            promise.resolve()
        }

        AsyncFunction("setQueue") { (jsonContent: String, beginIndex: Int, promise: Promise) in
            do {
                print("\(BilisoundPlayerModule.TAG): User attempting to set the queue")
                try self.replaceQueue(
                    jsonContent: jsonContent,
                    beginIndex: beginIndex,
                    position: 0,
                    preservePlaybackState: false
                )
                promise.resolve()
            } catch {
                promise.reject("PLAYER_ERROR", "Failed to set queue: \(error.localizedDescription)")
            }
        }

        AsyncFunction("setQueueWithOptions") {
            (jsonContent: String, optionsContent: String, promise: Promise) in
            do {
                guard let optionsData = optionsContent.data(using: .utf8),
                    let options = try JSONSerialization.jsonObject(with: optionsData)
                        as? [String: Any],
                    let beginIndex = (options["beginIndex"] as? NSNumber)?.intValue,
                    let position = (options["position"] as? NSNumber)?.doubleValue,
                    let preservePlaybackState = options["preservePlaybackState"] as? Bool
                else {
                    throw NSError(
                        domain: "BilisoundPlayer",
                        code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid queue options"]
                    )
                }

                try self.replaceQueue(
                    jsonContent: jsonContent,
                    beginIndex: beginIndex,
                    position: position,
                    preservePlaybackState: preservePlaybackState
                )
                promise.resolve()
            } catch {
                promise.reject(
                    "PLAYER_ERROR",
                    "Failed to set queue with options: \(error.localizedDescription)"
                )
            }
        }

        AsyncFunction("getRepeatMode") { (promise: Promise) in
            promise.resolve(self.repeatMode)
        }

        AsyncFunction("setRepeatMode") { (mode: Int, promise: Promise) in
            do {
                // Validate mode
                guard mode >= 0 && mode <= 2 else {
                    throw NSError(
                        domain: "BilisoundPlayer",
                        code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid repeat mode"]
                    )
                }

                self.repeatMode = mode

                // Emit event
                self.sendEvent("onRepeatModeChange", [
                    "mode": mode
                ])

                promise.resolve()
            } catch {
                promise.reject("SET_REPEAT_MODE_ERROR", "Failed to set repeat mode: \(error.localizedDescription)")
            }
        }

        AsyncFunction("getShuffleMode") { (promise: Promise) in
            promise.resolve(self.playbackOrderManager.isShuffleEnabled ? 1 : 0)
        }

        AsyncFunction("setShuffleMode") { (mode: Int, promise: Promise) in
            do {
                guard mode == 0 || mode == 1 else {
                    throw NSError(
                        domain: "BilisoundPlayer",
                        code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Invalid shuffle mode"]
                    )
                }

                let changed = self.playbackOrderManager.setShuffleEnabled(
                    mode == 1,
                    currentIndex: self.currentIndex
                )
                if changed {
                    self.sendEvent("onShuffleModeChange", [
                        "mode": mode
                    ])
                }
                promise.resolve()
            } catch {
                promise.reject("SET_SHUFFLE_MODE_ERROR", "Failed to set shuffle mode: \(error.localizedDescription)")
            }
        }

        AsyncFunction("saveFile") { (path: String, mimeType: String, replaceName: String?, promise: Promise) in
            do {
                // todo
                promise.resolve()
            } catch {
                promise.reject("SAVE_FILE_ERROR", "Failed: \(error.localizedDescription)")
            }
        }
    }

    private func replaceQueue(
        jsonContent: String,
        beginIndex: Int,
        position: Double,
        preservePlaybackState: Bool
    ) throws {
        guard position.isFinite && position >= 0 else {
            throw NSError(
                domain: "BilisoundPlayer",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "Invalid playback position"]
            )
        }
        guard let jsonData = jsonContent.data(using: .utf8),
            let tracksArray = try JSONSerialization.jsonObject(with: jsonData)
                as? [[String: Any]]
        else {
            throw NSError(
                domain: "BilisoundPlayer",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "Invalid JSON format"]
            )
        }

        let newItems = try tracksArray.map { try self.createPlayerItem(from: $0) }
        guard newItems.isEmpty ? beginIndex == 0 : newItems.indices.contains(beginIndex) else {
            throw NSError(
                domain: "BilisoundPlayer",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "Invalid begin index"]
            )
        }

        let shouldResume = preservePlaybackState && (self.player?.rate ?? 0) != 0
        self.player?.pause()
        self.playerItems = newItems
        if newItems.isEmpty {
            self.currentIndex = 0
            self.playbackOrderManager.reset(size: 0)
            self.player?.replaceCurrentItem(with: nil)
            self.firePlaylistChangeEvent()
            return
        }

        self.currentIndex = beginIndex
        self.playbackOrderManager.reset(size: newItems.count, currentIndex: beginIndex)
        self.updatePlayerQueue()
        self.player?.seek(
            to: CMTime(seconds: position, preferredTimescale: 1000),
            toleranceBefore: .zero,
            toleranceAfter: .zero
        )
        if shouldResume {
            self.player?.play()
        }
    }

    private func addTracksToPlayer(_ items: [AVPlayerItem]) {
        let insertIndex = self.playerItems.count
        self.playerItems.append(contentsOf: items)
        self.playbackOrderManager.insert(
            at: insertIndex,
            count: items.count,
            currentIndex: self.currentIndex
        )

        // If player is not playing anything, start from the beginning
        if let player = self.player, player.items().isEmpty {
            items.forEach { player.insert($0, after: nil) }
        }
    }

    private func jumpToTrack(at index: Int) throws {
        guard self.player != nil else {
            throw NSError(
                domain: "BilisoundPlayer", code: -1,
                userInfo: [NSLocalizedDescriptionKey: "Player is not initialized"])
        }

        // Check if the target index is valid
        guard index >= 0 && index < self.playerItems.count else {
            throw NSError(
                domain: "BilisoundPlayer", code: -1,
                userInfo: [NSLocalizedDescriptionKey: "Invalid track index"])
        }

        // Update current index
        self.currentIndex = index

        // Update player queue starting from the target index
        self.updatePlayerQueue()
        self.player?.seek(to: .zero)
    }

    private func updatePlayerQueue() {
        guard let player = player else { return }

        // Remove all items
        while player.items().count > 0 {
            player.remove(player.items().last!)
        }

        // Add all items from current index
        for item in playerItems[currentIndex...] {
            player.insert(item, after: player.items().last)
        }
        
        self.firePlaylistChangeEvent()
    }

    private class PlaybackStateObserver: NSObject {
        weak var module: BilisoundPlayerModule?

        init(module: BilisoundPlayerModule) {
            self.module = module
            super.init()
        }

        override func observeValue(
            forKeyPath keyPath: String?,
            of object: Any?,
            change: [NSKeyValueChangeKey: Any]?,
            context: UnsafeMutableRawPointer?
        ) {
            if keyPath == #keyPath(AVPlayer.timeControlStatus),
                let player = object as? AVPlayer
            {
                var state = module?.STATE_IDLE ?? "STATE_IDLE"

                switch player.timeControlStatus {
                case .paused:
                    if player.currentItem?.status == .readyToPlay {
                        state = module?.STATE_READY ?? "STATE_READY"
                    } else {
                        state = module?.STATE_IDLE ?? "STATE_IDLE"
                    }
                case .waitingToPlayAtSpecifiedRate:
                    state = module?.STATE_BUFFERING ?? "STATE_BUFFERING"
                case .playing:
                    state = module?.STATE_READY ?? "STATE_READY"
                @unknown default:
                    state = module?.STATE_IDLE ?? "STATE_IDLE"
                }

                // Send playback state change event
                module?.sendEvent(
                    "onPlaybackStateChange",
                    [
                        "state": state
                    ])

                // Also send isPlaying state change
                let isPlaying = player.timeControlStatus == .playing
                module?.sendEvent(
                    "onIsPlayingChange",
                    [
                        "isPlaying": isPlaying
                    ])
            }
        }
    }

    private var playbackStateObserver: PlaybackStateObserver?

    private class MediaItemTransitionObserver: NSObject {
        weak var module: BilisoundPlayerModule?

        init(module: BilisoundPlayerModule) {
            self.module = module
            super.init()
        }

        override func observeValue(
            forKeyPath keyPath: String?,
            of object: Any?,
            change: [NSKeyValueChangeKey: Any]?,
            context: UnsafeMutableRawPointer?
        ) {
            if keyPath == #keyPath(AVPlayer.currentItem) {
                // Get the new item
                guard let player = object as? AVPlayer,
                    let newItem = player.currentItem
                else {
                    return
                }

                // Find the index of the new item
                if let index = module?.playerItems.firstIndex(of: newItem) {
                    module?.currentIndex = index

                    // Get metadata for the new track
                    if let metadata = module?.getTrackMetadata(from: newItem) {
                        // Send track change event
                        module?.sendEvent(
                            "onTrackChange",
                            [
                                "index": index,
                                "track": metadata,
                            ])
                    }

                    // Update now playing info
                    module?.updateNowPlayingInfo()
                }
            }
        }
    }

    private var mediaItemTransitionObserver: MediaItemTransitionObserver?

    private func setupPlayer() {
        // Initialize AVQueuePlayer
        player = AVQueuePlayer()
        
        // 设置播放器在每首歌结束时停止，而不是自动播放下一首
        player?.actionAtItemEnd = .pause

        // Initialize observers

        // Set up audio session for background playback
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(
                .playback, mode: .default, options: [.allowBluetooth, .allowAirPlay])
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            // Enable background playback
            setupRemoteTransportControls()

            // Enable playback information in control center
            UIApplication.shared.beginReceivingRemoteControlEvents()
        } catch {
            print("\(BilisoundPlayerModule.TAG): Failed to set up audio session: \(error)")
        }

        // Add observers for player state changes
        setupPlayerObservers()

        // Add observer for playback errors
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handlePlayerItemError),
            name: .AVPlayerItemFailedToPlayToEndTime,
            object: nil
        )

        // Add observer for item status changes to catch loading errors
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handlePlayerItemStatusChange),
            name: .AVPlayerItemNewErrorLogEntry,
            object: nil
        )
    }

    private func setupRemoteTransportControls() {
        removeRemoteTransportControls()
        let commandCenter = MPRemoteCommandCenter.shared()

        let playTarget = commandCenter.playCommand.addTarget { [weak self] _ in
            self?.player?.play()
            return .success
        }
        remoteCommandTargets.append((commandCenter.playCommand, playTarget))

        let pauseTarget = commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.player?.pause()
            return .success
        }
        remoteCommandTargets.append((commandCenter.pauseCommand, pauseTarget))

        let nextTarget = commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            return self.skipToNext() ? .success : .noSuchContent
        }
        remoteCommandTargets.append((commandCenter.nextTrackCommand, nextTarget))

        let previousTarget = commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            return self.skipToPrevious() ? .success : .noSuchContent
        }
        remoteCommandTargets.append((commandCenter.previousTrackCommand, previousTarget))

        let seekTarget = commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let self = self,
                let player = self.player,
                let positionCommand = event as? MPChangePlaybackPositionCommandEvent
            else {
                return .commandFailed
            }

            player.seek(to: CMTime(seconds: positionCommand.positionTime, preferredTimescale: 1000))
            return .success
        }
        remoteCommandTargets.append((commandCenter.changePlaybackPositionCommand, seekTarget))
    }

    private func removeRemoteTransportControls() {
        remoteCommandTargets.forEach { entry in
            entry.command.removeTarget(entry.target)
        }
        remoteCommandTargets.removeAll()
    }

    private func setupPlayerObservers() {
        // Observe playback status changes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(playerItemDidReachEnd),
            name: .AVPlayerItemDidPlayToEndTime,
            object: nil
        )

        // Add periodic time observer
        let interval = CMTime(seconds: 1, preferredTimescale: 1)
        timeObserverToken = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) {
            [weak self] time in
            self?.updateNowPlayingInfo()
        }

        // Setup playback state observer
        playbackStateObserver = PlaybackStateObserver(module: self)
        player?.addObserver(
            playbackStateObserver!,
            forKeyPath: #keyPath(AVPlayer.timeControlStatus),
            options: [.old, .new],
            context: nil
        )

        // Setup media item transition observer
        mediaItemTransitionObserver = MediaItemTransitionObserver(module: self)
        player?.addObserver(
            mediaItemTransitionObserver!,
            forKeyPath: #keyPath(AVPlayer.currentItem),
            options: [.old, .new],
            context: nil
        )
    }

    private func loadArtwork(urlString: String, completion: @escaping (MPMediaItemArtwork?) -> Void)
    {
        // Check cache first
        if let cachedArtwork = artworkCache[urlString] {
            completion(cachedArtwork)
            return
        }

        // Create URL
        guard let url = URL(string: urlString) else {
            completion(nil)
            return
        }

        // Create URLSession task
        let task = URLSession.shared.dataTask(with: url) { [weak self] (data, response, error) in
            guard let self = self,
                let data = data,
                let image = UIImage(data: data)
            else {
                DispatchQueue.main.async {
                    completion(nil)
                }
                return
            }

            // Create artwork
            let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }

            // Cache the artwork
            self.artworkCache[urlString] = artwork

            // Return on main thread
            DispatchQueue.main.async {
                completion(artwork)
            }
        }

        task.resume()
    }

    private func updateNowPlayingInfo() {
        guard let player = player,
            let currentItem = player.currentItem,
            let metadata = getTrackMetadata(from: currentItem)
        else {
            return
        }

        let nowPlayingInfo: [String: Any] = [
            MPMediaItemPropertyTitle: metadata["title"] as? String ?? "Unknown Title",
            MPMediaItemPropertyArtist: metadata["artist"] as? String ?? "Unknown Artist",
            MPNowPlayingInfoPropertyElapsedPlaybackTime: CMTimeGetSeconds(
                currentItem.currentTime()),
            MPMediaItemPropertyPlaybackDuration: metadata["duration"] as? Double ?? 0,
            MPNowPlayingInfoPropertyPlaybackRate: player.rate,
            MPNowPlayingInfoPropertyDefaultPlaybackRate: 1.0,
            MPNowPlayingInfoPropertyPlaybackQueueCount: playerItems.count,
            MPNowPlayingInfoPropertyPlaybackQueueIndex: currentIndex,
        ]

        // Update now playing info first without artwork
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo

        // Then load artwork asynchronously
        if let artworkUrlString = metadata["artworkUri"] as? String {
            loadArtwork(urlString: artworkUrlString) { [weak self] artwork in
                guard let artwork = artwork else { return }

                // Update now playing info with artwork
                if var currentInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo {
                    currentInfo[MPMediaItemPropertyArtwork] = artwork
                    MPNowPlayingInfoCenter.default().nowPlayingInfo = currentInfo
                }
            }
        }
    }

    @objc private func handleCurrentItemChange(notification: Notification) {
        if let item = player?.currentItem,
            let index = playerItems.firstIndex(of: item)
        {
            currentIndex = index
            updateNowPlayingInfo()

            // Send track change event
            if let metadata = getTrackMetadata(from: item) {
                sendEvent(
                    "onTrackChange",
                    [
                        "index": index,
                        "track": metadata,
                    ])
            }
        }
    }

    private func cleanupPlayer() {
        player?.pause()
        NotificationCenter.default.removeObserver(self)

        if let token = timeObserverToken {
            player?.removeTimeObserver(token)
            timeObserverToken = nil
        }
        if let observer = playbackStateObserver {
            player?.removeObserver(observer, forKeyPath: #keyPath(AVPlayer.timeControlStatus))
            playbackStateObserver = nil
        }
        if let observer = mediaItemTransitionObserver {
            player?.removeObserver(observer, forKeyPath: #keyPath(AVPlayer.currentItem))
            mediaItemTransitionObserver = nil
        }

        removeRemoteTransportControls()
        UIApplication.shared.endReceivingRemoteControlEvents()
        artworkCache.removeAll()
        player = nil
    }

    @objc private func handlePlaybackEnd(notification: Notification) {
        // Handle playback completion
    }

    private func cleanupPlayback() {
        // Clear now playing info
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil

        // Clear the queue
        if let player = player {
            while let lastItem = player.items().last {
                player.remove(lastItem)
            }
            // Reset current item
            player.replaceCurrentItem(with: nil)
        }
    }

    @objc private func playerItemDidReachEnd(notification: Notification) {
        print("播放结束，当前索引：\(currentIndex)，总数：\(playerItems.count)，时长：\(String(describing: player?.currentTime().seconds))")
        
        do {
            if (self.repeatMode == 1) {
                print("执行单曲循环")
                try jumpToTrack(at: currentIndex)
                player?.play()
                return
            }

            // 按当前播放模式（含 shuffle）获取下一首
            if let nextIndex = nextIndexInOrder() {
                print("继续播放下一首")
                currentIndex = nextIndex
                try jumpToTrack(at: currentIndex)
                player?.play()
            } else if (self.repeatMode == 2) {
                // 播放顺序已到末尾，循环回到首个
                print("已到达播放列表末尾，跳转回第一首")
                let firstIndex = firstIndexInOrder() ?? 0
                currentIndex = firstIndex
                try jumpToTrack(at: currentIndex)
                player?.play()
            } else {
                print("已到达播放列表末尾，清理播放状态")
                restoreCurrent()
            }
        } catch {
            print("播放跳转失败：\(error.localizedDescription)")
            // If jump fails, restore to initial state
            restoreCurrent()
            
            // Send error event
            sendEvent(
                "onPlaybackError",
                [
                    "type": "ERROR_GENERIC",
                    "message": "Failed to jump to track: \(error.localizedDescription)",
                ])
        }
    }

    @objc private func handlePlayerItemError(notification: Notification) {
        guard let playerItem = notification.object as? AVPlayerItem,
            let error = playerItem.error as NSError?
        else {
            return
        }

        var errorType = "ERROR_GENERIC"
        var message = error.localizedDescription

        // Check for network-related errors
        if error.domain == NSURLErrorDomain {
            switch error.code {
            case NSURLErrorNotConnectedToInternet,
                NSURLErrorNetworkConnectionLost,
                NSURLErrorTimedOut:
                errorType = "ERROR_NETWORK_FAILURE"
            case NSURLErrorBadServerResponse,
                NSURLErrorBadURL:
                errorType = "ERROR_BAD_HTTP_STATUS_CODE"
            default:
                errorType = "ERROR_NETWORK_FAILURE"
            }
        }

        print("捕获播放错误：\(message)")

        // Send error event to RN
        sendEvent(
            "onPlaybackError",
            [
                "type": errorType,
                "message": message,
            ])
    }

    @objc private func handlePlayerItemStatusChange(notification: Notification) {
        guard let playerItem = notification.object as? AVPlayerItem,
            let errorLog = playerItem.errorLog(),
            let lastEvent = errorLog.events.last
        else {
            return
        }

        // Send error event to RN
        sendEvent(
            "onPlaybackError",
            [
                "type": "ERROR_GENERIC",
                "message": lastEvent.errorComment ?? "Unknown playback error",
            ])
    }

    private struct AssociatedKeys {
        static var metadata = "com.bilisound.player.metadata"
    }

    private func createPlayerItem(from track: [String: Any]) throws -> AVPlayerItem {
        guard let urlString = track["uri"] as? String,
            let url = URL(string: urlString)
        else {
            throw NSError(
                domain: "BilisoundPlayer", code: -1,
                userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }

        // Store metadata as associated object
        var metadata: [String: Any] = [:]
        metadata["id"] = track["id"] as? String
        metadata["uri"] = urlString
        metadata["title"] = track["title"] as? String
        metadata["artist"] = track["artist"] as? String
        metadata["artworkUri"] = track["artworkUri"] as? String
        metadata["duration"] = track["duration"] as? Double
        metadata["mimeType"] = track["mimeType"] as? String
        metadata["headers"] = track["headers"] as? String
        metadata["extendedData"] = track["extendedData"] as? String

        var asset: AVURLAsset
        var options: [String: Any] = [:]
        // Override MIME type if provided and on iOS 17+
        if #available(iOS 17.0, *) {
            if let mimeType = metadata["mimeType"] as? String {
                options[AVURLAssetOverrideMIMETypeKey] = mimeType
            }
        }
        if let headersString = metadata["headers"] as? String,
            let headersData = headersString.data(using: .utf8),
            let headers = try? JSONSerialization.jsonObject(with: headersData) as? [String: String]
        {
            // Create asset with headers and MIME type override
            options["AVURLAssetHTTPHeaderFieldsKey"] = headers
        }
        print(options)
        asset = AVURLAsset(url: url, options: options)

        let item = AVPlayerItem(asset: asset)

        // Add KVO observer for item status
        // item.addObserver(
        //     playerItemObserver!, forKeyPath: #keyPath(AVPlayerItem.status), options: [.new],
        //     context: nil)

        objc_setAssociatedObject(
            item, &AssociatedKeys.metadata, metadata, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)

        return item
    }

    private func getTrackMetadata(from item: AVPlayerItem) -> [String: Any]? {
        if let metadata = objc_getAssociatedObject(item, &AssociatedKeys.metadata) as? [String: Any]
        {
            return metadata
        }

        // Fallback: return basic info if metadata is not available
        if let asset = item.asset as? AVURLAsset {
            return ["uri": asset.url.absoluteString]
        }

        return nil
    }

    private func firePlaylistChangeEvent() {
        // Convert current playlist to JSON and emit event
        let tracks = playerItems.map { getTrackMetadata(from: $0) }

        if let jsonData = try? JSONSerialization.data(withJSONObject: tracks),
            let jsonString = String(data: jsonData, encoding: .utf8)
        {
            self.sendEvent(
                "onQueueChange",
                [
                    "tracks": jsonString
                ])
        }
    }

    private func nextIndexInOrder() -> Int? {
        playbackOrderManager.nextIndex(after: currentIndex)
    }

    private func prevIndexInOrder() -> Int? {
        playbackOrderManager.previousIndex(before: currentIndex)
    }

    private func firstIndexInOrder() -> Int? {
        playbackOrderManager.firstIndex()
    }

    private func skipToNext() -> Bool {
        guard let target = nextIndexInOrder() else {
            return false
        }

        do {
            currentIndex = target
            try jumpToTrack(at: currentIndex)
            player?.play()
            return true
        } catch {
            print("跳转到下一曲失败：\(error.localizedDescription)")
            return false
        }
    }

    private func skipToPrevious() -> Bool {
        guard let player = player,
            let currentItem = player.currentItem
        else {
            return false
        }

        // If we're more than 3 seconds into the current track,
        // or this is the first track in playback order, just seek to start
        let prevTarget = prevIndexInOrder()
        if prevTarget == nil || currentItem.currentTime().seconds > 3 {
            currentItem.seek(to: .zero) { _ in
                player.play()
            }
            return true
        }

        // Otherwise go to previous track
        do {
            currentIndex = prevTarget!
            try jumpToTrack(at: currentIndex)
            player.play()
            return true
        } catch {
            print("跳转到上一曲失败：\(error.localizedDescription)")
            return false
        }
    }

    private func restoreCurrent() -> Bool {
        updatePlayerQueue()

        // Reset to beginning of current track
        player?.seek(to: .zero)
        player?.pause()

        return true
    }
}

// Helper extension for safe array access
extension Array {
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}
