# @bilisound/ui

Bilisound v3 component library. The package is also an isolated Expo project so components can be developed and verified without coupling them to current mobile screens.

## Layers

```txt
src/design-token/  Primitive palettes, dimensions, semantic themes, Tamagui config
src/recipe/        Headless Tamagui styling and visual-state recipes
src/component/     Bilisound-owned public component contracts
```

Dependencies must only point downward: `component -> recipe -> design-token`.

## Theme Contract

Primitive color palettes use the 11 Tailwind shades from `50` through `950`. The same primitive palette is used in light and dark appearances; `createSemanticTheme` selects different shades instead of reversing the palette.

`ThemePalette` is structurally compatible with the `primary` and `accent` fields in the existing `apps/mobile/features/theme` user theme format. A persisted palette can be supplied when creating the config:

```ts
const config = createBilisoundConfig({ userPalette: userTheme.palette });
```

For live editor previews, call `updateUserTheme(userTheme.palette)` before selecting the `user` theme. Storage, import/export, and theme registry state remain application responsibilities.

## Commands

```sh
pnpm -C packages/ui start
pnpm -C packages/ui web
pnpm -C packages/ui typecheck
pnpm -C packages/ui build
```
