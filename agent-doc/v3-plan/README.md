# Bilisound v3 Plan

This directory records the current v3 refactor plan for Bilisound. The plan is intentionally split into handoff-sized documents because v3 is an epic-level technical improvement project, not a single coding session.

The current direction is to improve code organization, reduce cross-layer coupling, and fix several foundational abstractions before moving files into a feature-first layout.

## Long-Term Direction

The business refactor work is the prerequisite for a later UI rewrite.

The current mobile UI is tightly coupled to player mechanics, SQLite rows, SDK DTOs, storage keys, and route-level business orchestration. Rewriting the UI on top of those shapes would carry the same coupling into the new design. v3 should first separate playback, playlist, config, cache, Bilibili data, and player boundaries so a future UI can consume stable use-case APIs and view models.

After the business refactor epics are complete, the project can rebuild the app UI implementation. The v3 UI should preserve the useful product-level parts of the existing Bilisound design system, including its semantic roles, component concepts, and established interaction patterns, rather than treating the rewrite as a completely unrelated design system. Its visual language and component styling can still be substantially refreshed for a contemporary 2026 direction.

That later phase may re-evaluate Nativewind and gluestack-ui, including dropping them if they no longer fit the desired v3 UI architecture. UI technology replacement is intentionally a later decision, not part of the foundation refactor unless a small change is required to reduce business coupling. The current dark-mode implementation that mechanically reverses a palette is also not a v3 requirement; the UI rewrite should evaluate independently mapped semantic colors for each appearance instead.

Do not treat earlier NativeWind-to-StyleSheet migration work as a blanket v2 styling direction. Keep v2 styling changes narrow and pragmatic: use native styles when a concrete technical constraint requires it, such as `expo-router/ui` native tab layout, safe-area calculations, or image rendering paths that do not work reliably through `className`. Broad UI styling decisions belong to the later v3 redesign phase.

## Reading Order

1. [Context and Findings](./context-and-findings.md)
2. [Target Architecture](./target-architecture.md)
3. [Epic Breakdown](./epic-breakdown.md)
4. [Player Foundation](./player-foundation.md)
5. [Config Architecture](./config-architecture.md)
6. [Agent Handoff Guide](./agent-handoff-guide.md)

## Current Working Assumption

The first implementation priority is `packages/player`, not `apps/mobile`.

The mobile app currently compensates for player-level limitations in shuffle and queue operations. Moving those workarounds into a new `features/playback` directory would improve file organization, but it would not remove the underlying coupling. The player package should first expose a stable cross-platform abstraction for shuffle mode and queue transactions.

## Suggested Phases

```txt
Phase 1: Business Foundation
  Player Foundation
  Config Architecture
  Bilibili Data Boundary
  Playback Orchestration
  Playlist Domain
  Cache and Download

Phase 2: UI Rewrite Preparation
  freeze or document feature use-case APIs
  define view models consumed by UI
  audit remaining route/component imports from storage/sdk/player internals

Phase 3: UI Rewrite
  rebuild the app UI on top of v3 feature boundaries
  preserve useful Bilisound design-system semantics and component contracts
  refresh visual styling for the intended 2026 visual direction
  replace mechanical dark-palette reversal with independently mapped semantic colors if validated
  re-evaluate Nativewind and gluestack-ui
  keep business policy out of components
```

## Proposed v3 Feature Areas

```txt
features/
  bilibili/   # External Bilibili data and SDK boundary
  config/     # User settings, runtime policies, diagnostics flags
  cache/      # Audio/image cache, cache status, download scheduling
  player/     # App-side wrapper around @bilisound/player
  playback/   # Playback use-case orchestration
  playlist/   # Local playlist domain
```

The exact names may still change, but the boundaries are more important than the directory labels.

## Non-Goals

v3 should not blindly add product features.

v3 should not start with a large mechanical directory move.

v3 should not preserve every v2 internal shape for compatibility unless there is persisted data, shipped behavior, or a clear external consumer.
