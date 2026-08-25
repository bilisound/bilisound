# Epic 7 Plan — UI Rewrite

> Status: **ready to start** (2026-08-25). Phase 2 admission criteria all met; feature
> use-case APIs frozen. This document records the framework decision, responsive strategy,
> and slice breakdown.

## Framework Decision

**Full Tamagui adoption.** `packages/ui` (Tamagui-based) becomes the sole UI framework.
NativeWind and gluestack-ui are removed during the rewrite — screens are rebuilt, not
migrated. Slice 0 installs `@tamagui/core` + `@bilisound/ui` peer deps into `apps/mobile`
and wires `BilisoundProvider` into the root layout.

Rationale: `packages/ui` already invests in Tamagui tokens, recipes, components, stories,
and DOM-component bridge. Splitting the framework would waste that work and create two
parallel design systems. The README's "re-evaluate Nativewind and gluestack-ui" rule is
resolved: both are retired.

## Responsive Strategy

Breakpoint switch at **md (768px)**:

```txt
< 768px (phone)        bottom tab navigation + bottom-sheet player
>= 768px (tablet/PC)  sidebar navigation + main content + persistent player panel
```

The sidebar appears at md, not lg, so tablet portrait and phone landscape both activate
the wide layout. `packages/ui` `DualScrollView` already provides the two-column skeleton
(header pane hidden below gtSm/661px); Epic 7 extends this to a full app-shell split.

Existing breakpoints (`apps/mobile/constants/styles.ts`):
```txt
sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536
```

## Slice Breakdown

### Slice 0 — Component gaps + framework wiring

Scope:
```txt
packages/ui   complete P1/P2 gaps from ui-component-gap.md:
              FormControl, Pressable, TextField, TextareaField, Toast/NotifyToast,
              ErrorContent, Skeleton/SkeletonText, Menu, Actionsheet
packages/ui   new PageShell (de-businessed layout.tsx: safeArea, maxWidth, header 64px,
              a11y focus — no router.back, no MainBottomSheetCloseHost)
apps/mobile   install @tamagui/core + @bilisound/ui peer deps
apps/mobile   wire BilisoundProvider into root _layout.tsx
```

Goals:
1. All layout/page prerequisites available in `packages/ui`.
2. `apps/mobile` can import `@bilisound/ui` and render Tamagui.
3. No screen content changed yet; existing gluestack screens still render.

Verification: `packages/ui` typecheck + storybook; `apps/mobile` tsc + expo export.

### Slice 1 — Responsive app shell + navigation

Scope:
```txt
apps/mobile/app/(main)/_layout.tsx   replace Expo Router Tabs with ResponsiveAppShell
packages/ui or apps/mobile            ResponsiveAppShell component:
  < md:  bottom tab bar (歌单/查询/设置) + bottom-sheet player
  >= md: left sidebar nav + main content area + persistent player panel slot
apps/mobile                           AppLayout wraps PageShell with router.back + CloseHost
```

Goals:
1. Navigation switches at md (768px): bottom tab → sidebar.
2. Main content area has a slot for persistent player (filled in Slice 2).
3. No page content rewritten; existing screens render inside the new shell.
4. Yuru-chara and safe-area behavior preserved.

Verification: device screenshot at phone width + tablet width; sidebar/tab visible.

### Slice 2 — Player panel responsive

Scope:
```txt
apps/mobile/components/main-bottom-sheet/*   responsive behavior split:
  < md:  bottom sheet (current behavior preserved)
  >= md: persistent side panel or bottom mini-player + expandable queue
features/playback                             player panel view model if needed
```

Goals:
1. Player controls/queue/progress accessible without bottom sheet on tablet/PC.
2. Phone behavior unchanged (bottom sheet).
3. `features/player` wrapper hooks consumed; no direct `@bilisound/player` in components.

Verification: device screenshot — player visible on tablet without opening sheet.

### Slice 3+ — Screen rewrite (one slice per screen or group)

Each screen rebuilds with `packages/ui` components + frozen feature APIs. Order follows
user value + dependency:

```txt
Slice 3a  Playlist list (responsive grid/list; sidebar detail on >= md)
Slice 3b  Playlist detail (split view: track list + detail/player on >= md)
Slice 3c  Search (query + results split on >= md)
Slice 3d  Video detail (responsive metadata + episodes)
Slice 3e  Settings (responsive; sub-pages: theme/data/about/logs)
Slice 3f  Download manager + History
Slice 3g  Remaining (barcode scan, remote-list, download-web, exchange flows)
```

Goals per slice:
1. Screen uses only `@bilisound/ui` components + `~/features/*` APIs.
2. No NativeWind `className` or gluestack imports in the rewritten screen.
3. Business policy stays in feature hooks; screen is presentational.
4. Accessibility improved over v2 (semantic roles, labels, focus order).

Verification: device screenshot at phone + tablet width; a11y snapshot; tsc + expo export.

### Slice 4 — NativeWind/gluestack removal + cleanup

Scope:
```txt
apps/mobile   remove NativeWind dependency, gluestack-ui dependency, global.css
apps/mobile   remove components/ui/* (gluestack wrappers) after all screens migrated
apps/mobile   remove nativewind polyfill, CssInterop registration
```

Goal: `apps/mobile` has zero NativeWind/gluestack dependency; `@bilisound/ui` is the
sole UI framework.

Verification: `package.json` clean; tsc + expo export (android + web); device smoke.

## What This Plan Does Not Include

- New player engine work (Epic 1 holds).
- Feature API changes (Phase 2 frozen; extend, don't break).
- `~/api/release` client migration into `features/config` (deferred).
- `bottom-sheet`/`error-message` store move to `shared/` (deferred as pure UI state).
- DOM component wiring for markdown/log views (deferred; ui-foundation.md notes the bridge
  is package-local and wiring is Epic 7 work, but not blocking the layout/screen rewrite).
