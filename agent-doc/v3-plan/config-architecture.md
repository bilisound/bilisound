# Config Architecture

This document tracks the settings/config workstream for Bilisound v3.

## Current State

Settings previously lived in:

```txt
apps/mobile/store/settings.ts   # now deleted; moved to features/config/store.ts
```

The persisted store key is:

```txt
settings-store
```

Storage is implemented through:

```txt
apps/mobile/storage/zustand.ts
```

Current fields:

```txt
useLegacyID
downloadNextTrack
filterResourceURL
debugMode
showPlaylistInGrid
theme
showYuruChara
```

## Problem

The current store mixes different semantic levels:

```txt
Appearance preferences:
  theme
  showYuruChara
  showPlaylistInGrid

Download/cache behavior:
  downloadNextTrack

Resource request policy:
  filterResourceURL
  useLegacyID

Diagnostics:
  debugMode
```

The store is imported directly by UI, business logic, components, and initialization code. Several consumers use `useSettingsStore.getState()`, which makes configuration reads non-reactive and hides dependencies.

> 已解决：见下方 Implementation Status。facade 交付后，`features/config` 之外不再有模块直接 import settings store。

## v3 Goal

Config should provide narrow access points instead of one broad settings store.

Suggested first shape:

```txt
features/config/
  store.ts
  selectors.ts
  policies.ts
  migrations.ts
  types.ts
  index.ts
```

This first shape can still use one persisted store internally. The initial goal is to introduce semantic access boundaries before splitting physical storage.

## Suggested Types

```ts
export interface AppearanceConfig {
  theme: string;
  showYuruChara: boolean;
  showPlaylistInGrid: boolean;
}

export interface DownloadConfig {
  downloadNextTrack: boolean;
}

export interface ResourceConfig {
  filterResourceURL: boolean;
  useLegacyID: boolean;
}

export interface DiagnosticsConfig {
  debugMode: boolean;
}
```

## Suggested Accessors

Reactive UI access:

```ts
useAppearanceConfig();
usePlaylistViewConfig();
useDownloadConfig();
useResourceConfig();
useDiagnosticsConfig();
```

Non-reactive service access:

```ts
getDownloadPolicy();
getResourcePolicy();
getDiagnosticsConfig();
```

Business code should depend on policies rather than Zustand directly.

## Migration Strategy

The v2 persisted data should be preserved.

Recommended staged approach:

1. Keep `settings-store` as the initial persisted key.
2. Add `features/config` as a facade over the existing store.
3. Migrate consumers from `useSettingsStore` to config selectors/policies.
4. After consumers are migrated, decide whether to split storage keys.

If storage keys are split later, add an explicit migration from `settings-store` into new keys.

## Consumers to Migrate

Known direct consumers include:

```txt
apps/mobile/app/(main)/settings.tsx
apps/mobile/app/settings/theme.tsx
apps/mobile/app/(main)/_layout.tsx
apps/mobile/app/(main)/(playlist)/playlist.tsx
apps/mobile/app/download-web.tsx
apps/mobile/components/ui/gluestack-ui-provider/index.tsx
apps/mobile/components/ui/gluestack-ui-provider/index.web.tsx
apps/mobile/components/yuru-chara.tsx
apps/mobile/components/video-detail/MetaData.tsx
apps/mobile/components/video-detail/PageMenu.tsx
apps/mobile/business/download.ts
apps/mobile/business/playlist/handler/cache.ts
apps/mobile/business/playlist/handler/track-operations.ts
apps/mobile/hooks/useDownloadMenuItem.ts
apps/mobile/utils/init.ts
apps/mobile/utils/init.web.ts
```

## Implementation Status (facade delivered)

`apps/mobile/features/config` now exists:

```txt
features/config/
  types.ts      # SettingsProps (persisted shape) + domain config interfaces
  store.ts      # persisted Zustand store (settings-store key, unchanged)
  selectors.ts  # useAppearanceConfig / usePlaylistViewConfig / useDownloadConfig /
                # useResourceConfig / useDiagnosticsConfig / useSettingsActions
  policies.ts   # getDownloadPolicy / getResourcePolicy / getDiagnosticsConfig
  index.ts      # public entry; store intentionally NOT re-exported
```

Decisions:

```txt
- apps/mobile/store/settings.ts deleted; no shim left behind.
- persisted key stays `settings-store`; stored shape identical to v2, so existing
  user data reads back unchanged; no data migration was needed.
- migrations.ts not created yet: only relevant when storage keys are split.
- init bootstrap uses rehydrateSettings() + getDiagnosticsConfig() from
  features/config instead of touching the store directly.
- settings editor pages (settings.tsx / theme.tsx) use domain hooks +
  useSettingsActions() for update/toggle.
- test mock updated: components/__tests__/yuru-chara.test.tsx mocks
  ~/features/config instead of ~/store/settings.
```

Verification: `tsc --noEmit` clean, ESLint 0 errors (14 pre-existing warnings), jest 14 suites / 85 tests pass.

Coupling reduced: no module outside `features/config` imports the settings store or
v2 `~/store/settings`; business layers now read policy readers instead of `getState()`.

Next handoff step: answer the Open Questions below, then decide whether to split
`settings-store` into per-domain persisted keys (with an explicit migration) or
keep the single key behind the facade.

## Open Questions

1. Should `debugMode` remain user-facing, developer-only, or become build/environment-driven?
2. Should `useLegacyID` be a resource policy, export/download filename policy, or both?
3. Should `filterResourceURL` live in config or in the Bilibili data/resource service as a policy input?
4. Should appearance settings remain in Zustand or move to a smaller dedicated store?
