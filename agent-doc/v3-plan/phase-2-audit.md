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

### 1. UI -> @bilisound/player — **closed** (2026-08-25)

Resolved by introducing `apps/mobile/features/player/index.ts` as the app-side wrapper.
All 15 UI-layer import sites (routes, components, hooks) now import from
`~/features/player`; zero `@bilisound/player` references remain in `app/`,
`components/`, or `hooks/`.

```txt
features/player/index.ts   # curated re-export of @bilisound/player public API
                           # future app-side semantics (telemetry, error boundary,
                           # view model mapping) live here, not in the player package
```

The wrapper is currently a curated `export *` re-export. This deliberately keeps a single
app-side import seam so future player API changes or app-side instrumentation touch one
module. `features/playback` continues to import `@bilisound/player` directly because it is
the legitimate player orchestration boundary (target architecture allows
`playback -> player`).

Epic 7 may later narrow this surface to a handpicked view-model API instead of a full
re-export; the import seam is now stable enough to do that without a broad refactor.

### 2. UI -> ~/store (Zustand) — **closed for business-ish stores** (2026-08-25)

`history` and `playback-speed` carried business semantics and are now absorbed into
`features/playback`. `bottom-sheet` and `error-message` remain pure UI interaction state
and are explicitly deferred (see decision below).

```txt
features/playback/history.ts          # usePlaybackHistory() + appendPlaybackHistory() + HistoryItem
features/playback/playback-speed.ts   # usePlaybackSpeed()
features/playback/index.ts            # re-exports the above
```

Consumers migrated:
```txt
app/history.tsx                                   usePlaybackHistory()
app/video/[id].tsx                                appendPlaybackHistory() (non-reactive, event callback)
components/main-bottom-sheet/components/speed-control-panel.tsx   usePlaybackSpeed()
components/main-bottom-sheet/components/player-control-menu.tsx   usePlaybackSpeed()
```

Persisted data stable: history zustand persist name `history-store` and `createStorage`
unchanged; the store file moved into the feature but the persisted shape is identical.
`playback-speed` was in-memory only, no migration needed.

Deferred (pure UI interaction state, no business semantics):
```txt
~/store/bottom-sheet.ts     # bottom-sheet open/close state; stays until shared/ exists
~/store/error-message.ts    # transient toast message; stays until shared/ exists
```
These two are acceptable for Epic 7 to consume via a `shared/` wrapper or to leave as
localized UI state; they do not leak business policy into UI.

### 3. UI -> ~/storage/playlist — **closed** (2026-08-25)

Resolved by adding `features/playback/queue-ownership.ts` and exposing
`getQueueOwnerPlaylistId`, `invalidateQueueOwnership`, and
`usePlaylistRestoreLoopOnceFlag` from the playback surface. The two UI sites now
import from `~/features/playback`; zero `~/storage/playlist` references remain in
`app/`, `components/`, or `hooks/`.

```txt
features/playback/queue-ownership.ts  # owns queue-ownership marker + loop-restore flag
features/playback/index.ts            # re-exports the three symbols
```

Persisted data stable: `playlist_on_queue` key, `storage-playlist` MMKV id, and
`{ value?: { id } }` JSON shape unchanged. `features/playback` internals
(`track-operations`, `cache`) still consume `~/storage/playlist` directly as the
legitimate orchestration boundary.

### 4. UI -> ~/business — **closed** (2026-08-25)

`business/format.ts` and `business/check-release.ts` found feature homes; the `business/`
directory is deleted entirely. Zero `~/business/*` references remain in `app/`,
`components/`, or `hooks/`.

```txt
features/bilibili/url-resolver.ts  # resolveVideo + resolveVideoAndJump + UserListParseResult
features/bilibili/index.ts          # re-exports the above
features/config/release.ts         # checkLatestVersion + downloadApk + CheckLatestVersionReturns
features/config/index.ts           # re-exports the above
```

Rationale:
- `format` resolves Bilibili URLs/IDs and jumps to the matching route. URL resolution is
  the Bilibili data boundary's job; the jump follows the `features/playlist/openAddPlaylistPage`
  navigation-helper precedent (a feature may own a route jump for results it understands).
- `check-release` is app-level runtime capability (version check + APK install), placed
  under `features/config` alongside diagnostics. It still consumes `~/api/release`
  (server-cf `/internal/app/update`) as its data source; moving that client is out of
  scope here.

Consumers migrated:
```txt
app/barcode.tsx, app/(main)/index.tsx           resolveVideo/resolveVideoAndJump -> ~/features/bilibili
app/settings/about.tsx, app/_layout.tsx         checkLatestVersion/downloadApk -> ~/features/config
components/check-update-dialog.tsx              CheckLatestVersionReturns -> ~/features/config
```

### No SDK / api leakage

`@bilisound/sdk` has zero hits in `app/`, `components/`, `hooks/` (Epic 3 holds).
`~/api/release` is now consumed only inside `features/config/release.ts` (the application
update metadata client); it is no longer reached directly from UI layers.

## Frozen Feature Use-Case API

The public surfaces below are the contracts Epic 7 UI should consume. Changing them after
this point requires updating this file.

```txt
features/bilibili   getDownloadUrl, getFullRemotePlaylist, getMediaResource,
                    getOnlineMediaResourceUrl, getRemotePlaylist, getVideoImageUrl,
                    getVideoMetadata, getVideoUrl, resolveShortUrl
                    resolveVideo, resolveVideoAndJump
                    types: MediaResource, RemotePlaylist*, VideoMetadata, VideoEpisode,
                           UserListParseResult, ...

features/config     useAppearanceConfig, usePlaylistViewConfig, useDownloadConfig,
                    useResourceConfig, useDiagnosticsConfig, useSettingsActions
                    getDownloadPolicy, getResourcePolicy, getDiagnosticsConfig
                    checkLatestVersion, downloadApk
                    rehydrateSettings
                    types: AppearanceConfig, PlaylistViewConfig, DownloadConfig,
                           CheckLatestVersionReturns, ...

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
                    getQueueOwnerPlaylistId, invalidateQueueOwnership,
                    usePlaylistRestoreLoopOnceFlag
                    usePlaybackSpeed
                    usePlaybackHistory, appendPlaybackHistory
                    type HistoryItem

features/player     app-side wrapper re-exporting @bilisound/player public API
                    (useCurrentTrack, useIsPlaying, usePlaybackState, usePlaybackOrder,
                    useQueue, useRepeatMode, useShuffleMode, seek, jump, toggle, prev,
                    next, pause, getProgress, getRepeatMode, setRepeatMode,
                    RepeatMode, ShuffleMode, TrackData, PlaybackProgress, ...)
                    UI imports from here, not from @bilisound/player.

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

The player public surface is stable from Epic 1 and now reached via `features/player`.
Epic 7 may narrow this re-export to a handpicked view-model API. `features/playback`
still imports `@bilisound/player` directly as the legitimate orchestration boundary.

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
2. ~~Residual #3 (UI -> ~/storage/playlist) is closed~~ — **closed**.
3. ~~Residual #2 business-ish stores (history, playback-speed) have a feature home~~ — **closed**;
   `bottom-sheet` and `error-message` explicitly deferred as pure UI state.
4. ~~Residual #1 (player direct imports) has a decision~~ — **closed**: `features/player`
   wrapper introduced; UI imports from `~/features/player`, no direct `@bilisound/player`
   in `app/`/`components/`/`hooks/`. Epic 7 may later narrow the re-export to a view-model
   API.
5. ~~Residual #4 (business/format, business/check-release) has a feature home~~ — **closed**;
   `business/` directory deleted.

Only #1 (Epic 6 runtime verification) remains open. All four UI-layer residual couplings
(#1 player, #2 store, #3 storage/playlist, #4 business) are closed; UI no longer imports
`@bilisound/player`, `~/store/*` (business-ish), `~/storage/*`, or `~/business/*` directly.
