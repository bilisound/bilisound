# @bilisound/ui

Bilisound v3 component library. Storybook is the canonical component documentation surface; the isolated Expo showcase remains available for native smoke testing without coupling components to current mobile screens.

## Layers

```txt
src/design-token/  Primitive palettes, dimensions, semantic themes, Tamagui config
src/recipe/        Headless Tamagui styling and visual-state recipes
src/component/     Bilisound-owned public component contracts
```

Dependencies must only point downward: `component -> recipe -> design-token`.

## Component Documentation

Stories are colocated with their public components as `src/component/*.stories.tsx`. Each component owns its variants, states, controls, and generated API documentation. The global Storybook toolbar switches Bilisound appearance and semantic theme.

Storybook renders through React Native Web for fast documentation and accessibility review. It does not replace iOS or Android verification; use the Expo showcase for native fidelity.

## Consumption

`@bilisound/ui` is a source-only workspace package. Consumers import the package name instead of reaching into its directory:

```ts
import { Button, Slider, TextInput } from "@bilisound/ui";
```

The package exports `src/index.ts`, so the consuming Expo application's Metro and Babel pipeline transpiles Tamagui and application code together. There is no package build step or `dist` contract. The package-level `main` field remains reserved for the standalone Expo showcase entry.

## Theme Contract

Primitive color palettes use the 11 Tailwind shades from `50` through `950`. The same primitive palette is used in light and dark appearances; `createSemanticTheme` selects different shades instead of reversing the palette.

`ThemePalette` is structurally compatible with the `primary` and `accent` fields in the existing `apps/mobile/features/theme` user theme format. A persisted palette can be supplied when creating the config:

```ts
const config = createBilisoundConfig({ userPalette: userTheme.palette });
```

For live editor previews, call `updateUserTheme(userTheme.palette)` before selecting the `user` theme. Storage, import/export, and theme registry state remain application responsibilities.

## Commands

```sh
pnpm -C packages/ui web              # Storybook documentation
pnpm -C packages/ui build:storybook  # Static Storybook build
pnpm -C packages/ui start            # Expo native showcase
pnpm -C packages/ui showcase:web     # Expo Web showcase
pnpm -C packages/ui typecheck
```
