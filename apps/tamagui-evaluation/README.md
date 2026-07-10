# Tamagui Evaluation

This app is an isolated Bilisound v3 UI technology spike. It does not import `apps/mobile` code and should stay disposable until the v3 business boundaries are stable enough for a UI rewrite.

## Run

```bash
pnpm -C apps/tamagui-evaluation install
pnpm -C apps/tamagui-evaluation web
pnpm -C apps/tamagui-evaluation android
pnpm -C apps/tamagui-evaluation typecheck
```

The native dev server uses port `8082` so it can run beside the main `apps/mobile` Expo server on `8081`.

## What This Evaluates

- `@tamagui/core` with an app-owned Bilisound design-system layer.
- `@tamagui/button` in `unstyled` mode instead of Tamagui's default visual styles.
- Canonical Tailwind CSS color scales with the standard `50` through `950` stops.
- Semantic theme values such as `canvas`, `surface`, `text`, `border`, `buttonBackground`, `buttonBorder`, and `buttonText`.
- Independent light and dark semantic mappings derived from the same primitive palette without reversing its stops.
- Runtime user-theme mutation through `@tamagui/theme`'s `updateTheme`.
- OKLCH generation of custom user palettes using the standard Tailwind shade names.
