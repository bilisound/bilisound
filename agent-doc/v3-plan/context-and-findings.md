# Context and Findings

This document summarizes the coupling findings that motivated the Bilisound v3 planning work.

## Background

Bilisound v2 already has recognizable modules such as `app`, `components`, `business`, `storage`, `store`, `api`, and package-level `@bilisound/player` / `@bilisound/sdk` boundaries. The main issue is not that no structure exists. The issue is that several high-impact capabilities are reachable from too many layers.

The most visible examples are player operations, SDK response types, storage schema types, settings state, and download/cache orchestration.

## High-Confidence Findings

1. `@bilisound/player` leaks into many layers.

   Direct player usage appears in route files, components, hooks, business logic, store logic, and storage helpers. This makes player API changes expensive and forces UI/business code to know platform limitations.

2. `business/playlist/handler/*` is an application-service hotspot.

   The module name suggests playlist handling, but the implementation coordinates metadata fetching, resource URL resolution, cache checks, queue replacement, player mutation, settings reads, error reporting, and persistence. It is closer to playback orchestration than playlist domain logic.

3. Shuffle is modeled as physical queue mutation in mobile app code.

   `apps/mobile/business/playlist/shuffle.ts` currently uses `getTracks`, `deleteTracks`, `addTracks`, `jump`, and `seek` to emulate shuffle/restore. This shape appears to be a compromise for iOS rather than a product-level model. Android Media3 ExoPlayer supports native shuffle, so the cross-platform abstraction should live in `@bilisound/player`.

4. SDK DTOs reach UI components.

   `components/video-detail/*` uses `GetMetadataResponse` and derived page item types. This makes UI components depend on SDK response shape instead of app-owned models.

5. UI components depend on storage schema types.

   `components/song-item.tsx` accepts `PlaylistDetail` from SQLite schema. Call sites that do not naturally have `PlaylistDetail` must manually construct placeholder fields.

6. Settings are mixed by storage location and semantic level.

   `store/settings.ts` stores appearance preferences, download behavior, resource request policy, and diagnostics flags in one persisted Zustand store. Multiple UI and business modules directly read `useSettingsStore` or `useSettingsStore.getState()`.

7. Store actions contain domain/service logic.

   `store/download.ts` includes a task scheduler in `pickTask()`. `store/history.ts` includes history de-duplication, move-to-front, and max-size policy. These are useful rules, but their current location blurs state mutation and business policy.

## Positive Findings

1. SDK direct/remote switching is already centralized in `api/bilisound.ts`.

2. No obvious store-to-API dependency was observed.

3. The current module names provide useful migration anchors, even when their responsibilities need to be split.

## Current Interpretation

The v3 plan should treat `player`, `config`, `bilibili data`, `playback orchestration`, `playlist`, and `cache/download` as separate workstreams.

The first implementation workstream should focus on `packages/player`, because several mobile-layer workarounds exist to compensate for missing player-level abstractions.
