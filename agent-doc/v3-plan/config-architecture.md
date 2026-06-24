# Config Architecture

This document tracks the settings/config workstream for Bilisound v3.

## Current State

Current settings live in:

```txt
apps/mobile/store/settings.ts
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

## Implementation Status

**Facade created (Phase 1 complete):**

```txt
features/config/
  types.ts      — AppearanceConfig, DownloadConfig, ResourceConfig, DiagnosticsConfig
  store.ts      — wraps useSettingsStore, exposes getConfigState/updateConfig/toggleConfig/rehydrateConfig
  selectors.ts  — reactive hooks: useSettingsManagement, useAppearanceConfig, useThemeConfig, etc.
  policies.ts   — non-reactive readers: shouldFilterResourceURL, shouldUseLegacyID, isDebugMode, etc.
  index.ts      — public API barrel
```

**Consumers migrated (Phase 2 complete):**

All 16 known consumers now import from `~/features/config` instead of `~/store/settings`.
Only `features/config/store.ts` retains the direct `~/store/settings` import.

Persisted key `settings-store` is unchanged. No data migration needed.

## Consumers to Migrate

All consumers below have been migrated to `~/features/config`:

```txt
apps/mobile/app/(main)/settings.tsx          → useSettingsManagement
apps/mobile/app/settings/theme.tsx           → useThemeConfig
apps/mobile/app/(main)/_layout.tsx           → useShowYuruChara
apps/mobile/app/(main)/(playlist)/playlist.tsx → usePlaylistViewConfig
apps/mobile/app/download-web.tsx             → shouldUseLegacyID (policy)
apps/mobile/components/ui/gluestack-ui-provider/index.tsx → useThemeName
apps/mobile/components/ui/gluestack-ui-provider/index.web.tsx → useThemeName
apps/mobile/components/yuru-chara.tsx        → useThemeName
apps/mobile/components/video-detail/MetaData.tsx → shouldUseLegacyID (policy)
apps/mobile/components/video-detail/PageMenu.tsx → shouldUseLegacyID (policy)
apps/mobile/components/ui-next/theme/colors.ts → useThemeName
apps/mobile/business/download.ts             → shouldFilterResourceURL (policy)
apps/mobile/business/playlist/handler/cache.ts → shouldDownloadNextTrack (policy)
apps/mobile/business/playlist/handler/track-operations.ts → shouldFilterResourceURL (policy)
apps/mobile/hooks/useDownloadMenuItem.ts     → shouldUseLegacyID (policy)
apps/mobile/utils/init.ts                    → rehydrateConfig, isDebugMode
apps/mobile/utils/init.web.ts                → rehydrateConfig, isDebugMode
```

## Open Questions

1. Should `debugMode` remain user-facing, developer-only, or become build/environment-driven?
2. Should `useLegacyID` be a resource policy, export/download filename policy, or both?
3. Should `filterResourceURL` live in config or in the Bilibili data/resource service as a policy input?
4. Should appearance settings remain in Zustand or move to a smaller dedicated store?
