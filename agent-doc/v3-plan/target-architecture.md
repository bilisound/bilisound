# Target Architecture

This document describes the current v3 target boundaries. It is a planning document, not a final contract.

## Proposed Shape

```txt
app/
  # Expo Router routes and layout composition; should become a thin UI shell

features/
  bilibili/
    # External Bilibili data boundary and SDK adapter

  config/
    # User-facing settings, runtime policies, diagnostics flags

  cache/
    # Audio/image cache, cache status, download scheduling

  player/
    # App-side wrapper around @bilisound/player

  playback/
    # User-facing playback use cases and orchestration

  playlist/
    # Local playlist domain, repositories, hooks, UI

shared/
  # Optional future home for truly cross-feature UI, utils, platform helpers
```

The project may keep some existing shared directories during migration. The important part is dependency direction, not an immediate mechanical move.

## UI Rewrite Relationship

The target architecture is designed to make a later UI rewrite possible.

The current UI should not be treated as the long-term shape. During the business refactor, routes and components may continue to exist, but new boundaries should move durable behavior into feature use cases, repositories, adapters, and view models. The future UI rewrite should be able to replace screens and component libraries without re-implementing player mechanics, playlist persistence, Bilibili DTO mapping, config policy, or cache/download scheduling.

Nativewind and gluestack-ui are implementation details of the current UI. Their replacement should be evaluated during the UI rewrite phase after feature APIs are stable. Business refactor tasks should avoid depending on either library unless they are touching existing UI call sites only to remove coupling.

The UI rewrite is not intended to discard the existing Bilisound design system wholesale. Product-level semantics, component concepts, and interaction patterns should be retained where they remain useful, while implementation-specific Nativewind/Gluestack structures and visual styling may be replaced. The target is a refreshed 2026 visual language built on a recognizable Bilisound design system.

Appearance themes should be modeled through semantic roles. The current implementation's mechanically reversed dark palette is not a target constraint: light and dark appearances may map the same semantic roles to independently selected values. This keeps contrast and visual hierarchy intentional instead of assuming that numeric palette stops are symmetrical between appearances.

Target UI dependency rule:

```txt
UI -> feature hooks / use cases / view models
UI -/-> SQLite rows
UI -/-> @bilisound/sdk DTOs
UI -/-> @bilisound/player native API
UI -/-> storage keys or migration details
```

## Feature Responsibilities

### `features/bilibili`

Owns Bilibili external data access.

Responsibilities:

1. Own `@bilisound/sdk` imports.
2. Preserve direct/remote SDK switching.
3. Map SDK DTOs to app-owned models.
4. Build Bilibili URLs, referer URLs, image proxy inputs, and resource URL requests.

Initial app-owned models may include:

```txt
VideoMetadata
VideoEpisode
RemotePlaylist
MediaResource
```

### `features/config`

Owns persisted user settings and runtime policy access.

Responsibilities:

1. Separate appearance preferences from playback/download/network/diagnostics policy.
2. Provide narrow selectors and policy readers.
3. Handle migration from v2 `settings-store` persisted data.

### `features/cache`

Owns local cached resources.

Responsibilities:

1. Audio cache status and file paths.
2. Download scheduling and download state.
3. Future image cache support.
4. Cache cleanup and migration.

`cache` should not depend on `player`.

### `features/player`

Owns app-side interaction with `@bilisound/player`.

Responsibilities:

1. Provide a stable app adapter for player APIs.
2. Expose player hooks and controls.
3. Keep direct `@bilisound/player` imports contained.
4. Avoid playlist and Bilibili domain knowledge in low-level player adapters.

### `features/playback`

Owns user-facing playback use cases.

Responsibilities:

1. `playPlaylist`.
2. `playEpisode`.
3. Restore playback session.
4. Toggle shuffle/repeat playback modes through player APIs.
5. Coordinate playlist, player, cache, config, and Bilibili data.

`playback` owns orchestration. It should not implement native player mechanics, SQLite CRUD, SDK requests, or file-system download details.

### `features/playlist`

Owns local playlist domain.

Responsibilities:

1. Playlist CRUD and metadata.
2. Playlist detail query and editing.
3. Playlist import/update from Bilibili data.
4. Pure mapping from playlist records to app-level playable items.

## Dependency Direction

Suggested direction:

```txt
app -> features/*
ui components -> view models / feature hooks

playback -> player
playback -> playlist
playback -> cache
playback -> bilibili
playback -> config

playlist -> bilibili
playlist -> cache
playlist -> config

cache -> bilibili
cache -> config

player -> config

bilibili -> @bilisound/sdk
player adapter -> @bilisound/player
```

Forbidden or discouraged direction:

```txt
app -> storage
app -> @bilisound/player
app -> @bilisound/sdk
components -> storage schema types
components -> storage keys
components -> native player mechanics
features/bilibili -> playlist/player/playback
features/cache -> player/playback
shared -> features/*
```

## Model Boundary

v3 should avoid passing SDK DTOs, SQLite schema types, or player internal types through general UI.

Preferred model layers:

```txt
SDK DTO -> Bilibili app model -> use-case model -> view model
SQLite row -> Playlist model -> PlayableItem -> PlayerQueueTrack
@bilisound/player TrackData -> player adapter model -> playback model
```

The first useful intermediate models are:

```txt
VideoMetadata
PlayableItem
SongListItem
```

These should be introduced where they remove direct coupling. They do not need to be designed exhaustively at the start.
