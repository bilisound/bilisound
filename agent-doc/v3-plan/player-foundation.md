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

The player package should expose a cross-platform shuffle abstraction:

```txt
Android:
  use Media3 native shuffle support

iOS/Web:
  simulate shuffle order inside @bilisound/player

mobile app:
  call setShuffleMode / toggleShuffleMode
  do not physically reorder queue for shuffle
```

The app should own shuffle policy only where it is product-specific. The player should own queue mechanics and platform differences.

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

Android should use Media3 native shuffle where possible.

Expected implementation area:

```txt
packages/player/android/src/main/java/moe/bilisound/player/BilisoundPlayerModule.kt
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

## Migration Impact on Mobile

After player shuffle API exists, mobile should remove physical queue shuffle logic from:

```txt
apps/mobile/business/playlist/shuffle.ts
```

The mobile app should call player shuffle APIs through a player adapter or future `features/playback` service.
