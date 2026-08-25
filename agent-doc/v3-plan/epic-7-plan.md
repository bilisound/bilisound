# Epic 7 Plan — UI Rewrite

> Status: **ready to start** (2026-08-25). Phase 2 admission criteria all met; feature
> use-case APIs frozen. This document records the framework decision, responsive strategy,
> and slice breakdown.

## Framework Decision

**Full Tamagui adoption.** `packages/ui` (Tamagui-based) becomes the sole UI framework.
NativeWind and gluestack-ui are removed during the rewrite — screens are rebuilt, not
migrated.

Rationale: `packages/ui` already invests in Tamagui tokens, recipes, components, stories,
and DOM-component bridge. Splitting the framework would waste that work and create two
parallel design systems. The README's "re-evaluate Nativewind and gluestack-ui" rule is
resolved: both are retired.

## Project Strategy — `apps/mobile-next` greenfield

Rather than modifying `apps/mobile` in place, Epic 7 creates a **new** `apps/mobile-next`
Expo project. The UI layer (`app/`, `components/`) is written from scratch with Tamagui.
The non-UI infrastructure is copied from `apps/mobile` so the frozen feature APIs resolve
without cross-app imports:

```txt
apps/mobile-next/
  features/         copied from apps/mobile (bilibili, config, cache, player, playback,
                    playlist, theme) — Phase 2 frozen, no sync needed except critical fixes
  utils/            copied (logger, file, init, migration, exchange, string, datetime, vendors)
  constants/        copied (branding, feature, file, network, platform, playback, releasing, styles, web)
  storage/          copied (playlist, queue, sqlite, zustand)
  store/            copied (bottom-sheet, error-message — pure UI state, deferred)
  api/              copied (release, common)
  hooks/            copied where non-UI (useWindowSize, useTabSafeAreaInsets, useConfirm, ...)
  app/              NEW — Expo Router routes, Tamagui only
  components/        NEW — Tamagui components only, no gluestack/NativeWind
  package.json      clean: no NativeWind/gluestack/CssInterop/tailwind; add @bilisound/ui + @tamagui/core
  app.config.ts     different bundle id (avoid dev client clash with apps/mobile)
  tsconfig.json     ~/* alias, no tailwind path
  babel.config.js   Tamagui compiler, no NativeWind
  metro.config.js   no NativeWind resolver, no CssInterop
```

During the port, `apps/mobile` remains the live app. `apps/mobile-next` is developed and
verified independently. Feature-layer critical fixes are cherry-picked to mobile-next
manually (expected to be rare — Phase 2 APIs are frozen).

**Final swap**: when mobile-next is feature-complete, `apps/mobile` is deleted and
`apps/mobile-next` is renamed to `apps/mobile` (bundle id and config reverted to
production values). The old `apps/mobile` commit history is preserved in git.

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

### Slice 0 — Scaffold mobile-next + component gaps + framework wiring

Scope:
```txt
apps/mobile-next  scaffold new Expo project (package.json, app.config.ts, tsconfig,
                  babel, metro — clean, no NativeWind/gluestack/tailwind)
apps/mobile-next  copy non-UI infrastructure from apps/mobile:
                  features/, utils/, constants/, storage/, store/, api/, non-UI hooks/
apps/mobile-next  install @bilisound/ui + @tamagui/core + @bilisound/player + @bilisound/sdk
apps/mobile-next  wire BilisoundProvider into root _layout.tsx
packages/ui      complete P1/P2 gaps from ui-component-gap.md:
                  FormControl, Pressable, TextField, TextareaField, Toast/NotifyToast,
                  ErrorContent, Skeleton/SkeletonText, Menu, Actionsheet
packages/ui      new PageShell (de-businessed layout.tsx: safeArea, maxWidth, header 64px,
                  a11y focus — no router.back, no MainBottomSheetCloseHost)
apps/mobile-next  minimal smoke route (e.g. a temp index screen) proving Tamagui renders
```

Goals:
1. `apps/mobile-next` is a bootable Expo dev client with Tamagui + frozen features.
2. All layout/page prerequisites available in `packages/ui`.
3. `apps/mobile` is untouched and remains the live app.
4. Bundle id differs from `apps/mobile` to avoid dev client clash.

Verification: `apps/mobile-next` tsc + expo export (android); `packages/ui` typecheck.
No device smoke needed yet (no real screens).

### Slice 1 — Responsive app shell + navigation (in mobile-next)

Scope:
```txt
apps/mobile-next/app/(main)/_layout.tsx  ResponsiveAppShell (new, no Expo Router Tabs)
packages/ui or apps/mobile-next          ResponsiveAppShell component:
  < md:  bottom tab bar (歌单/查询/设置) + bottom-sheet player slot
  >= md: left sidebar nav + main content area + persistent player panel slot
apps/mobile-next                         AppLayout wraps PageShell with router.back + CloseHost
```

Goals:
1. Navigation switches at md (768px): bottom tab → sidebar.
2. Main content area has a slot for persistent player (filled in Slice 2).
3. Placeholder screens render inside the new shell (real page content in Slice 3+).
4. Yuru-chara and safe-area behavior preserved.

Verification: device screenshot at phone width + tablet width; sidebar/tab visible.

### Slice 2 — Player panel responsive (in mobile-next)

Scope:
```txt
apps/mobile-next/components/  new player panel (not copied from main-bottom-sheet):
  < md:  bottom sheet (re-implemented with Tamagui Sheet, not @gorhom/bottom-sheet)
  >= md: persistent side panel or bottom mini-player + expandable queue
features/playback             player panel view model if needed
```

Goals:
1. Player controls/queue/progress accessible without bottom sheet on tablet/PC.
2. Phone behavior preserved (bottom sheet, but Tamagui-based).
3. `features/player` wrapper hooks consumed; no direct `@bilisound/player` in components.

Verification: device screenshot — player visible on tablet without opening sheet.

### Slice 3+ — Screen rewrite (in mobile-next, one slice per screen or group)

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

### Slice 4 — Final swap + old project removal

Scope:
```txt
apps/mobile        delete (git preserves history)
apps/mobile-next   rename to apps/mobile (git mv)
apps/mobile        revert bundle id + app.config to production values
pnpm-workspace     update if needed
```

Goal: `apps/mobile` is the Tamagui-only app; no NativeWind/gluestack dependency anywhere.
The old project's commit history is preserved in git.

Verification: `package.json` clean; tsc + expo export (android + web); device smoke.

## What This Plan Does Not Include

- New player engine work (Epic 1 holds).
- Feature API changes (Phase 2 frozen; extend, don't break).
- `~/api/release` client migration into `features/config` (deferred).
- `bottom-sheet`/`error-message` store move to `shared/` (deferred as pure UI state).
- DOM component wiring for markdown/log views (deferred; ui-foundation.md notes the bridge
  is package-local and wiring is Epic 7 work, but not blocking the layout/screen rewrite).
