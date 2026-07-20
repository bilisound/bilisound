# Epic Breakdown

This document splits Bilisound v3 into handoff-sized workstreams.

## Epic 1: Player Foundation

Scope:

```txt
packages/player
apps/mobile call sites only when needed for integration
```

Goals:

1. Add cross-platform shuffle mode abstraction.
2. Use Android Media3 native shuffle support.
3. Simulate shuffle order internally on iOS and Web.
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

## Epic 2: Config Architecture

Scope:

```txt
apps/mobile/store/settings.ts
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
  showPlaylistInGrid

DownloadConfig:
  downloadNextTrack

ResourceConfig:
  filterResourceURL
  useLegacyID

DiagnosticsConfig:
  debugMode
```

## Epic 3: Bilibili Data Boundary

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

## Epic 4: Playback Orchestration

Scope:

```txt
business/playlist/handler/*
business/playlist/shuffle.ts
hooks/playlist-detail/usePlaylistPlayer.ts
app-level playback flows
```

Goals:

1. Introduce `features/playback` as use-case orchestration.
2. Move playlist/player/cache/data/config coordination out of route files and playlist domain modules.
3. Remove mobile-level queue physical reordering for shuffle after player shuffle API exists.
4. Keep player mechanics in `features/player` or `@bilisound/player`.

## Epic 5: Playlist Domain

Scope:

```txt
storage/sqlite/playlist.ts
storage/sqlite/schema.ts playlist types
components/playlist-*
hooks/playlist-detail/*
app/(main)/(playlist)/*
```

Goals:

1. Put local playlist CRUD behind repositories.
2. Stop route files from importing SQLite storage directly.
3. Introduce playlist domain/view models where useful.
4. Split `SongItem` into storage-independent UI and feature-specific wrappers.

## Epic 6: Cache and Download

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

## Epic 7: UI Rewrite (after business foundation)

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

Non-goals for earlier epics:

```txt
Do not replace Nativewind or gluestack-ui as part of Player Foundation, Config,
Bilibili Data Boundary, Playback Orchestration, Playlist Domain, or Cache and
Download unless a local UI edit is necessary to remove business coupling.
```

## Suggested Execution Order

1. Player Foundation.
2. Config Architecture facade and migration design.
3. Bilibili Data Boundary sample on video detail.
4. Playback Orchestration after player APIs are available.
5. Playlist Domain migration.
6. Cache and Download migration.
7. UI Rewrite preparation and UI framework re-evaluation.

Some planning work can happen in parallel, but implementation should avoid changing player mechanics, playback orchestration, and playlist storage in the same patch.

The UI rewrite should also remain separate from the business foundation epics. Business work should make UI replacement possible; UI technology replacement should not drive or obscure the business boundary work.
