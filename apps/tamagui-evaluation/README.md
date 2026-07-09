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

- Tamagui UI base integration with Expo 57, React 19, and React Native 0.86.
- `tamagui` plus `@tamagui/config/v5` setup through `TamaguiProvider`.
- Tailwind-like 50-950 palettes mapped into Tamagui's 12-step `color1` to `color12` and UI-kit semantic keys.
- User theme switching through sub-themes like `light_bilisound`, `dark_tailwindRose`, and `dark_user`.
- Runtime theme mutation through `@tamagui/theme`'s `updateTheme` for custom-theme preview flows.
