# Tamagui Evaluation Notes

## Scope

This evaluation is intentionally isolated in `apps/tamagui-evaluation`. It is a UI technology spike for the later Bilisound v3 UI rewrite phase, not a migration of the current `apps/mobile` screens.

Relevant v3 constraint: the current UI is still coupled to player, SDK DTOs, SQLite rows, storage keys, and settings internals. Tamagui should not drive the business-boundary refactor. The useful migration point is after feature hooks, use cases, and view models exist.

## Documentation Findings

- `tamagui` is the full UI-kit package and is a superset of `@tamagui/core`.
- Tamagui UI requires a root `TamaguiProvider`; the UI kit uses it for portals such as dialogs and popovers.
- Current docs recommend `@tamagui/config/v5` as the starting config. It includes sensible defaults, Tailwind-aligned shorthands, and a complete theme system.
- Tamagui 2 requires React Native 0.81+ with New Architecture for native apps, React 19+, and TypeScript 5+. The current Bilisound mobile baseline, Expo 57 / RN 0.86 / React 19, satisfies that requirement.
- Expo integration can work without custom bundler setup at first. The compiler and Babel plugin are optional performance optimizations, not required for this spike.
- `TamaguiProvider` should receive `defaultTheme` directly instead of wrapping the whole app with `<Theme>` only; this supports faster native light/dark changes.

## Tailwind Palette Compatibility

Tailwind palettes map reasonably well into Tamagui, but they are not shape-identical.

Tailwind has 11 named stops (`50` through `950`). Tamagui theme-builder and v5-style themes commonly expect a 12-step palette (`color1` through `color12`) plus semantic UI keys used by `tamagui/ui` components.

This spike uses a direct adapter:

- Tailwind-like stops are represented as a 12-item scale by adding an explicit foreground endpoint.
- `color1` to `color12` expose the raw scale for component-level usage.
- Semantic keys map onto the same scale: `background`, `backgroundHover`, `backgroundPress`, `color`, `borderColor`, `placeholderColor`, `outlineColor`, and `shadowColor`.
- `light_*` and `dark_*` sub-themes make `theme="tailwindRose"` resolve under the active base scheme.

Compatibility conclusion: Tailwind color data can be reused, but Bilisound should own a small palette adapter instead of treating Tailwind tokens as Tamagui themes directly. The adapter needs contrast rules, dark-scale reversal rules, and semantic-key assignment.

Practical integration note: Tamagui theme objects must contain theme values such as strings, numbers, or Tamagui variables. Raw palette arrays should stay outside `themes`; this spike keeps them in `paletteScales` and generates separate Tamagui-compatible theme objects.

## `tamagui/ui` Theme Shape

The full `tamagui` UI kit expects conventional theme keys for default component styling:

- `background`, `backgroundHover`, `backgroundPress`, `backgroundFocus`
- `borderColor`, `borderColorHover`, `borderColorPress`, `borderColorFocus`
- `color`, `colorHover`, `colorPress`, `colorFocus`
- `shadowColor`, `placeholderColor`, `outlineColor`

If Bilisound adopts Tamagui UI components, the design-system layer should generate these keys for every app theme. Otherwise, components will need excessive per-instance style overrides.

## User Themes And Dynamic Skinning

Tamagui supports three useful levels for Bilisound's custom-theme needs:

1. Static built-in themes in `tamagui.config.ts`, such as `light_bilisound` and `dark_tailwindSky`.
2. Contextual theme switching with `<Theme name="...">` and component `theme` props.
3. Client-side dynamic mutation through `@tamagui/theme` helpers: `addTheme`, `updateTheme`, and `replaceTheme`.

Dynamic theme notes:

- `updateTheme` is suitable for live preview after the user edits colors.
- In Tamagui 2.4.2, `updateTheme` uses an object signature: `updateTheme({ name, theme })`.
- Dynamic themes are client-side only and ignored on the server, so SSR web output cannot depend on user-generated runtime themes being present during server render.
- For persisted custom themes, Bilisound should load saved theme data before or during app bootstrap and register a stable `light_user` / `dark_user` theme before the first meaningful UI render.
- For Expo native, runtime theme mutation is acceptable for settings previews, but the app should avoid putting business configuration reads directly inside presentational components.

Compatibility conclusion: Tamagui is compatible with user-defined themes and dynamic skinning, but the robust architecture is `features/config` owns persisted appearance preferences, while a UI design-system boundary translates them into Tamagui themes.

## Migration Risk

- Do not start by porting current `apps/mobile` screens. That would preserve existing coupling in a different UI library.
- Tamagui's component theme system is powerful but opinionated. If Bilisound wants arbitrary user themes, the palette adapter and contrast algorithm should be treated as product code, not incidental styling.
- `@tamagui/config/v5` defaults `onlyAllowShorthands` to `true`. This is good for new Tamagui code, but it makes incremental migration from existing React Native style names noisier. This spike sets it to `false` to evaluate Tamagui with long-form style props.
- Compiler setup should be evaluated separately after base runtime integration. It can improve web/native performance but adds Metro/Babel complexity.
- Existing NativeWind utility classes and Tamagui shorthands are conceptually close, but not mechanically equivalent. A migration would still be a component rewrite.

## Verification

- `pnpm -C apps/tamagui-evaluation typecheck`
- `pnpm -C apps/tamagui-evaluation exec expo export --platform web`
- `pnpm -C apps/tamagui-evaluation android` builds and installs successfully with JDK 21. The script pins Expo to port `8082` to avoid colliding with `apps/mobile` on `8081`.

## Recommendation

Tamagui is viable for a Bilisound v3 UI rewrite candidate.

Recommended next steps:

1. Keep this evaluation app isolated while v3 business boundaries continue.
2. Build a small Bilisound design-system package or folder around Tamagui tokens, palette adapters, and theme generation before porting screens.
3. Prototype one future v3 screen using only view models and feature hooks, not SQLite rows, SDK DTOs, or player native APIs.
4. Evaluate Tamagui compiler and CSS extraction after the runtime API shape is accepted.
