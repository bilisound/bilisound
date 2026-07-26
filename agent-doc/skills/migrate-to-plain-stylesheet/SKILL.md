---
name: migrate-to-plain-stylesheet
description: Use whenever the user asks to migrate React Native or Expo UI styling from NativeWind, Tailwind className strings, inline utility styles, Gluestack UI wrappers, or other utility-class styling into plain React Native StyleSheet.create styles. Also use when replacing Gluestack components with local ui-next components, reviewing or fixing regressions after such a migration, especially visual spacing, lineHeight, safe-area, flex layout, tab/navigation layout, accessibility labels, or platform-specific portrait/landscape differences. This skill requires visual before/after verification with agent-device whenever the affected UI can be run on a simulator, emulator, or device.
---

# Migrate to Plain StyleSheet

Move UI code from utility-class styling to plain `StyleSheet.create` without changing the rendered layout.

Utility classes encode defaults that are easy to drop when translating property-by-property (line height, gap, shrink behavior, safe-area insets, platform selectors). Preserve the visual and interaction contract, not just the property names. Translating the classes correctly is the easy half; the rules below cover the project-specific half.

## Project Rules

- **Landing zone**: new shared components go in `apps/mobile/components/ui-next/`. Keep it free of `nativewind`, `@gluestack-ui/*`, `className`, and compatibility glue unless the user asks for an adapter.
- **Do not clone the old API.** Replace Gluestack wrapper triples (`Input` + `InputField` + `InputSlot`) with a purpose-built component that owns the native element and its adornments. Add compatibility adapters only for a concrete external consumer.
- **Theme tokens**: do not import Gluestack/NativeWind provider internals into `ui-next` — that keeps the new component tied to the old stack. Use a small pure token reader and let the old provider adapt those tokens separately.
- **React 19**: accept `ref` as a normal prop; do not reach for `forwardRef`.
- **Keep business logic in the screen.** Validation and form-controller wiring are not reusable UI behavior.
- **Do not redesign while migrating** unless the user asks. Keep interaction grouping stable — do not split one `Pressable` into several hit targets to simplify flex.

## Visual Verification Is Required

Source values do not prove rendered output. An outer `width: 40` can still inspect as `24` if the measurable child is the icon wrapper.

Use `agent-device` whenever the app can run, capturing before **and** after for every affected layout branch. Write artifacts to the repo-root `.temp/`, not `/tmp` (see `AGENTS.md`):

```txt
.temp/<feature>-portrait-before.png
.temp/<feature>-landscape-after.png
```

Confirm the app under test is the intended build. Dev clients, production apps, and stale bundles look alike while testing the wrong code.

When inspector numbers look wrong, check whether it selected an inner child before changing the structure. Fix the tree only if the hittable or accessible target is genuinely wrong.

## Workflow

1. **Scope it.** If the user named one file, check it for responsive branches before editing. Look for portrait/landscape, tablet and wide layouts, `.web`/platform branches, overlays and bottom sheets, pressed/ripple/hover states, safe-area and tab containers, and existing accessibility semantics.
2. **Baseline screenshots**, per above.
3. **Translate in small batches.** Preserve accessibility as you go — `accessibilityLabel`, `accessibilityRole`, `accessibilityHint`, and stable labels on icon-only controls. Android ripple stays `android_ripple` rather than becoming hover styling. Where a form field has both a container size and a field size, keep both; do not derive font size from container height.
4. **Compare after screenshots** against the baseline: spacing, text baseline, truncation, aspect ratio and clipping, safe-area padding, tab bars and side rails, hit target sizes.
5. **Verify and report.** Run formatting on changed files, plus typecheck/lint (both are currently healthy — see `agent-doc/verification.md`). Grep the migrated slice to prove `nativewind`, `@gluestack-ui/*`, and `className` are gone. Report files changed, the preserved contract, screenshot paths, checks that could not run and why, and any pre-existing failures left untouched.

If you are fixing a regression from an earlier migration, diff against the last good version with `git show HEAD:<path>` before changing values. A component may have had `h-12` with a nested `text-base` — a 48px container with 16px text, not an xl field.

## Project-Specific Failure Patterns

**Landscape breaks, portrait is fine.** A different component path or breakpoint branch is in play. Search for tablet, wide, side-rail, and landscape variants and verify each with agent-device.

**Layout shifts near a side rail.** Safe-area padding and fixed rail width were mixed inconsistently, or page content and the tab rail use different breakpoint thresholds. Use one breakpoint decision per layout mode and make content offset, tab inset context, and rail width agree.

**New component recreates the old library.** The migration tried to preserve source compatibility. Prefer a narrower API that models the product interaction.
