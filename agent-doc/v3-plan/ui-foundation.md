# UI Foundation

This document records the initial architecture for `packages/ui`, the Bilisound v3 component library.

## Relationship To The V3 Sequence

The component library can be developed in parallel with the business foundation because it is isolated from `apps/mobile` storage, SDK DTOs, player APIs, stores, and feature orchestration.

Screen migration is still Epic 7 work. Current v2 screens should not adopt `packages/ui` broadly until their feature-facing use cases and view models are stable.

## Package Shape

`packages/ui` is both a workspace library and an Expo showcase project.

```txt
packages/ui/
  App.tsx              # isolated component showcase
  index.ts             # Expo entry
  src/
    design-token/      # primitive and semantic tokens, themes, Tamagui config
    recipe/            # headless Tamagui styling and visual states
    component/         # Bilisound-owned public component contracts
```

Dependency direction:

```txt
component -> recipe -> design-token
design-token -/-> recipe/component
packages/ui -/-> apps/mobile
```

Tamagui is an implementation detail below the Bilisound component contract. The package uses `@tamagui/core` and selected component packages without `@tamagui/config` or the aggregate `tamagui` package. Components explicitly opt into unstyled primitives.

## Token And Theme Contract

Primitive color palettes use exactly the canonical Tailwind shade names:

```txt
50 100 200 300 400 500 600 700 800 900 950
```

Spacing and control dimensions use a 4-point base unit. Semantic themes select primitive shades for each appearance and component state.

Dark mode does not reverse primitive palettes. Light and dark themes consume the same unchanged scale and independently map semantic values such as `canvas`, `text`, `border`, `primaryBackground`, and `sliderRange`.

## User Theme Compatibility

The package-owned `ThemePalette` contract contains `primary` and `accent` Tailwind scales. It is structurally compatible with the same fields in the persisted `apps/mobile/features/theme/UserThemePalette` shape, so existing theme data does not need to be rewritten for v3.

Application responsibilities remain outside the package:

```txt
theme persistence and migration
theme archive import/export
image assets and extracted colors
theme registry state
appearance preference
```

At bootstrap, an application may call `createBilisoundConfig({ userPalette })` so `light_user` and `dark_user` exist before meaningful UI renders. `updateUserTheme(palette)` supports live editor previews. Both appearances map the original scales directly; neither path reverses them.

The current v2 NativeWind/Gluestack registry may retain its shipped reversal behavior until screen migration. Do not mutate persisted palettes merely to accommodate either renderer.

## Initial Components

The first public components are:

```txt
Button      primary/secondary variants, sm/md/lg sizes, disabled states
TextInput   sm/md/lg sizes, invalid and disabled states
Slider      controlled/uncontrolled values, multiple thumbs, disabled states
```

The Slider keeps Tamagui's keyboard and accessibility behavior. A host using a vertical Slider on iOS must pass complete safe-area `insets` to `BilisoundProvider`.

## Verification

```sh
pnpm -C packages/ui typecheck
pnpm -C packages/ui build
pnpm -C packages/ui exec expo export --platform web --clear --output-dir ../../.temp/ui-web-export
pnpm -C packages/ui exec expo export --platform android --clear --output-dir ../../.temp/ui-android-export
```

## Next Boundaries

1. Add focused token/theme tests, especially proving dark themes do not reverse user palettes.
2. Add accessibility and interaction tests for each public component.
3. Establish a visual regression matrix for iOS, Android, desktop Web, and narrow Web.
4. Add new components one at a time; keep screen-specific business policy out of recipes and components.
5. Evaluate the Tamagui compiler separately after runtime integration and public contracts stabilize.
