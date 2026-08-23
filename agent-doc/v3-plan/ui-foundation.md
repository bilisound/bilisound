# UI Foundation

This document records the initial architecture for `packages/ui`, the Bilisound v3 component library.

## Relationship To The V3 Sequence

The component library can be developed in parallel with the business foundation because it is isolated from `apps/mobile` storage, SDK DTOs, player APIs, stores, and feature orchestration.

Screen migration is still Epic 7 work. Current v2 screens should not adopt `packages/ui` broadly until their feature-facing use cases and view models are stable.

## Package Shape

`packages/ui` is a workspace library with Storybook documentation and an Expo native showcase.

```txt
packages/ui/
  .storybook/          # React Native Web documentation configuration
  app/                 # Expo Router showcase routes
  showcase/            # route-independent showcase demos and theme state
  index.ts             # native Storybook entry used by Storybook scripts
  plugins/             # shared Expo config plugins for native UI behavior
  src/
    design-token/      # primitive and semantic tokens, themes, Tamagui config
    recipe/            # headless Tamagui styling and visual states
    component/         # public contracts with colocated *.stories.tsx documentation
```

Dependency direction:

```txt
component -> recipe -> design-token
design-token -/-> recipe/component
packages/ui -/-> apps/mobile
```

Tamagui is an implementation detail below the Bilisound component contract. The package uses `@tamagui/core` and selected component packages without `@tamagui/config` or the aggregate `tamagui` package. Components explicitly opt into unstyled primitives.

## Component Documentation

Web Storybook is the canonical component catalog. Stories are colocated with public components and document variants, states, controls, and generated prop tables. Global toolbar controls exercise light/dark appearances and built-in semantic themes through `BilisoundProvider`.

Storybook uses `@storybook/react-native-web-vite` because documentation, sharing, addons, and accessibility review are the immediate goal. The Expo showcase remains separate for native smoke testing; React Native Web rendering is not evidence of iOS or Android fidelity.

## Consumption And Transpilation

`packages/ui` is source-only inside the monorepo. Applications import `@bilisound/ui`; package exports resolve that name to `src/index.ts`. Do not import `packages/ui/src/*` through relative paths.

The consuming Expo application's Metro and Babel pipeline must transpile the source. This keeps Tamagui runtime/compiler analysis and React Native platform resolution in the application build instead of hiding them behind a generic library bundler. `packages/ui` has no `dist` contract and mobile development has no package build prerequisite.

The package-level `main` field points to `expo-router/entry` for the standalone Expo showcase. The `react-native`, `types`, and package `exports` fields point to the library source entry, so consumers do not execute showcase registration. Native Storybook scripts set `STORYBOOK_ENABLED=true`; Metro then redirects the entry to `index.ts` and enables Storybook transforms.

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
Button      primary/secondary/ghost/link variants, sm/md/lg sizes, icon/text forms, default/rounded shapes, disabled states
TextInput   sm/md/lg sizes, invalid and disabled states
Text        2xs-6xl sizes, bold/semiBold/italic/underline/strikeThrough/highlight variants, truncation, muted body base color
Heading     semantic h1-h6 tags on web via Tamagui `render`, legacy Gluestack size-to-tag mapping, header accessibility role on native
DualScrollView responsive two-column scrolling skeleton, header pane hidden below gtSm (661px), host-provided safe-area insets, caller-owned list column
HStack      horizontal layout primitive, xs-4xl gap scale via `space`, `reversed` row-reverse
Slider      controlled/uncontrolled values, multiple thumbs, disabled states
Switch      semantic controlled/uncontrolled control plus non-semantic SwitchVisual
Icon        locally bundled SVG registry generated from selected `@iconify-json` packages
ActionMenu  Tamagui Sheet presentation, responsive one/two-column items, hidden and disabled states
Modal       Tamagui headless Dialog composition with xs/sm/md/lg/full sizing and accessible title/description parts
AlertDialog Tamagui headless AlertDialog composition with explicit action/cancel semantics and matching responsive sizing
DropdownSelect TextInput-compatible chrome, controlled/uncontrolled single-value selection, ActionMenu below 640px, anchored dropdown from 640px
VStack      vertical layout primitive, xs-4xl gap scale via `space`, `reversed` column-reverse
```

The Slider keeps Tamagui's keyboard and accessibility behavior. A host using a vertical Slider on iOS must pass complete safe-area `insets` to `BilisoundProvider`.
The Switch uses `@tamagui/switch-headless` for state and accessibility behavior. `SwitchVisual` is pointer-disabled and accessibility-hidden so a shaped parent control can own the only interaction target and semantic role.
The ActionMenu owns the Sheet presentation but leaves action-driven dismissal to the caller. Its Icon names are a typed, generated registry; `packages/ui/scripts/extract-icons.mts` refreshes committed local SVGs without runtime network access.
Modal and AlertDialog preserve the current mobile overlay/content/header/body/footer visual structure while adopting Tamagui portals, focus management, dismissal behavior, and required title/description semantics.

## DOM Component Boundary

v3 needs `expo-dom` webviews for markdown and log content, and that content must keep the Bilisound design system. Tamagui works inside a DOM component, but nothing crosses the bridge implicitly.

A DOM component is bundled for `platform=web`, so Metro resolves the web Tamagui build (`@tamagui/core/dist/esm/index.mjs`, `constants.mjs`, `react-native-web`). That is Tamagui's most mature target: CSS injection, `t_light`/`t_dark` theme classes, tokens, portals, Sheet, Popover, and keyboard/ARIA behavior all work in the webview.

What does not cross the webview boundary:

```txt
TamaguiProvider / BilisoundProvider   separate JavaScript context
updateUserTheme registry mutations    separate module instance
safe-area insets                      webview viewport has no notch data
expo-font registered families         Roboto/Poppins do not exist in the webview
Platform.OS / isWeb branches          always resolve to the web path
```

### Contract

`BilisoundDomProvider` is the design-system root for `"use dom"` components. It is not interchangeable with `BilisoundProvider`: it builds its own Tamagui config, injects its own CSS, and supplies `SafeAreaInsetsContext` from host-provided values.

The host passes a single `DomTheme` prop. Every field is JSON-serializable because DOM props are marshalled as JSON:

```txt
appearance    light | dark
theme         classic | red | user
userPalette   required for theme: "user"
fontFamily    CSS stack that resolves inside the webview
insets        measured by the native host
```

The initial user palette is baked into the config through `createBilisoundConfig({ userPalette })`, so `light_user`/`dark_user` are correct on first paint instead of flashing the classic palette. The config remains stable for the lifetime of the webview. Live `userPalette` changes must use `updateUserTheme`; rebuilding the config does not replace Tamagui's already-injected theme CSS. `BilisoundDomProvider` owns both paths.

`appearance`, `theme`, `userPalette`, and `insets` may change through normal DOM prop updates. `fontFamily` is initialization-only because Tamagui injects the font variables once; remount the DOM component to change it. `createBodyFont(family)` and `createBilisoundConfig({ fontFamily })` parameterize the initial family. A DOM component using a bundled font must also declare a matching `@font-face` inside the webview; passing a family alone does not load it.

### Cost

Measured minified Metro DOM bundle size for one component on this tree:

```txt
plain <div> component                269 KB raw / 81 KB gzip
Tamagui + @bilisound/ui             1184 KB raw / 316 KB gzip
```

Roughly 235 KB gzip extra per DOM bundle, and each webview loads its own copy with no sharing with the native bundle. Import only the components a webview actually needs. v3 markdown and log views should mount `BilisoundDomProvider` so their typography, surfaces, borders, semantic colors, user palette, and safe-area behavior match the app; their content renderer may still use efficient plain DOM elements such as `<article>`, `<pre>`, and `<code>`. The current v2 `LogViewerDom` need not migrate before Epic 7.

### Integration Timing

This is package-local foundation work. Wiring DOM components into `apps/mobile` screens remains Epic 7 UI-rewrite work, and `apps/mobile` currently has no Tamagui dependency: `@tamagui/core` and `@bilisound/ui` do not resolve from there, so the peer set must be installed before a mobile DOM component can consume this bridge. `@expo/dom-webview` is already present.

## Verification

```sh
pnpm -C packages/ui typecheck
pnpm -C packages/ui build:storybook
pnpm -C packages/ui exec expo export --platform web --clear --output-dir ../../.temp/ui-web-export
pnpm -C packages/ui exec expo export --platform android --clear --output-dir ../../.temp/ui-android-export
```

## Next Boundaries

1. Add focused token/theme tests, especially proving dark themes do not reverse user palettes.
2. Add accessibility and interaction tests for each public component.
3. Establish a visual regression matrix for iOS, Android, desktop Web, and narrow Web.
4. Add new components one at a time; keep screen-specific business policy out of recipes and components.
5. Evaluate the Tamagui compiler separately after runtime integration and public contracts stabilize.
6. Validate the DOM boundary in a real WKWebView/Android WebView via the dev client. Current evidence covers Metro DOM bundling plus Chromium rendering of that bundle; the native webview shell (`matchContents` auto-height, live inset changes) is unverified.
