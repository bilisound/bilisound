# Agent Handoff Guide

This guide is for future agent sessions working on Bilisound v3.

## Before Starting

1. Read `agent-doc/README.md` and the existing architecture docs.
2. Read all files in `agent-doc/v3-plan`.
3. Inspect `git status --short --branch` before editing.
4. Do not overwrite unrelated user or agent changes.
5. Keep each task scoped to one epic where possible.
6. Treat business decoupling as preparation for a later UI rewrite, not as the UI rewrite itself.

## Branch

There is no single long-lived v3 branch. Do not assume or create one.

Check `git branch -a` and ask the user which branch the task belongs on. Recent v3-adjacent work has landed on `develop` directly and on narrowly scoped feature branches such as `feature/tamagui-evaluation` and `feature/refactor-settings-storage`.

## Recommended First Workstream

Start with Player Foundation unless the user explicitly asks for another epic.

Reason:

```txt
mobile app shuffle/playback code currently compensates for player-level platform differences
```

Changing mobile structure before player APIs are fixed may move the coupling without reducing it.

## Long-Term UI Rewrite Direction

See [README](./README.md#long-term-direction) for the UI rewrite sequencing rule.

When touching UI during a business epic, keep the edit local and explain which coupling it removes. Examples:

```txt
acceptable: replace a component's direct @bilisound/player deep import with a feature/player hook
acceptable: map SQLite row data to a view model before passing it into a presentational component
avoid: redesigning screens while migrating playlist storage
avoid: replacing Nativewind/gluestack-ui while implementing playback orchestration
```

## Safe Task Boundaries

### Player Foundation Task

Files likely involved:

```txt
packages/player/src/player.ts
packages/player/src/types/index.ts
packages/player/src/types/module.ts
packages/player/src/index.ts
packages/player/src/BilisoundPlayerModule.web.ts
packages/player/ios/BilisoundPlayerModule.swift
packages/player/android/src/main/java/moe/bilisound/player/BilisoundPlayerModule.kt
```

Avoid changing unrelated mobile app structure in the same patch.

### Config Architecture Task

Files likely involved:

```txt
apps/mobile/features/config
apps/mobile/storage/zustand.ts
apps/mobile/app/settings/*
apps/mobile/utils/init.ts
apps/mobile/utils/init.web.ts
```

Start with a facade in `features/config` before changing persisted storage layout.

### Bilibili Data Boundary Task

Files likely involved:

apps/mobile/features/bilibili
apps/mobile/components/video-detail/*
apps/mobile/app/video/[id].tsx
apps/mobile/app/remote-list.tsx
apps/mobile/app/download-web.tsx
packages/sdk
```

Do not change SDK behavior while extending this boundary. Consume its app-owned models and
public functions; keep playlist/player orchestration outside `features/bilibili`.

## Definition of Done for v3 Refactor Tasks

A task should state which coupling it reduces.

Useful checks:

```txt
Does this reduce direct @bilisound/player usage outside player boundaries?
Does this reduce direct @bilisound/sdk DTO usage in UI?
Does this remove route-level imports from storage/api/player?
Does this move business policy out of Zustand store actions?
Does this preserve persisted user data?
Does this make a future UI rewrite easier without mixing in UI framework replacement?
```

## Verification Notes

There is no required CI test suite documented for the repository. Prefer the smallest relevant verification command for the touched package.

Potential commands:

```txt
pnpm -C packages/player build
pnpm -C apps/mobile lint
pnpm -C packages/sdk build
```

Long-running dev servers must be run with timeout or background/kill handling per repository instructions.

## Documentation Updates

When an epic decision changes, update the corresponding file in this directory.

If a task discovers that a proposed boundary is wrong, record the evidence and the replacement boundary. Do not silently encode a new architecture only in code.
