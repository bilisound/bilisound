# Tamagui Evaluation Notes

## Scope

This evaluation is intentionally isolated in `apps/tamagui-evaluation`. It is a UI technology spike for the later Bilisound v3 UI rewrite phase, not a migration of the current `apps/mobile` screens.

The intended v3 direction is to retain useful Bilisound design-system semantics, component contracts, and interaction patterns while refreshing their visual implementation. Tamagui remains an implementation detail below that app-owned boundary.

## Package Boundary

- `@tamagui/core` provides typed styling, tokens, themes, responsive props, and core layout/text primitives.
- `@tamagui/button` is used with `unstyled` so its behavior and web element handling remain available without adopting Tamagui's default component skin.
- `@tamagui/config` and the aggregate `tamagui` UI package are intentionally not used by this spike.
- Components rendered by the app come from `src/design-system.tsx` or directly from Core primitives. Screens should not depend on Tamagui's default visual conventions.

## Color Architecture

The revised spike has two explicit layers:

1. Primitive palettes use canonical Tailwind CSS names and values with exactly 11 stops: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, and `950`.
2. Themes expose Bilisound semantic values such as `canvas`, `surface`, `text`, `textMuted`, `border`, `buttonBackground`, `buttonBorder`, and `buttonText`.

There are no `color1` through `color12` theme values and no synthetic `975` stop. The application does not adapt its palettes to Tamagui's default theme-builder shape.

## Light And Dark Themes

Light and dark themes consume the same unchanged primitive accent scale, but each appearance owns an independent semantic mapping.

For example:

- Light primary buttons use accent `600` for the background and accent `700` for the border.
- Dark primary buttons use accent `400` for the background and accent `300` for the border.
- Surface, typography, border, hover, press, and focus values are selected independently for each appearance.

Dark mode never reverses the palette. Numeric stops preserve the same meaning in both appearances, making semantic intent and contrast explicit.

## User Themes And Dynamic Skinning

User-defined themes remain supported:

- A seed color generates one OKLCH-based scale with the standard Tailwind shade names.
- `createSemanticTheme(scale, "light")` and `createSemanticTheme(scale, "dark")` independently map that same scale into semantic values.
- `updateTheme` replaces `light_user` and `dark_user` at runtime for live preview.
- Button foreground colors are selected by comparing contrast against light and dark text candidates.

Dynamic themes are client-side only and ignored on the server. A persisted custom theme should therefore be registered under stable `light_user` and `dark_user` names during application bootstrap before the first meaningful UI render.

## Design-System Fit

This approach is compatible with Bilisound retaining most of its existing design system:

- Product-facing component names and variants can remain app-owned.
- Primitive Tailwind scales can be retained without exposing numeric stops to screens.
- Visual styling can change for the intended 2026 direction without changing feature APIs.
- `unstyled` Tamagui UI components can supply behavior where useful, while Bilisound semantic values control every visual state.

Complex component variants, animations, safe-area behavior, and platform adaptations still require component-by-component migration. This is a design-system implementation rewrite, not a mechanical `className` conversion.

## Verification

- `pnpm -C apps/tamagui-evaluation typecheck`
- `pnpm -C apps/tamagui-evaluation exec expo export --platform web`
- Desktop and mobile-width browser checks of palette switching, runtime user themes, and responsive semantic-theme previews

## Recommendation

Tamagui Core plus selectively unstyled Tamagui UI components is a viable foundation for the Bilisound v3 design-system implementation.

The next useful evaluation step is to wrap one behavior-heavy component such as Dialog or AlertDialog in Bilisound-owned semantic styling, then verify its focus management, accessibility, animation, and native/web adaptations.
