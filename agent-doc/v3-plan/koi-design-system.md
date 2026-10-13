# Koi Design System Adoption (Deferred)

> **Status (2026-10-14): deferred.** This records a decision and its findings so the work can resume later.
> Nothing in `packages/ui` or `apps/mobile-next` changes for Koi until it does. Koi itself is developed in
> [tcdw/koi-ui](https://github.com/tcdw/koi-ui); facts about it below are as of koi-ui commit `9e7e335`.

## Why

`@bilisound/ui` (the Tamagui library behind `apps/mobile-next`) works, but its style isn't distinctive enough: its
tokens are Tailwind scales picked by formula (`createChromaticButtonScheme` and friends), with no brand of its own.
Writing Tamagui code is not the problem.

[Koi](https://github.com/tcdw/koi-ui) is tcdw's design system, with a defined identity: pill controls, frosted glass,
rounded shapes, spring motion, a brand book and a spec per component, and contrast checked in both themes. It is
meant to serve several apps on web and native, Bilisound among them.

## Target Architecture

```txt
@koi/tokens   one tokens.json: role tokens, palettes, contrast pairs (exists)
@koi/core     each component's props contract, copy and pure helpers, no DOM (exists)
@koi/react    DOM web apps: Base UI + Panda CSS (exists; not for Bilisound)
@koi/native   Expo apps: Tamagui, iOS / Android / Expo web (not started)
```

- Bilisound would take its generic components (Button, Switch, Checkbox, Dialog / AlertDialog, inputs, Select,
  Toast…) from `@koi/native`, on the same Tamagui line as `apps/mobile-next` (2.4.x).
- Bilisound-specific components (`PageShell`, `DualScrollView`, `ActionMenu`, the player UI) stay in
  `@bilisound/ui`, rebuilt on Koi's tokens and themes.
- Expo web keeps rendering through Tamagui, as in [Epic 7](./epic-7-plan.md#framework-decision). Koi checks that
  `@koi/native` and `@koi/react` look the same by comparing screenshots of both in a browser.
- Consumption: a pnpm `link:` to a local koi-ui checkout while developing; an npm package once Koi publishes.

## User Theme Palettes

Bilisound keeps user-selectable theme colors. Koi supports this:

- Koi's `Palette` is `{ primary, accent }`, each an 11-shade scale of `#rrggbb` (or `rgba()`) values. That is the
  same shape as `ThemePalette` in `packages/ui/src/design-token/types.ts`, so stored user themes carry over.
- `@koi/tokens/palette` has `createColors(palette, theme)` (every role token's color under any palette, for building
  Tamagui themes) and `checkPalette(palette)` (the contrast pairs a palette fails, in either theme).
- Only `primary-*` and `accent-*` swap. Koi's neutral, warning and error scales stay fixed. Koi's accent roles
  assume a color that is bright at step 400 (its solid accent button is step 400 with step-950 text).

Bilisound's current palettes against Koi's contrast pairs (text needs 4.5:1, control edges and focus rings 3:1):

| Palette          | Failures     | Worst                                                                                                                   |
| ---------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `classicPalette` | 5, all light | focus ring on muted surfaces 2.83–2.86:1; `text-brand` on `surface-muted` 4.24:1; `primary-fg` on `primary-soft` 4.22:1 |
| `redPalette`     | 1            | dark `control-checked` on `surface-muted` 2.93:1                                                                        |

Both are close, but palettes generated from cover images (`apps/mobile-next/features/theme/color-scale.ts`) will often miss.
Koi can only report failures today, not fix them, so an automatic fix-up (shifting a failing scale until every
pair passes) is a prerequisite.

## API Differences To Settle

- Button: Bilisound has `primary | accent | neutral | positive | negative` × `solid | outline | ghost | link`;
  Koi has `primary | accent | secondary | warning | error` × `solid | soft | outline | ghost`. With Koi, Koi's
  `@koi/core` props are the contract and Bilisound adapts.
- Koi has no Slider, Sheet / ActionMenu, Text / Heading or stack primitives yet; `@bilisound/ui` has them.

## Before Resuming

On the Koi side, in roughly this order:

1. Component dimensions in Koi's `tokens.json`, so Panda and Tamagui read the same numbers.
2. A Tamagui config (tokens and light / dark themes per palette) generated from `tokens.json`.
3. An `@koi/native` spike: Button, Switch and Dialog, with screenshot parity against `@koi/react`.
4. Palette fix-up for user palettes that fail `checkPalette()`.
5. The components Bilisound needs that Koi lacks (see above), and the link / publish setup.

Then, in Bilisound: decide which `@bilisound/ui` components Koi replaces, map the Button API, and move user themes
onto Koi palettes.
