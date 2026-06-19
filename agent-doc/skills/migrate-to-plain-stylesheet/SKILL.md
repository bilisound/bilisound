---
name: migrate-to-plain-stylesheet
description: Use whenever the user asks to migrate React Native or Expo UI styling from NativeWind, Tailwind className strings, inline utility styles, or other utility-class styling into plain React Native StyleSheet.create styles. Also use when reviewing or fixing regressions after such a migration, especially visual spacing, lineHeight, safe-area, flex layout, tab/navigation layout, or platform-specific portrait/landscape differences. This skill requires visual before/after verification with agent-device whenever the affected UI can be run on a simulator, emulator, or device.
---

# Migrate to Plain StyleSheet

Use this skill to move UI code from utility-class styling to plain React Native `StyleSheet.create` without silently changing the rendered layout.

The core risk is that className migration looks mechanical but is not purely mechanical. Utility classes often encode defaults such as `lineHeight`, display direction, gap, shrink behavior, safe-area padding, and platform-specific selectors. Preserve the visual and interaction contract, not just the apparent property names.

## Required Mindset

Prefer a narrow migration that preserves behavior. Do not redesign the UI while migrating styles unless the user explicitly asks for a redesign.

Treat screenshots, inspector measurements, and accessibility snapshots as source material. Source code values are not enough: an outer `width: 40` can still render or inspect as a smaller inner node if the measurable child is only `24`.

## Workflow

### 1. Establish Scope

Identify the exact components, screens, and states being migrated.

Check for:

- Portrait and landscape variants
- Phone, tablet, and wide layouts
- iOS, Android, and web branches
- Bottom sheets, modals, menus, and hidden stateful overlays
- Pressable/ripple/hover/active states
- Safe-area and tab/navigation containers

If the user only named a file, inspect the file for responsive branches before editing.

### 2. Capture Baseline Visual Evidence

Before editing styles, use `agent-device` when the app can run.

Follow the installed `agent-device` workflow, including version/help checks if this is the first use in the session.

Capture at least:

- A screenshot of the affected screen before migration
- An interactive snapshot with coordinates when spacing, sizing, safe-area, or hit target sizes matter
- Separate screenshots for each relevant layout branch, usually portrait and landscape

Save screenshots with clear names such as:

```txt
/tmp/<feature>-portrait-before.png
/tmp/<feature>-landscape-before.png
/tmp/<feature>-portrait-after.png
/tmp/<feature>-landscape-after.png
```

Make sure the app under test is the intended package or build. Dev clients, production apps, launchers, and stale bundles can all look similar while testing the wrong code.

### 3. Translate Styles Conservatively

Map utility classes to `StyleSheet.create` in small batches.

Preserve these commonly missed details:

- `text-xs`, `text-sm`, etc. imply both `fontSize` and `lineHeight`; do not migrate only `fontSize`
- `flex-1` may need `minWidth: 0` or `minHeight: 0` when children must shrink/truncate
- `flex-0`, `basis-auto`, and fixed-size controls may need `flexShrink: 0`
- `aspect-video` can be kept as `aspectRatio: 16 / 9` unless inspector/hit target behavior requires a fixed width
- `size-10` maps to both `width: 40` and `height: 40`
- `gap-*` is layout gap, not padding or margin
- safe-area utility classes must become explicit safe-area inset styles, and the parent width may need to include insets
- hover/active classes should become `Pressable` state styles only when that state exists on the target platform
- Android ripple styles should remain `android_ripple` instead of being replaced with hover-only styling

Keep interaction structure stable. Do not split one `Pressable` into multiple buttons just to make flex easier unless the UX should genuinely expose multiple hit targets.

### 4. Preserve Rendered Nodes and Hit Targets

After migration, inspect both the source and the rendered tree.

For buttons and controls, verify:

- The intended clickable node is still the clickable node
- The visual icon is centered inside the touch target
- Inspector measurements match the intended node, not a smaller inner icon wrapper
- Labels, icons, and artwork remain grouped as before when they were one interaction

If inspector measures an unexpectedly small size, determine whether it selected an inner child. Fix the rendered structure only if the measurable or accessible target is genuinely wrong.

### 5. Compare Before and After

Run the app after the migration and capture matching screenshots.

Compare:

- icon/label spacing
- text baseline and line-height
- truncation behavior
- image aspect ratio and clipping
- safe-area padding on notched devices and gesture navigation
- tab bars and side rails in portrait and landscape
- hit target sizes for play, pause, close, tabs, and list rows

When visual differences appear, prefer targeted fixes that restore the previous contract. Examples:

- Add `lineHeight` when text boxes became taller
- Add `minWidth: 0` when text truncation or flex rows collapse
- Add `flexShrink: 0` when fixed-size buttons or artwork shrink unexpectedly
- Reuse one breakpoint constant when related layout branches switch together
- Include safe-area in a rail/container width when padding and content width otherwise fight

### 6. Verify and Report

Run the smallest relevant verification:

- Formatting for changed files
- Typecheck or lint if practical and already healthy enough to be useful
- Device screenshot verification for every affected layout branch

In the final report, include:

- Files changed
- The preserved interaction/layout contract
- Before/after screenshots or paths
- Known checks that could not run, with the real reason
- Any unrelated existing failures or dirty worktree changes left untouched

## Common Failure Patterns

### Text Gap Looks Larger After Migration

Likely cause: `fontSize` was migrated without `lineHeight`.

Fix by matching the old utility class scale. For example, Tailwind `text-xs` is commonly `fontSize: 12` with `lineHeight: 16`.

### Button Measures Smaller Than Its Style

Likely cause: inspector selected an inner icon wrapper or SVG node.

Check the coordinate snapshot. If the accessible/hittable node is too small, make the wrapper match the intended touch target. If only the SVG glyph is small but the button target is correct, do not inflate the glyph just to satisfy a misleading selection.

### Landscape Breaks But Portrait Is Fine

Likely cause: a different component path or breakpoint branch is used.

Search for tablet, wide, side rail, landscape, and breakpoint-specific variants. Verify each branch separately with agent-device.

### Layout Looks Shifted Near a Side Rail

Likely cause: safe-area padding and fixed rail width were mixed inconsistently, or page content and tab rail use different breakpoint thresholds.

Use a single breakpoint decision for the related layout mode and ensure content offset, tab inset context, and rail width agree.

## Migration Checklist

- Baseline screenshots captured before editing
- Relevant portrait and landscape branches identified
- Utility classes translated with line-height, flex shrink, basis, gap, and safe-area semantics preserved
- Interaction grouping preserved unless intentionally changed
- After screenshots captured with the same app/build and comparable state
- Visual differences investigated with coordinate snapshots when needed
- Formatting and relevant static checks run
- Final response includes screenshot paths and residual risks
