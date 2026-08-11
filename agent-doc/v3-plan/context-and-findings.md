# Context and Findings

> This is the historical baseline that motivated the v3 plan, not a description of the current
> tree. Epics 1–5 have since been delivered; use [README.md](./README.md) for current status and
> the implementation records in [epic-breakdown.md](./epic-breakdown.md) for current boundaries.

## Background

Bilisound v2 already had recognizable `app`, `components`, `business`, `storage`, `store`, and
`api` modules plus package-level `@bilisound/player` / `@bilisound/sdk` boundaries. The problem
was that several high-impact capabilities were reachable from too many layers.

The baseline analysis found player operations, SDK response types, storage schema types, settings
state, and download/cache orchestration leaking across UI, business, and persistence layers.

## Original Baseline Findings

1. `@bilisound/player` leaked into routes, components, hooks, business logic, stores, and storage
   helpers.
2. `business/playlist/handler/*` coordinated metadata, resource URLs, cache checks, queue
   replacement, player mutation, settings, errors, and persistence despite living under playlist.
3. Mobile emulated shuffle by physically mutating the queue in
   `apps/mobile/business/playlist/shuffle.ts`.
4. `components/video-detail/*` consumed `@bilisound/sdk` response types directly.
5. `components/song-item.tsx` consumed SQLite `PlaylistDetail` rows directly.
6. The old `store/settings.ts` mixed appearance, download, resource, and diagnostics policy.
7. `store/download.ts` contained task scheduling and other stores mixed state mutation with
   business policy.

These statements describe the pre-refactor baseline. Removed paths are retained here only to
explain why the delivered boundaries were introduced.

## Delivered Responses

| Baseline coupling                     | Delivered boundary                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| Cross-platform queue and shuffle gaps | `packages/player` owns canonical queue and playback order                       |
| Route-level playback orchestration    | `apps/mobile/features/playback` owns playback use cases                         |
| SDK calls and DTOs outside a boundary | `apps/mobile/features/bilibili` owns SDK access, app models, and mapping        |
| Settings store used as policy API     | `apps/mobile/features/config` exposes selectors and policy readers              |
| SQLite rows used as domain models     | `apps/mobile/features/playlist` owns playlist models, repository, and use cases |

See the delivered status and verification records in `epic-breakdown.md` rather than re-running
these migrations.

## Remaining Current Finding

Epic 6 (Cache and Download) is the next business refactor. Cache and download responsibilities
remain split across `apps/mobile/business/download.ts`, `apps/mobile/storage/cache-status.ts`, and
`apps/mobile/features/playback/cache.ts`; the target boundary is `apps/mobile/features/cache`.
