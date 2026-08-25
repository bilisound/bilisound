# Phase 2 Audit — UI Rewrite Preparation

> Status: audit complete (2026-08-25). This is the Phase 2 preparation record between
> Epic 6 (delivered) and Epic 7 (UI Rewrite, not started).

Epic 6 delivered the last business-foundation boundary. Before Epic 7 rebuilds the UI,
Phase 2 must (a) confirm feature boundaries are stable at runtime, (b) audit remaining
direct imports from UI layers into storage / player / sdk / store / business, and
(c) freeze the feature use-case API surface so the UI rewrite has stable contracts to
consume. This file records (b) and (c); (a) is the Epic 6 runtime verification todo below.

## Feature Cross-Dependency Audit

All four feature boundaries respect the target dependency direction. No violations found.

```txt
features/cache     -/-> @bilisound/player, features/playback, features/player   OK
features/bilibili  -/-> features/playlist, features/playback, features/player   OK
features/playlist  -/-> features/playback, features/player                     OK
```

`@bilisound/sdk` is still imported only inside `features/bilibili` (Epic 3 holds).
`features/cache` does not read the player queue directly (Epic 6 Slice B parameterized
`keepKeys`).

## UI-Layer Residual Direct Imports

Audit scope: `app/`, `components/`, `hooks/`. Patterns matched against the forbidden
direction in [target-architecture.md](./target-architecture.md).

### 1. UI -> @bilisound/player (largest residual, ~13 sites)

Player hooks and controls are consumed directly across the player UI surface. There is
no `features/player` app-side wrapper yet (target architecture proposes one).

```txt
app/(main)/_layout.tsx                              toggle, useCurrentTrack, useIsPlaying, usePlaybackState
app/(main)/(playlist)/meta/[id].tsx                 import * as Player
components/song-item.tsx                             * as Player; useCurrentTrack, useIsPlaying, usePlaybackState
components/video-detail/PageMenu.tsx                pause
components/main-bottom-sheet/utils.tsx              type TrackData
components/main-bottom-sheet/components/player-control.tsx        useCurrentTrack
components/main-bottom-sheet/components/player-queue-list.tsx     jump, toggle, usePlaybackOrder, useQueue
components/main-bottom-sheet/components/player-control-menu.tsx   useCurrentTrack
components/main-bottom-sheet/components/player-progress-timer.tsx useCurrentTrack
components/main-bottom-sheet/components/player-control-buttons.tsx (multiple)
components/main-bottom-sheet/components/player-picture.tsx         useCurrentTrack
components/main-bottom-sheet/components/player-progress-bar.tsx    seek, useCurrentTrack
components/main-bottom-sheet/components/play-button-icon.tsx       useCurrentTrack, useIsPlaying
hooks/useProgressSecond.ts                           getProgress, PlaybackProgress
hooks/useDownloadMenuItem.ts                          type TrackData
```

Epic 1 made these player hooks stable and cross-platform. Whether a `features/player`
wrapper is introduced before Epic 7, or the stable hooks are accepted as the public
player surface during the UI rewrite, is an open decision. Either way, the UI rewrite
should not carry `import * as Player` or direct engine mechanics.

### 2. UI -> ~/store (Zustand, ~10 sites)

```txt
app/history.tsx, app/video/[id].tsx                 useHistoryStore        (history — has business semantics)
app/(main)/_layout.tsx, components/main-bottom-sheet/*  useBottomSheetStore (pure UI state)
components/error-toast-host.tsx                      useErrorMessageStore    (pure UI state)
components/main-bottom-sheet/components/player-control-menu.tsx  usePlaybackSpeedStore (business-ish)
components/main-bottom-sheet/components/speed-control-panel.tsx  usePlaybackSpeedStore
```

`bottom-sheet` and `error-message` are pure UI interaction state and may stay in a future
`shared/` or remain as-is. `history` and `playback-speed` carry business semantics and
should be absorbed into a feature (`features/playback` or a dedicated hook) before the UI
rewrite freezes view models.

### 3. UI -> ~/storage/playlist (2 sites, playback orchestration leaking)

```txt
app/(main)/(playlist)/playlist.tsx                  invalidateOnQueueStatus, PLAYLIST_ON_QUEUE, playlistStorage
components/main-bottom-sheet/components/player-control-buttons.tsx  usePlaylistRestoreLoopOnceFlag
```

These read the queue-ownership marker and the loop-restore flag directly from MMKV. They
are `features/playback` orchestration details. Small, well-scoped follow-up: expose
playback-owned selectors/hooks and stop UI from touching `~/storage/playlist`.

### 4. UI -> ~/business (4 sites, business/ has only 2 modules left)

```txt
app/barcode.tsx, app/(main)/index.tsx               resolveVideo, resolveVideoAndJump  (~/business/format)
app/settings/about.tsx, app/_layout.tsx            checkLatestVersion, downloadApk    (~/business/check-release)
```

`business/` now contains only `format.ts` (Bilibili URL parse + route jump) and
`check-release.ts` (version check + APK download). Neither has a feature home. Decide:
move `format` into `features/bilibili` (URL resolution) or `features/playback` (jump);
move `check-release` into `features/config` or a dedicated update module.

### No SDK / api leakage

`@bilisound/sdk` and `~/api` have zero hits in `app/`, `components/`, `hooks/`. Epic 3
holds cleanly.

## Frozen Feature Use-Case API

The public surfaces below are the contracts Epic 7 UI should consume. Changing them after
this point requires updating this file.

```txt
features/bilibili   getDownloadUrl, getFullRemotePlaylist, getMediaResource,
                    getOnlineMediaResourceUrl, getRemotePlaylist, getVideoImageUrl,
                    getVideoMetadata, getVideoUrl, resolveShortUrl
                    types: MediaResource, RemotePlaylist*, VideoMetadata, VideoEpisode, ...

features/config     useAppearanceConfig, usePlaylistViewConfig, useDownloadConfig,
                    useResourceConfig, useDiagnosticsConfig, useSettingsActions
                    getDownloadPolicy, getResourcePolicy, getDiagnosticsConfig
                    rehydrateSettings
                    types: AppearanceConfig, PlaylistViewConfig, DownloadConfig, ...

features/cache      getCacheAudioPath, getAudioCacheSize, cleanAudioCache
                    getCacheStatusKey, useCacheExists, isCacheExists, setCacheExists, deleteCacheStatus
                    addDownloadTask, downloadResource, downloadResourceNow, pickDownloadTask
                    useDownloadList
                    migrateCacheStatus
                    type DownloadItem

features/playback   playEpisode, playPlaylist, playNextTrack, appendPlaylistToCurrentQueue,
                    refreshTrack, refreshCurrentTrack
                    saveTrackData, loadTrackData
                    saveCurrentAndNextTrack, deleteCurrentTrackCache,
                    getAudioCacheSizeInfo, cleanOfflineAudioCache
                    toggleShuffleMode
                    registerPlaybackBackgroundEvents
                    usePlaylistPlayer

features/playlist   getPlaylistMetas, getPlaylistMeta, deletePlaylistMeta, setPlaylistMeta,
                    insertPlaylistMeta, getPlaylistDetail, deletePlaylistDetail, addToPlaylist,
                    syncPlaylistAmount, replacePlaylistDetail, quickCreatePlaylist,
                    exportPlaylist, exportAllPlaylist, clonePlaylist, deleteAllPlaylist,
                    importPlaylistBatch, updatePlaylist, openAddPlaylistPage
                    useApplyPlaylistDraft, usePlaylistEditor, usePlaylistSearch
                    clearApplyPlaylistDraft
                    types: PlayableItem, Playlist, PlaylistTrack, SongListItem,
                           PlaylistCreateInput, PlaylistUpdate, PlaylistExport, PlaylistImportPlan, ...
```

The player public hooks (`useCurrentTrack`, `useIsPlaying`, `usePlaybackState`,
`usePlaybackOrder`, `useQueue`, `seek`, `jump`, `toggle`, `pause`, `getProgress`,
`RepeatMode`, `ShuffleMode`, `setQueueWithOptions`, ...) are stable from Epic 1 but are
currently imported directly from `@bilisound/player`. A `features/player` wrapper decision
is open (see residual #1).

## Epic 6 Runtime Verification Todo

Epic 6 passed tsc / jest / eslint / android+web export, but has no device runtime record
unlike Epics 1, 3, 5. Scenarios to verify on Expo Dev Client (native) + Web:

```txt
native: download a track from song-item / download-button; observe progress + completion
native: cancel-all from download manager mid-download; confirm no orphaned files
native: delete current track cache from player menu; confirm placeholder + re-fetch
native: auto-cache next track (downloadNextTrack on) across track change
native: clean offline cache from settings/data; confirm queue tracks preserved
web:    open a track's download URL (web uses getDownloadUrl, no local scheduling)
```

Use the project Expo Dev Client (`moe.bilisound.app.dev`), not Expo Go.

## Epic 7 Admission Criteria

Epic 7 (UI Rewrite) is appropriate to start once:

1. Epic 6 runtime verification passes (above).
2. Residual #3 (UI -> ~/storage/playlist) is closed — small, well-scoped.
3. Residual #2 business-ish stores (history, playback-speed) have a feature home, or are
   explicitly deferred with a documented reason.
4. Residual #1 (player direct imports) has a decision: introduce `features/player`
   wrapper, or accept stable player hooks as the public surface for the UI rewrite.
5. Residual #4 (`business/format`, `business/check-release`) has a feature home or is
   explicitly moved to `shared/`.

Residual #1 and #4 can be decided as the first Epic 7 step rather than blocking, as long
as the decision is recorded here. Residual #2 and #3 are cheap enough to close before
starting the rewrite so view models do not inherit MMKV/store coupling.
