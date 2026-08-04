# Epic Breakdown

This document splits Bilisound v3 into handoff-sized workstreams.

## Status Overview

| Epic                      | Status        | Notes                                                                                                                                                    |
| ------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Player Foundation      | **Delivered** | player-owned occurrence order, transport routing, and atomic queue transaction; verified on iOS Simulator, physical Android, and Web                     |
| 2. Config Architecture    | **Delivered** | facade + consumer migration; storage-key split still open, see [config-architecture.md](./config-architecture.md#implementation-status-facade-delivered) |
| 3. Bilibili Data Boundary | **Delivered** | `features/bilibili` boundary; verified on Android and Web                                                                                                |
| 4. Playback Orchestration | **Delivered** | `features/playback` use-case boundary; see [below](#epic-4-playback-orchestration)                                                                       |
| 5. Playlist Domain        | **Delivered** | `features/playlist` boundary; Promise-based native/Web repository contract; verified on Android, Web, and with contract tests                            |
| 6. Cache and Download     | Planned       |                                                                                                                                                          |
| 7. UI Rewrite             | Planned       | requires Epics 1–6 boundaries to be stable                                                                                                               |

Delivered epics keep their full scope/goals below under **Delivered Epics** so the handoff
record stays in one place. Planned epics are listed under **Upcoming Epics**.

## Delivered Epics

### Epic 1: Player Foundation

> Status: **delivered and verified** — slices A–I complete in
> [player-foundation.md](./player-foundation.md#implementation-status), including the full iOS
> Simulator runtime matrix.

Scope:

```txt
packages/player
apps/mobile call sites only when needed for integration
```

Goals:

1. Add cross-platform shuffle mode abstraction.
2. Keep canonical-queue and shuffle playback-order management entirely inside `@bilisound/player`.
3. Treat Media3, AVQueuePlayer, and HTMLAudio as playback engines only: engine-generated random order is not authoritative, and next/previous/natural-end/external media controls resolve through the same player-owned order.
4. Add queue transaction capability for replacing queue while preserving index, position, and playback state.
5. Remove mobile reliance on `@bilisound/player/build/*` deep imports.
6. Export missing public hooks such as `useRepeatMode`.

Suggested deliverables:

```txt
ShuffleMode API
useShuffleMode hook
onShuffleModeChange event
setQueueWithOptions API
platform test matrix
```

This epic should happen before large mobile restructuring.

### Epic 2: Config Architecture

> Status: **delivered** (facade + consumer migration, see [config-architecture.md](./config-architecture.md#implementation-status-facade-delivered)); storage-key split still open.

Scope:

```txt
apps/mobile/features/config
apps/mobile/app/settings/*
settings consumers in business/components/init
```

Goals:

1. Classify settings by semantic domain.
2. Add config selectors and policy readers.
3. Preserve existing persisted user settings through migration.
4. Stop new code from importing `useSettingsStore` directly outside config internals.

Suggested categories:

```txt
AppearanceConfig:
  theme
  showYuruChara

PlaylistViewConfig:
  showPlaylistInGrid

DownloadConfig:
  downloadNextTrack

ResourceConfig:
  filterResourceURL
  useLegacyID

DiagnosticsConfig:
  debugMode
```

### Epic 3: Bilibili Data Boundary

> Status: **delivered** — `features/bilibili` is the sole application SDK boundary; verified on
> Android (video detail, playback, history, create playlist) and Web (metadata proxy, image proxy,
> download URLs, remote playlists).

Scope:

```txt
apps/mobile/api/bilisound.ts
@bilisound/sdk consumers
components/video-detail/*
app/video/[id].tsx
app/remote-list.tsx
app/download-web.tsx
```

Goals:

1. Move SDK usage behind `features/bilibili` or equivalent.
2. Convert SDK responses into app-owned models.
3. Stop UI components from accepting `GetMetadataResponse` directly.
4. Consolidate Bilibili URL construction and resource URL policy.

Suggested first sample:

```txt
video detail page
```

Implementation record:

```txt
client.ts   # Direct/remote SDK switching, resource policy and URL construction
mappers.ts  # SDK DTO -> app-owned VideoMetadata / RemotePlaylistPage / MediaResource
models.ts   # app-owned models consumed by routes, components, and business flows
index.ts    # public feature surface
```

Migrated consumers include video detail, description, browser download, remote playlists,
playlist synchronization, playback resource refresh, downloads, history, and image URLs.
`components/video-detail/*` now accepts `VideoMetadata` / `VideoEpisode`, never SDK DTOs.

The old `api/bilisound.ts` SDK facade and generic `business/constant-helper.ts` were removed;
`api/release.ts` retains only unrelated release metadata access. `getVideoUrl`, image proxy URLs,
online resource URLs, and the user resource policy are consolidated in the Bilibili feature.

Verification:

```txt
pnpm -C apps/mobile exec tsc --noEmit
pnpm -C apps/mobile exec jest business/__tests__/download.test.ts features/bilibili/__tests__/mappers.test.ts --runInBand
git diff --check -- apps/mobile pnpm-lock.yaml agent-doc/v3-plan
```

All passed. The mapper test covers metadata, remote playlist pagination, and media-resource
mapping so API DTO changes cannot silently re-enter the UI boundary.

Post-delivery review fixed a cancellation regression in the migrated download flow:
`downloadResource` now rechecks task membership after asynchronous media-resource resolution and
before creating `DownloadResumable`. The download regression test proves that cancellation during
resource resolution starts no network/file download.

Coupling reduced:

```txt
routes/components/business -/-> @bilisound/sdk DTOs
routes/components/business -/-> direct SDK calls
routes/components/business -/-> duplicate Bilibili image/resource URL construction
```

## Upcoming Epics

### Epic 4: Playback Orchestration

> Status: **delivered** — `features/playback` is the playback use-case boundary; the app no
> longer imports `business/playlist/handler` and the remaining `business/playlist`
> modules are playlist-domain files only (`misc.ts`, `update.ts`, Epic 5 scope).

Scope (as executed):

```txt
business/playlist/handler/*        -> features/playback/* (track operations, persistence, cache, track data)
business/playlist/shuffle.ts       -> features/playback/shuffle.ts (toggleShuffleMode)
hooks/playlist-detail/usePlaylistPlayer.ts -> features/playback/use-playlist-player.ts
app-level playback flows           -> features/playback/background.ts + route consumer updates
```

Goals:

1. Introduce `features/playback` as use-case orchestration.
2. Move playlist/player/cache/data/config coordination out of route files and playlist domain modules.
3. Remove mobile-level queue physical reordering for shuffle after player shuffle API exists. (done in Epic 1 Slice D)
4. Keep player mechanics in `features/player` or `@bilisound/player`.

Implementation record:

```txt
features/playback/index.ts                # public use-case surface
features/playback/track-operations.ts     # playEpisode / playPlaylist / playNextTrack /
                                          #   refreshTrack / refreshCurrentTrack /
                                          #   appendPlaylistToCurrentQueue
features/playback/queue-persistence.ts    # loadTrackData + public saveTrackData re-export
features/playback/queue-snapshot.ts       # saveTrackData current queue snapshot
features/playback/cache.ts                # saveCurrentAndNextTrack / deleteCurrentTrackCache
features/playback/shuffle.ts              # toggleShuffleMode (player API + persisted preference)
features/playback/background.ts           # registerPlaybackBackgroundEvents (was app/_layout.tsx)
features/playback/use-playlist-player.ts  # usePlaylistPlayer hook (was hooks/playlist-detail/)
features/playback/track-data.ts           # queue preprocessing + playlistToTracks (internal)
features/playback/types.ts                # legacy TrackDataOld (internal)
```

Renames:

```txt
addTrackFromDetail      -> playEpisode
replaceQueueWithPlaylist -> playPlaylist
setMode (shuffle)       -> toggleShuffleMode
```

`appendPlaylistToCurrentQueue` is a new use case extracted from the `apply-playlist`
route flow (append playlist rows to the current queue when the queue belongs to that
playlist). Routes no longer call `@bilisound/player` for queue/playback flows;
`app/_layout.tsx` keeps only `registerPlaybackBackgroundEvents()` wiring.

Queue replacement confirmation follows the queue ownership marker:

```txt
non-empty queue with PLAYLIST_ON_QUEUE.value -> clean playlist-owned queue;
                                                 switching to any playlist replaces directly
non-empty queue without PLAYLIST_ON_QUEUE.value -> tainted/manual queue;
                                                    replacing requires confirmation
empty queue                                      -> replaces directly
```

An owned queue is only appended when its playlist id matches the target playlist. After a
successful append, `saveTrackData` persists the updated queue immediately instead of relying on
native track-change events.

Deleted:

```txt
business/playlist/handler/*
business/playlist/shuffle.ts
hooks/playlist-detail/usePlaylistPlayer.ts
```

Verification:

```txt
pnpm -C apps/mobile exec tsc --noEmit
EXPO_PUBLIC_ENV=development pnpm -C apps/mobile exec expo export --platform android --clear
pnpm -C apps/mobile exec eslint <changed files>
pnpm -C apps/mobile exec jest features/bilibili/__tests__/mappers.test.ts --runInBand
git diff --check -- apps/mobile agent-doc/v3-plan
```

All passed (eslint clean after merging the duplicate `~/features/playback` import).

Coupling reduced:

```txt
routes/components/business -/-> business/playlist/handler
routes -/-> direct @bilisound/player calls for playback flows (layout background listener,
           apply-playlist queue append, video detail play episode)
route-level playback orchestration -/-> kept outside features/playback
```

### Epic 5: Playlist Domain

> Status: **delivered** — `features/playlist` is the playlist domain boundary; routes,
> components, playback, and exchange utils no longer import `storage/sqlite/playlist` or
> `storage/sqlite/schema` playlist types directly.

Scope (as executed):

```txt
storage/sqlite/playlist.ts          -> features/playlist/repository.ts (re-export facade)
storage/sqlite/playlist.web.ts      -> features/playlist/repository.web.ts
storage/sqlite/schema playlist types -> features/playlist/models.ts (re-export boundary)
business/playlist/update.ts         -> features/playlist/update.ts
business/playlist/misc.ts           -> features/playlist/misc.ts
hooks/playlist-detail/*             -> features/playlist/use-playlist-editor.ts, use-playlist-search.ts
```

Goals:

1. Put local playlist CRUD behind repositories. ✓
2. Stop route files from importing SQLite storage directly. ✓
3. Introduce playlist domain/view models where useful. ✓ (type re-exports as boundary; future split point)
4. Split `SongItem` into storage-independent UI and feature-specific wrappers. (deferred — component still accepts `PlaylistDetail` via feature boundary type, not raw schema)

Implementation record:

```txt
features/playlist/index.ts              # public feature surface
features/playlist/models.ts             # domain types (re-export from schema, single mapping point)
features/playlist/repository-contract.ts # shared Promise-based repository API
features/playlist/repository.ts         # native repository adapter + transactional import
features/playlist/repository.web.ts     # Web repository adapter + awaited IndexedDB writes
features/playlist/update.ts             # upstream playlist sync (was business/playlist/update.ts)
features/playlist/misc.ts               # openAddPlaylistPage navigation helper
features/playlist/use-playlist-editor.ts # playlist detail editing hook
features/playlist/use-playlist-search.ts # playlist detail search hook
features/playlist/__tests__/repository.test.ts # shared native/Web repository contract tests
```

Deleted:

```txt
business/playlist/update.ts
business/playlist/misc.ts
business/playlist/ (directory removed)
hooks/playlist-detail/usePlaylistEditor.ts
hooks/playlist-detail/usePlaylistSearch.ts
hooks/playlist-detail/ (directory removed)
```

Verification:

```txt
pnpm -C apps/mobile exec tsc --noEmit   # clean
pnpm -C apps/mobile exec jest features/playlist/__tests__/repository.test.ts \
  features/playback/__tests__/track-operations.test.ts --runInBand   # 11 tests clean
EXPO_PUBLIC_ENV=development pnpm -C apps/mobile exec expo export --platform web --clear
EXPO_PUBLIC_ENV=development pnpm -C apps/mobile exec expo export --platform android --clear
Android 真机（22122RK93C, Expo Dev Client）验证 2026-08-04:
  - 歌单列表 / 详情 / 搜索过滤（usePlaylistSearch）/ 长按编辑（usePlaylistEditor）
  - 复制到新歌单（openAddPlaylistPage / apply-playlist）
  - 修改歌单信息 / 创建解绑副本（clonePlaylist 持久化 168 首）
  - 删除歌单（deletePlaylistMeta 级联删除详情）
  - 顺带修复既有缺陷：列表页长按 imgUrl=null 歌单崩溃
    （playlist.tsx LongPressActions 的 displayTrack.imgUrl! 非空断言 → 加空值保护）
```

The repository follow-up on 2026-08-04 made every public operation Promise-based on both
platforms. Missing metadata is normalized to `[]`, cloning a missing playlist rejects, and
playlist replacement/import callers await persistence before reporting success.

Coupling reduced:

```txt
routes/components/playback/exchange -/-> storage/sqlite/playlist direct imports
routes/components/playback/exchange -/-> storage/sqlite/schema playlist type imports
business/playlist/ directory eliminated — logic lives in features/playlist
hooks/playlist-detail/ directory eliminated — hooks live in features/playlist
```

Remaining allowed `storage/sqlite/schema` references:

```txt
features/playlist/models.ts       — boundary mapping point (by design)
features/playlist/repository.ts   — internal implementation detail
features/playlist/repository.web.ts — internal implementation detail
features/theme/storage.ts         — different table (themeProfile), not playlist concern
utils/migration/playlist.ts       — legacy one-time DB migration, acceptable internal use
```

### Epic 6: Cache and Download

> Status: planned.

Scope:

```txt
business/download.ts
store/download.ts
storage/cache-status.ts
hooks/useDownloadMenuItem.ts
business/playlist/handler/cache.ts
```

Goals:

1. Move download scheduling out of Zustand store actions.
2. Separate audio cache from future image cache concerns.
3. Provide cache status repositories and hooks.
4. Keep cache independent from player.

### Epic 7: UI Rewrite (after business foundation)

> Status: planned.

Scope:

```txt
packages/ui
apps/mobile/app/*
apps/mobile/components/*
feature-facing UI wrappers and view models
current UI framework usage such as Nativewind and gluestack-ui
```

Prerequisite:

```txt
Epics 1-6 should provide stable enough feature boundaries that UI screens do not
need to import player internals, SDK DTOs, SQLite rows, storage keys, or download
scheduler details directly.
```

Goals:

1. Rebuild the app UI on top of v3 feature use cases and view models.
2. Keep business policy out of route files and presentational components.
3. Re-evaluate Nativewind and gluestack-ui after business boundaries are stable.
4. Preserve user-visible playback, playlist, settings, cache, and import/export behavior.
5. Use the rewrite to improve accessibility instead of carrying forward the current collapsed control tree.

Parallel preparation:

```txt
packages/ui may establish design tokens, recipes, public component contracts, and
an isolated Expo showcase before Epics 1-6 finish. It must not use that work as a
reason to migrate v2 screens before their feature-facing APIs are stable.
```

Non-goals for earlier epics: see the UI technology rule in [README.md](./README.md).

## Suggested Execution Order

1. Player Foundation. — **done**
2. Config Architecture facade and migration design. — **done**
3. Bilibili Data Boundary sample on video detail. — **done**
4. Playback Orchestration after player APIs are available. — **done**
5. Playlist Domain migration. — **done**
6. Cache and Download migration.
7. UI Rewrite preparation and UI framework re-evaluation.

Some planning work can happen in parallel, but implementation should avoid changing player mechanics, playback orchestration, and playlist storage in the same patch.
