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

This epic was delivered in slices so native implementation and verification could remain independently traceable.

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

Native and Web runtime verification was completed in later slices and is recorded in their
platform evidence sections below.

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
Android enables Media3 shuffle traversal with @bilisound/player's custom ShuffleOrder;
Media3's generated random order is never authoritative.
```

### Slice C — iOS (AVQueuePlayer simulated shuffle order) (DONE; superseded design verified)

The original implementation below was later superseded by the occurrence-token manager in
Slice G. The current iOS implementation is verified in the Slice G–I completion record below.

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

### Slice E — Playback-order next index for cache prefetch (DONE, verified on Android and iOS Simulator)

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
  + getNextTrackIndex delegates to the player-owned PlaybackOrderManager
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

### Slice F — Preserve current index after Android current-item refresh (DONE, verified on Android)

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
Android replaces Media3's generated random order with @bilisound/player's custom
ShuffleOrder, so previous/next remain reversible along one fixed shuffled sequence.
```

Android unit coverage preserves the occurrence order across replacement, and physical
large-queue navigation completed without a replacement-triggered extra transition.

### Slice G — Player-owned occurrence manager (DONE)

Shuffle order no longer uses business media ids. Each platform now owns queue-occurrence
tokens inside `@bilisound/player`, so duplicate tracks remain distinct and queue replacement
can rebuild a valid playback order while shuffle stays enabled.

Changes:

```txt
src/playback-order-manager.ts
android/.../PlaybackOrderManager.kt
ios/PlaybackOrderManager.swift
  + canonical occurrence tokens independent from TrackData.id / MediaItem.mediaId
  + stable playback order with current occurrence first
  + reset / insert / remove mutation handling
  + next / previous / first canonical-index lookup

BilisoundPlayerModule.web.ts / BilisoundPlayerModule.kt / BilisoundPlayerModule.swift
  ~ setQueue rebuilds playback order when shuffle is already enabled
  ~ queue insert/delete operations update occurrence state
  ~ replaceTrack preserves the existing occurrence token
  - removed track-id-based shuffle order lookup
```

Contract coverage:

```txt
duplicate media entries are separate queue occurrences
current occurrence remains first when enabling or rebuilding shuffle
each occurrence is visited exactly once per cycle
insertion and removal preserve unaffected occurrence identity
shuffle-off lookup follows canonical neighbors
```

Verification:

```txt
pnpm -C packages/player build
pnpm -C packages/player test -- --runInBand src/__tests__/playback-order-manager.test.ts
pnpm exec ./gradlew :bilisound-player:compileDebugKotlin
pnpm exec ./gradlew :bilisound-player:testDebugUnitTest --tests moe.bilisound.player.PlaybackOrderManagerTest
pnpm -C apps/mobile exec tsc --noEmit
```

TypeScript, Web, Android, and iOS checks passed. The current occurrence contract is integrated
into all three implementations; native iOS compilation and runtime evidence is recorded in
the Slice G–I completion record below.

### Slice H — Android transport integration (DONE, verified on a physical device)

Android now exposes the player-owned occurrence order to Media3 as an immutable custom
`ShuffleOrder`. Media3's shuffle-enabled flag selects that order; Media3 does not generate
the order itself. Canonical-index seeks, natural completion, notification controls,
headset controls, and MediaSession next/previous all traverse the same occurrence sequence.

Changes:

```txt
android/.../PlaybackOrderManager.kt
  ~ implements Media3 ShuffleOrder
  + immutable cloneAndInsert / cloneAndRemove / cloneAndClear / cloneAndSet support

android/.../services/BilisoundPlaybackService.kt
  + owns and installs the active PlaybackOrderManager on ExoPlayer
  ~ current-item replacement preserves the installed occurrence order

android/.../BilisoundPlayerModule.kt
  ~ queue mutations synchronize the occurrence manager
  ~ setShuffleMode rebuilds or canonicalizes the installed order
  ~ next / previous / getNextTrackIndex resolve through the installed order
```

Physical Android verification (`22122RK93C`, Android 14):

```txt
canonical current: 【染云】深昏睡
canonical next:    台湾云林县官方宣传影片「星期六去斗六」
shuffle next:      用17个歌手的声音唱「米津玄師 - さよーならまたいつか！」
app next/previous: 深昏睡 <-> 用17个歌手的声音唱...
MEDIA_NEXT/PREVIOUS:
                   深昏睡 <-> 用17个歌手的声音唱...
natural end:       深昏睡 -> 用17个歌手的声音唱...
```

The explicit next target was not the canonical neighbor. App controls, injected system
media key events, and natural completion all selected that same non-canonical occurrence,
proving these entry points consumed one stable order.

### Slice I — Atomic queue transaction (DONE)

Queue replacement now has one public cross-platform transaction:

```txt
setQueueWithOptions(tracks, {
  beginIndex?: number,             // canonical index, default 0
  position?: number,               // seconds, default 0
  preservePlaybackState?: boolean, // default false
})
```

The wrapper validates the complete request before invoking a platform implementation.
Web, Android, and iOS replace the canonical queue, select the requested occurrence,
rebuild playback order, set progress, and optionally restore playing intent inside one
platform operation. Existing `setQueue(tracks, beginIndex)` remains the paused,
zero-position convenience API implemented through this transaction.

Mobile integration:

```txt
features/playback/queue-persistence.ts
  ~ startup restore uses setQueueWithOptions(..., preservePlaybackState: false)

features/playback/track-operations.ts
  ~ playlist replacement uses setQueueWithOptions(..., preservePlaybackState: false)
```

Verification:

```txt
pnpm -C packages/player test -- --runInBand          # 2 suites, 9 tests
pnpm -C packages/player build
pnpm -C apps/mobile exec tsc --noEmit
pnpm exec ./gradlew :bilisound-player:compileDebugKotlin
pnpm exec ./gradlew :bilisound-player:testDebugUnitTest \
  --tests moe.bilisound.player.PlaybackOrderManagerTest
pnpm -C apps/mobile exec expo run:android --no-bundler
```

On the physical Android device, a persisted queue was restored through the new
transaction with its canonical current track selected, playback paused, and shuffle
preference reapplied. The Web app also started and rendered without console or page
errors after the transaction implementation changed.

### iOS completion verification (iPhone 17 Simulator, iOS 26.5; 2026-08-02)

Environment:

```txt
Xcode 26.6 (17F113)
Node v24.18.0
pnpm 11.7.0
iPhone 17 Simulator, iOS 26.5
UDID 92D5EE1F-762A-418A-B16C-03B396F0EAC4
```

Passing commands:

```txt
pnpm install --frozen-lockfile
pnpm -C packages/player test -- --runInBand
  2 suites, 9 tests passed
pnpm -C packages/player build
pnpm -C apps/mobile exec tsc --noEmit
EXPO_PUBLIC_ENV=development pnpm -C apps/mobile exec expo run:ios \
  --device 92D5EE1F-762A-418A-B16C-03B396F0EAC4 --no-bundler
```

Observed through the rebuilt Expo Dev Client:

```txt
- A five-occurrence canonical queue contained duplicate business media at positions 1 and 5;
  one shuffled cycle visited all five occurrences exactly once. A sixth occurrence inserted
  while shuffled remained reachable; metadata replacement preserved the occurrence, and
  removal kept traversal reversible.
- Enabling shuffle while paused preserved the current occurrence and progress. Toggling it
  while playing preserved playing intent. Disabling it resumed canonical traversal.
- A shuffled explicit next moved canonical #1 みくみくにしてあげる -> #4 卑怯戦隊うろたんだー,
  rather than canonical #2. Previous returned to the prior occurrence.
- Natural completion moved 卑怯戦隊うろたんだー -> みくみくにしてあげる, matching the
  previously recorded explicit next target. Repeat ONE repeated メルト; Repeat ALL wrapped
  the shuffled order.
- System MediaRemote next/previous commands traversed the same occurrence order as app
  controls. The Simulator Control Center had no Music/Now Playing tile to press directly,
  so MRMediaRemoteSendCommand was dispatched from a signed helper retained under .temp/.
- Startup restoration selected the persisted canonical occurrence, remained paused, and
  reapplied shuffle. Playlist replacement at canonical index 2 exposed all six canonical
  occurrences, selected メルト, and reported queue count 6 / queue index 2 through
  MPNowPlayingInfoCenter.
```

The runtime pass found and fixed two iOS integration failures in
`ios/BilisoundPlayerModule.swift`:

```txt
- getCurrentTrackIndex now resolves -1 when no item is active, matching the other platforms
  and preventing an unhandled startup PLAYER_ERROR.
- next now resolves as a no-op at the end of the playback order instead of rejecting,
  matching Android/Web transport semantics.
```

Evidence is retained under `.temp/epic1-ios-20260802/`. Physical hardware and a real headset
button were not exercised; the Simulator MediaRemote handler path was exercised directly.

## Migration Impact on Mobile

After player shuffle API exists, mobile should remove physical queue shuffle logic from:

```txt
apps/mobile/business/playlist/shuffle.ts
```

The mobile app should call player shuffle APIs through a player adapter or future `features/playback` service.
