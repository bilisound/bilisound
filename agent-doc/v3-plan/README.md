# Bilisound v3 Plan

This directory records the current v3 refactor plan for Bilisound. The plan is intentionally split into handoff-sized documents because v3 is an epic-level technical improvement project, not a single coding session.

The current direction is to improve code organization, reduce cross-layer coupling, and fix several foundational abstractions before moving files into a feature-first layout.

## Long-Term Direction

The business refactor work is the prerequisite for a later UI rewrite.

The current mobile UI is tightly coupled to player mechanics, SQLite rows, SDK DTOs, storage keys, and route-level business orchestration. Rewriting the UI on top of those shapes would carry the same coupling into the new design. v3 should first separate playback, playlist, config, cache, Bilibili data, and player boundaries so a future UI can consume stable use-case APIs and view models.

### UI Framework Replacement Is A Later Decision

This is the canonical statement of the rule; other documents in this directory reference it instead of restating it.

After the business refactor epics are complete, the project can rebuild the app UI from scratch. That later phase may re-evaluate Nativewind and gluestack-ui, including dropping them if they no longer fit the desired v3 UI architecture. UI technology replacement is intentionally a later decision, not part of the foundation refactor unless a small change is required to reduce business coupling.

Concretely: do not replace Nativewind or gluestack-ui while working on Player Foundation, Config, Bilibili Data Boundary, Playback Orchestration, Playlist Domain, or Cache and Download, unless a local UI edit is necessary to remove business coupling. Business work should make UI replacement possible; UI technology replacement should not drive or obscure the business boundary work.

Do not treat earlier NativeWind-to-StyleSheet migration work as a blanket v2 styling direction. Keep v2 styling changes narrow and pragmatic: use native styles when a concrete technical constraint requires it, such as `expo-router/ui` native tab layout, safe-area calculations, or image rendering paths that do not work reliably through `className`. Broad UI styling decisions belong to the later v3 redesign phase.

## Reading Order

1. [Context and Findings](./context-and-findings.md)
2. [Target Architecture](./target-architecture.md)
3. [Epic Breakdown](./epic-breakdown.md)
4. [Player Foundation](./player-foundation.md)
5. [Config Architecture](./config-architecture.md)
6. [UI Foundation](./ui-foundation.md)
7. [Phase 2 Audit](./phase-2-audit.md) — UI rewrite preparation: residual coupling + frozen API + Epic 7 admission criteria
8. [Agent Handoff Guide](./agent-handoff-guide.md)
9. [Epic 1 macOS / iOS Verification Handoff](./epic-1-macos-verification-handoff.md) — completed on iPhone 17 Simulator; retained as the reproducible verification record

## Current Working Assumption

Epics 1–6 (Player Foundation, Config Architecture, Bilibili Data Boundary, Playback
Orchestration, Playlist Domain, Cache and Download) are delivered. Phase 2 audit
(residual coupling closure + frozen feature API + Epic 7 admission criteria) is
recorded in [phase-2-audit.md](./phase-2-audit.md). All five admission criteria are
met; Epic 6 runtime verification passed on Android physical device (2026-08-25).
**Epic 7 (UI Rewrite) is ready to start.**

The isolated `packages/ui` design-system foundation may be developed in parallel because it does not consume current mobile business modules. Integrating it into screens remains part of the later UI rewrite and must wait for stable feature-facing APIs.

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
