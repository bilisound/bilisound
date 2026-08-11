---
name: bilisound-v3-plan
description: Use whenever the user mentions Bilisound v3, v3 refactor, code organization, feature boundaries, player foundation, playback orchestration, config/settings migration, cache/download restructuring, playlist domain restructuring, or asks to continue/implement any part of the v3 plan. This skill routes work through the handoff docs in agent-doc/v3-plan so future agent sessions preserve the intended architecture and avoid restarting the analysis.
---

# Bilisound v3 Plan

Use this skill to continue Bilisound v3 planning or implementation work from the shared handoff documents.

The goal is to reduce coupling through staged technical improvements. Do not treat v3 as a single large directory move.

## Required First Step

Before proposing or editing code, read the v3 plan entry point:

```txt
agent-doc/v3-plan/README.md
```

Then read the specific document for the user's requested area:

```txt
agent-doc/v3-plan/context-and-findings.md
agent-doc/v3-plan/target-architecture.md
agent-doc/v3-plan/epic-breakdown.md
agent-doc/v3-plan/player-foundation.md
agent-doc/v3-plan/config-architecture.md
agent-doc/v3-plan/agent-handoff-guide.md
```

If the user says something like `我要做 player` or `继续 v3 的配置部分`, map it to the corresponding epic before editing.

## Epic Routing

Use this routing table when the user names a v3 area.

| User intent                                                             | Read first                                       | Likely scope                                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Player, shuffle, queue, ExoPlayer, AVQueuePlayer, repeat mode           | `player-foundation.md`                           | `packages/player`, `apps/mobile/features/playback`                                             |
| Settings, config, preferences, debug mode, storage migration            | `config-architecture.md`                         | `apps/mobile/features/config`                                                                  |
| SDK, Bilibili data, metadata, remote list, DTO leakage                  | `target-architecture.md`, `epic-breakdown.md`    | `apps/mobile/features/bilibili`, `packages/sdk`, `apps/server-cf`                              |
| Playback, play playlist, play episode, queue restore, playlist-to-queue | `target-architecture.md`, `player-foundation.md` | `apps/mobile/features/playback`, `packages/player`                                             |
| Playlist CRUD, playlist detail, SongItem schema coupling                | `target-architecture.md`, `epic-breakdown.md`    | `apps/mobile/features/playlist`, `apps/mobile/storage/sqlite`                                  |
| Cache, download scheduler, audio/image cache                            | `epic-breakdown.md`                              | target `apps/mobile/features/cache`; current `business/download.ts`, `storage/cache-status.ts` |

## Working Rules

1. Preserve the staged plan and its delivered boundaries.

   Epics 1–5 are delivered. Treat `features/config`, `features/bilibili`, `features/playback`, and `features/playlist` plus the player foundation as current architecture; do not restart those migrations. Epic 6 (Cache and Download) is the next business refactor.

2. Prefer a narrow task boundary.

   Do not change player mechanics, playback orchestration, playlist storage, and config migration in the same patch unless the user explicitly asks for a broad spike.

3. State which coupling the task reduces.

   Useful examples:

   ```txt
   direct @bilisound/player usage outside player boundaries
   direct @bilisound/sdk DTO usage in UI
   route-level imports from storage/api/player
   business policy inside Zustand store actions
   settings store direct reads outside config boundaries
   ```

4. Keep persisted data in mind.

   Settings, playlist, queue, cache status, and history data may already exist on user devices. Do not delete or reshape persisted data without a migration plan.

5. Avoid architecture-only churn.

   Moving files is not enough. The import/dependency direction must improve.

## Preferred Response Shape

When the user asks to work on a v3 area, answer or proceed with this shape:

```txt
1. Identify the epic and docs read.
2. State the current coupling/problem being addressed.
3. Define the smallest useful task boundary.
4. Make code or documentation changes if the user asked to implement.
5. Run the smallest relevant verification.
6. Report remaining risks and next handoff step.
```

## Implementation Priority

The current default priority is Epic 6 (Cache and Download), unless the user names another area:

```txt
target: apps/mobile/features/cache
current: apps/mobile/business/download.ts
current: apps/mobile/storage/cache-status.ts
current: apps/mobile/features/playback/cache.ts
```

Player Foundation and the Config, Bilibili, Playback, and Playlist boundaries are already delivered. Changes in those areas should extend or repair the existing boundaries rather than re-run their original migrations.

## Handoff Discipline

If a decision changes, update the relevant file in `agent-doc/v3-plan`.

Do not leave important architecture decisions only in chat history or code comments. The next agent should be able to resume from the docs.
