# Player Foundation

This document focuses on the first proposed v3 implementation priority: improving `@bilisound/player` before large mobile app restructuring.

## Current Problem

Mobile app code currently implements shuffle by physically mutating the queue:

```txt
getTracks
shuffle array
deleteTracks
addTracks
jump
seek
```

The implementation includes an iOS-specific workaround after restoring queue order. This suggests that the app layer is compensating for platform-specific player behavior.

Android Media3 ExoPlayer has native shuffle support. The current all-platform physical queue mutation model appears to be shaped by iOS limitations rather than by the desired product abstraction.

## Design Direction

The player package should own one cross-platform random queue contract:

```txt
@bilisound/player:
  own the canonical queue and shuffle playback order
  identify queue occurrences independently from business media ids
  keep native-engine shuffle disabled
  route next, previous, natural end, repeat wrapping, and external media controls
  through the same playback-order resolver

Media3 / AVQueuePlayer / HTMLAudio:
  execute playback and canonical-index seeks selected by @bilisound/player

mobile app:
  call setShuffleMode / toggleShuffleMode
  do not physically reorder the queue or compensate for platform differences
```

Implementations may differ by platform, but ownership and observable behavior must not. The app should own shuffle policy only where it is product-specific; the player owns queue mechanics and platform differences.

## Queue Concepts

v3 should distinguish these concepts:

```txt
canonical queue:
  stable list returned by getTracks()

playback order:
  the order used by next/prev/end-of-track behavior

physical queue:
  the platform engine's internal media item order
```

`getTracks()` should continue returning canonical queue order. Shuffle should change playback order, not the public queue list.

## Proposed API: Shuffle

Types:

```ts
export enum ShuffleMode {
  OFF = 0,
  ON = 1,
}
```

Functions:

```ts
export function getShuffleMode(): Promise<ShuffleMode>;
export function setShuffleMode(mode: ShuffleMode): Promise<void>;
export async function toggleShuffleMode(): Promise<ShuffleMode>;
```

Playback order lookup:

```ts
export function getNextTrackIndex(): Promise<number>;
```

`getNextTrackIndex()` returns the canonical queue index that the player would use for the next item in the current playback order, or `-1` when there is no next item. Repeat wrapping is intentionally excluded so cache prefetch keeps the old “current and one following track” policy while no longer assuming canonical queue order equals playback order.

Event:

```txt
onShuffleModeChange
```

Hook:

```ts
export const useShuffleMode = ...
```

Behavior:

```txt
Turning shuffle on:
  current track stays current
  current playback position is preserved
  next/prev follow shuffle order

Turning shuffle off:
  current track stays current
  current playback position is preserved
  next/prev follow canonical queue order
```

Repeat interaction:

```txt
RepeatMode.ONE + shuffle:
  current track repeats; shuffle order does not advance

RepeatMode.ALL + shuffle:
  shuffle order loops when exhausted

RepeatMode.OFF + shuffle:
  playback ends when shuffle order is exhausted
```

The repeat interaction should be verified per platform.

## Proposed API: Queue Transaction

Shuffle should not primarily depend on queue transactions, but queue transactions are still needed for other playback flows.

Proposed TypeScript API:

```ts
export interface SetQueueOptions {
  beginIndex?: number;
  position?: number;
  preservePlaybackState?: boolean;
}

export function setQueueWithOptions(tracks: TrackData[], options?: SetQueueOptions): Promise<void>;
```

Use cases:

```txt
play playlist from selected index
restore previous playback session
replace queue while preserving current progress
recover after cache/resource URL changes
```

Existing `setQueue(tracks, beginIndex)` should remain for compatibility during migration.

## Platform Notes

### Android

Android should not delegate shuffle ordering to Media3. `shuffleModeEnabled` stays disabled, while the player-owned queue manager resolves canonical target indices for:

```txt
JS next / previous
natural item completion
MediaSession, notification, headset, and car controls
getNextTrackIndex
```

Expected implementation areas:

```txt
packages/player/android/src/main/java/moe/bilisound/player/BilisoundPlayerModule.kt
packages/player/android/src/main/java/moe/bilisound/player/services/BilisoundPlaybackService.kt
```

Queue transaction can use `seekTo(mediaItemIndex, positionMs)` after setting media items.

### iOS

iOS currently uses `AVQueuePlayer` and an internal `playerItems` list.

Expected implementation area:

```txt
packages/player/ios/BilisoundPlayerModule.swift
```

iOS can simulate shuffle order by maintaining a playback-order index list while keeping canonical `playerItems` stable.

Important behavior:

```txt
next/prev/end-of-track should consult shuffle order when shuffle is enabled
getTracks should return canonical order
getCurrentTrackIndex should return canonical index
```

### Web

Web can simulate shuffle order in `BilisoundPlayerModule.web.ts`.

There is a queue API consistency issue worth checking while working in this file:

```ts
addTrackAt(trackDataJson, index) uses splice(index, 1, trackDataJson)
addTracksAt(trackDatasJson, index) uses splice(index, 0, ...trackDatasJson)
```

`addTrackAt` appears to replace rather than insert.

## Test Matrix

Manual test scenarios should cover iOS, Android, and Web:

1. Turn shuffle on while playing.
2. Turn shuffle on while paused.
3. Turn shuffle off while playing.
4. Turn shuffle off while paused.
5. Press next repeatedly in shuffle mode.
6. Press previous in shuffle mode.
7. Use RepeatMode.ONE with shuffle enabled.
8. Use RepeatMode.ALL with shuffle enabled.
9. Add tracks while shuffle is enabled.
10. Replace queue while shuffle is enabled.
11. Verify `useQueue`, `useCurrentTrack`, and queue-related events update correctly.
12. Let a track end naturally and verify the same order used by explicit next.
13. Exercise notification, headset, lock-screen, and MediaSession next/previous controls.
14. Shuffle a queue containing duplicate business media ids and verify every occurrence plays exactly once per cycle.
15. Verify queue replacement rebuilds playback order without exposing native-engine ordering.

## Implementation Status

This epic is being delivered in slices so native code (which cannot be compiled/verified in every agent environment) does not block the TypeScript contract.

### Slice A — TS contract + Web + hook exports (DONE)

Verified with `pnpm -C packages/player build`.

Changes:

```txt
types/index.ts
  + enum ShuffleMode { OFF = 0, ON = 1 }
  + interface ShuffleModeChangeEvent { mode: ShuffleMode }
  + registered onShuffleModeChange in EventList / EventListFunc

types/module.ts
  + getShuffleMode(): Promise<ShuffleMode>
  + setShuffleMode(mode: ShuffleMode): Promise<void>

player.ts
  + getShuffleMode / setShuffleMode / toggleShuffleMode

hooks/useShuffleMode.ts (new)
  + useShuffleMode subscription store (onShuffleModeChange)

index.ts
  + export useRepeatMode   (was previously missing from public API)
  + export useShuffleMode

BilisoundPlayerModule.web.ts
  + shuffleMode + shuffleOrderIds state
  + rebuildShuffleOrder / resolvePlaybackOrder / getNextIndex / getPrevIndex / getFirstIndex
  + next/prev/ended now consult playback order when shuffle is ON
  + getShuffleMode / setShuffleMode
  ~ fixed addTrackAt: splice(index, 1, x) (replace) -> splice(index, 0, x) (insert)
```

Web design decisions:

```txt
playback order is stored as track ids (shuffleOrderIds), not canonical indices,
so queue insert/delete self-heals without per-mutation bookkeeping.
getTracks() / getCurrentTrackIndex() still return canonical order/index.
Turning shuffle ON keeps the current track first; progress is untouched.
id uniqueness assumption matches existing deleteTracks() behavior
(mobile builds id as `${bvid}_${episode}` via getCacheStatusKey).
```

Coupling reduced by this slice:

```txt
missing public hook export (useRepeatMode) — now exported
prepares removal of app-level physical-queue shuffle + @bilisound/player/build/* deep import
```

Not verifiable in this environment: native iOS/Android. Web shuffle still needs
manual browser testing per the Test Matrix above.

### Slice B — Android Media3 native shuffle experiment (SUPERSEDED BY SLICE F)

This slice originally delegated shuffle ordering to Media3 and added the native event contract. Slice F superseded the ordering decision after current-item replacement exposed unstable shuffled transitions.

Historical changes retained from this slice:

```txt
Constants.kt
  + EVENT_SHUFFLE_MODE_CHANGE = "onShuffleModeChange"

BilisoundPlayerModule.kt
  + registered EVENT_SHUFFLE_MODE_CHANGE in Events(...)
  + getShuffleMode / setShuffleMode native contract
```

Superseded design:

```txt
Media3 shuffleModeEnabled owned playback order.
seekToNext/seekToPrevious followed Media3 shuffle order.
```

Current direction:

```txt
@bilisound/player owns one stable playback order on every platform.
Media3 shuffle stays disabled and receives canonical target indices from that manager.
```

### Slice C — iOS (AVQueuePlayer simulated shuffle order) (DONE, needs device verification)

Native code; not compiled in this environment. Verify in Xcode / on device.

Changes:

```txt
BilisoundPlayerModule.swift
  + registered "onShuffleModeChange" in Events(...)
  + state: shuffleMode (0/1) + shuffleOrderIds ([String], track ids)
  + helpers: trackId(of:), rebuildShuffleOrder, resolvePlaybackOrder,
    nextIndexInOrder, prevIndexInOrder, firstIndexInOrder
  + skipToNext / skipToPrevious now consult playback order
  + playerItemDidReachEnd (natural end) now consults playback order
  + getShuffleMode / setShuffleMode AsyncFunction
```

Design (mirrors Web):

```txt
shuffleOrderIds stores track ids, not canonical indices -> self-heals on queue mutation.
playerItems / currentIndex stay canonical; getTracks/getCurrentTrackIndex unchanged.
turning shuffle ON keeps current track first; progress untouched.
safety: actionAtItemEnd = .pause means AVQueuePlayer never auto-advances;
all next/prev/end advancement is manual via jumpToTrack, so loading the
canonical tail into the queue does not break shuffle order.
```

### Cross-platform contract (verified)

```txt
event name: onShuffleModeChange  (all three platforms)
payload:    { mode: number }     (0 = OFF, 1 = ON)
TS build:   pnpm -C packages/player build passes
```

### Slice D — Mobile integration (DONE, verified on Android and iOS Simulator)

Mobile now calls player shuffle APIs and no longer physically reorders the queue.

Changes:

```txt
business/playlist/shuffle.ts
  ~ setMode() now toggles @bilisound/player getShuffleMode/setShuffleMode
  ~ persists QUEUE_PLAYING_MODE only as a startup preference
  - removed physical shuffle/restore logic and iOS queue workaround

components/main-bottom-sheet/components/player-control-buttons.tsx
  + uses public useRepeatMode/useShuffleMode exports from @bilisound/player
  - removed @bilisound/player/build/hooks/useRepeatMode deep import
  - removed useQueuePlayingMode UI state source
  ~ random button aria-label now reflects ON/OFF state

business/playlist/handler/track-operations.ts
  - removed addToQueueListBackup writes when appending tracks
  ~ replaceQueueWithPlaylist resets shuffle via Player.setShuffleMode(OFF)

hooks/playlist-detail/usePlaylistPlayer.ts
  - removed duplicate QUEUE_IS_RANDOMIZED / QUEUE_PLAYING_MODE writes

app/apply-playlist.tsx
  - removed shuffle backup writes when adding tracks to current queue

storage/queue.ts
  - removed active QUEUE_LIST_BACKUP / QUEUE_IS_RANDOMIZED exports and backup helpers
  ~ QUEUE_PLAYING_MODE remains as persisted shuffle preference

business/playlist/handler/persistence.ts
  + re-applies Player.setShuffleMode(ON) on startup when QUEUE_PLAYING_MODE=shuffle
  + invokes cleanupLegacyShuffleKeys()

utils/migration/shuffle-queue.ts
  + removes legacy queue_list_backup / queue_is_randomized keys once
```

Persisted-data decision:

```txt
If old users exited while physical shuffle was enabled, their QUEUE_LIST already
contains the order they last saw. v3 preserves that order as the new canonical
queue to avoid reordering under the user. The exact historical shuffle order is
not preserved; when QUEUE_PLAYING_MODE=shuffle, player shuffle is re-applied on
startup with a freshly generated playback order and the current track kept first.
```

Android verification (SM S9380):

```txt
Observed startup crash root cause: ExpoModulesPackageList existed as generated
source but had not been compiled into the APK. Running
  ./gradlew :expo:generatePackagesList :expo:compileDebugKotlin --rerun-tasks
then rebuilding app-debug.apk fixed the dev-client startup crash.

Verified via agent-device + logcat:
  - app opens past splash and ReactNativeJS logs run
  - random button toggles Media3 shuffle:
      STATE_SHUFFLE_OFF -> STATE_SHUFFLE_ALL_TRACK
      STATE_SHUFFLE_ALL_TRACK -> STATE_SHUFFLE_OFF
  - while shuffle is ON, tapping next jumped #16 -> #22
  - queue tab still displayed canonical order (#13, #14, #15, #16, ...)
  - random button label updates between 开启随机播放 / 关闭随机播放
```

iOS Simulator verification (iPhone 17):

```txt
Build note:
  - first iOS build failed because ios/.xcode.env.local pointed to the removed
    /opt/homebrew/Cellar/node/26.0.0/bin/node
  - updating NODE_BINARY to the active /Users/tcdw/.proto/shims/node allowed
    EXPO_PUBLIC_ENV=development pnpm exec expo run:ios --device "iPhone 17" --no-bundler
    to build, install, and open the dev client

Verified via agent-device + iOS simulator app logs:
  - app opens past dev launcher and audio playback works
  - random button toggles UI state; snapshots exposed Toast text:
      随机模式开启
      随机模式关闭
  - while shuffle is ON, tapping next jumped #13 明日地球が滅ぶなら -> #18 ダブルバインド
  - after turning shuffle OFF, tapping next advanced #18 ダブルバインド -> #19 microser
  - iOS accessibility currently collapses the bottom sheet into a single node,
    so player controls were exercised by coordinates and verified through logs
```

### Slice E — Playback-order next index for cache prefetch (DONE, needs native device verification)

Mobile cache prefetch previously used `currentIndex + 1`. That was valid when shuffle physically reordered the public queue, but it became wrong after player-managed shuffle because canonical queue order and playback order diverged.

Changes:

```txt
types/module.ts
  + getNextTrackIndex(): Promise<number>

player.ts
  + getNextTrackIndex public wrapper

BilisoundPlayerModule.web.ts
  + getNextTrackIndex delegates to existing playback-order getNextIndex()

BilisoundPlayerModule.kt
  + getNextTrackIndex uses Media3 Timeline.getNextWindowIndex(..., REPEAT_MODE_OFF, shuffleModeEnabled)

BilisoundPlayerModule.swift
  + getNextTrackIndex delegates to existing nextIndexInOrder()

apps/mobile/business/playlist/handler/cache.ts
  ~ saveCurrentAndNextTrack() prefetches the player-reported next index instead of canonical index + 1
  ~ fixed next-track download title to use the next track rather than the current track
```

Design:

```txt
The public queue remains canonical. Playback-order lookup belongs in `@bilisound/player`
on every platform; app cache policy must not infer next from canonical index or native-engine
shuffle state. Mobile can still choose to prefetch current + next while the player-owned
queue manager decides which canonical index is next.
```

### Slice F — Preserve current index after Android current-item refresh (DONE, needs large-queue verification)

Large shuffle queues exposed a second Android-specific transition bug after Slice E: refreshing an uncached current track calls `replaceTrack(currentIndex, refreshedTrack)`, but Media3 may advance to the next shuffled media item when the currently playing item is replaced. In queues with many uncached items, every refresh could therefore trigger another transition and produce repeated random jumps.

Changes:

```txt
track-operations.ts
  + shouldRefreshTrack() centralizes the stale uncached-track predicate
  + playNextTrack() records whether UI next was requested while playing, then delegates shuffle choice to player.next()
  ~ refreshCurrentTrack() ignores stale replacements if the current track changed and lets Android repair current-item replacement before JS observes the transition

player-control-buttons.tsx
  ~ UI next button calls playNextTrack() so refresh can restore playback intent after Android reports isPlaying=false during the transition

BilisoundPlayerModule.kt / BilisoundPlaybackService.kt
  ~ replacing the current Android media item suppresses the transient replacement transition, seeks back to the same canonical index, and only then re-enables track-change events
  ~ Android shuffle mode now uses the same stable internal playback order as Web/iOS for next/prev/getNextTrackIndex instead of Media3 native shuffle
```

Design:

```txt
The player remains responsible for deciding shuffle next. The app only repairs the Android
current-item replacement side effect after refreshing the item that was already selected.
Android keeps Media3 native shuffle disabled and owns shuffle order in @bilisound/player so
previous/next remain reversible along one fixed shuffled sequence.
```

## Migration Impact on Mobile

After player shuffle API exists, mobile should remove physical queue shuffle logic from:

```txt
apps/mobile/business/playlist/shuffle.ts
```

The mobile app should call player shuffle APIs through a player adapter or future `features/playback` service.
