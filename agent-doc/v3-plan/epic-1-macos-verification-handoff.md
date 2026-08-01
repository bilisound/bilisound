# Epic 1 macOS / iOS Verification Handoff

This document was written as a directly executable task brief for an agent running on macOS.
The task completed on 2026-08-02 and the runbook is retained for reproducibility. The
completion evidence is summarized below and in `player-foundation.md`.

## Mission

This task closed the platform-specific verification gap left by Bilisound v3 Epic 1 by
compiling and exercising the latest iOS player occurrence manager, shuffle transport routing,
and atomic queue transaction introduced by implementation commit `030c29f`.

The implementation was already delivered on TypeScript, Web, and Android. The macOS task did
not redesign it and preserved these contracts:

- The public queue is canonical and never physically shuffled.
- `@bilisound/player` owns occurrence identity and playback order.
- Duplicate business media IDs are distinct queue occurrences.
- App next/previous, natural completion, and system media controls traverse one stable order.
- `setQueueWithOptions` atomically replaces the queue and applies canonical index, position
  in seconds, and playback intent.
- Mobile code must not gain iOS-specific queue or shuffle workarounds.

## Completion Record

Status: **complete** on an iPhone 17 Simulator running iOS 26.5 with Xcode 26.6.

The current iOS module built, the Expo Dev Client launched, and the complete runtime matrix
passed: stable shuffled next/previous, duplicate occurrences, queue mutations, natural
completion, Repeat ONE/ALL, system MediaRemote next/previous, paused startup restoration, and
atomic playlist replacement at canonical index 2.

The pass found and fixed two native integration defects: an empty
`getCurrentTrackIndex()` lookup now resolves `-1`, and `next()` at the end of the playback
order now resolves as a no-op. Both behaviors match Android and Web. Exact commands,
transitions, environment, and evidence paths are recorded in
[player-foundation.md](./player-foundation.md#ios-completion-verification-iphone-17-simulator-ios-265-2026-08-02).

Simulator Control Center did not expose a Music/Now Playing tile, so a signed helper invoked
the system MediaRemote next/previous commands directly. Physical hardware and a real headset
button remain unverified.

## Required Reading

Read these files before editing:

1. `AGENTS.md`
2. `agent-doc/mobile-debugging.md`
3. `agent-doc/verification.md`
4. `agent-doc/v3-plan/README.md`
5. `agent-doc/v3-plan/epic-breakdown.md`
6. `agent-doc/v3-plan/player-foundation.md`, especially Slices G-I and the Test Matrix
7. `agent-doc/v3-plan/agent-handoff-guide.md`
8. `packages/player/README.md`

Primary implementation files:

```txt
packages/player/ios/PlaybackOrderManager.swift
packages/player/ios/BilisoundPlayerModule.swift
packages/player/src/playback-order-manager.ts
packages/player/src/player.ts
packages/player/src/types/index.ts
packages/player/src/types/module.ts
apps/mobile/features/playback/queue-persistence.ts
apps/mobile/features/playback/track-operations.ts
```

## Preconditions

From the repository root:

```bash
git status --short
git merge-base --is-ancestor 030c29f HEAD
node --version
pnpm --version
xcodebuild -version
xcrun simctl list devices available
```

Requirements:

- `030c29f` must be an ancestor of `HEAD`.
- The worktree must not contain unrelated changes. Preserve any user changes that are
  present; do not reset or overwrite them.
- Use the Expo Dev Client, bundle ID `moe.bilisound.app.dev`; do not use Expo Go.
- Prefer an available `iPhone 17` Simulator to match the earlier verification. Another
  available iPhone Simulator is acceptable if the exact model is unavailable.
- Store screenshots, logs, and other temporary evidence under repository-root `.temp/`.

Check `apps/mobile/ios/.xcode.env.local` before building. A previous local file referenced a
removed Homebrew Node path. Ensure `NODE_BINARY` resolves to the current `command -v node`.
This file is machine-local and must not be committed.

If dependencies are absent, run:

```bash
pnpm install --frozen-lockfile
```

## Baseline Checks

Run these before the native build so TypeScript failures are separated from Xcode failures:

```bash
pnpm -C packages/player test -- --runInBand
pnpm -C packages/player build
pnpm -C apps/mobile exec tsc --noEmit
```

Expected baseline:

```txt
player Jest: 2 suites, 9 tests pass
player build: success
mobile tsc: success
```

If the expected test count changes because newer commits legitimately add tests, require all
current player tests to pass instead of forcing the old count.

## Build and Launch

Long-running Metro processes must be managed by the harness or `agent-device`; do not run an
unbounded foreground server. One supported preparation command is:

```bash
EXPO_PUBLIC_ENV=development agent-device metro prepare \
  --project-root apps/mobile \
  --kind expo \
  --public-base-url http://127.0.0.1:8081 \
  --port 8081
```

Build, install, and open the native dev client:

```bash
EXPO_PUBLIC_ENV=development \
  pnpm -C apps/mobile exec expo run:ios --device "iPhone 17" --no-bundler
```

Then open or relaunch it through a dedicated session:

```bash
agent-device open moe.bilisound.app.dev \
  --platform ios \
  --session bilisound-ios \
  --relaunch
```

If `agent-device` syntax differs on the installed version, read its current `help workflow`
and command-specific help, then use the equivalent supported command. Do not substitute Expo
Go.

Known local build issue:

```txt
Symptom: Xcode script phase cannot execute an old /opt/homebrew/Cellar/node/... path.
Cause: stale apps/mobile/ios/.xcode.env.local.
Fix: point NODE_BINARY at the active node executable and rebuild.
```

## Runtime Verification

Use a queue with at least four distinguishable tracks. Prefer a queue containing two
occurrences with the same business media ID; adding the same track twice is acceptable.
Record the canonical queue order before enabling shuffle.

Run the following matrix. Capture the observed titles/indices and screenshots or logs under
`.temp/`.

### Stable shuffle order

1. Start paused; enable shuffle. The current track and progress must not change.
2. Press next twice and record targets `A` and `B`.
3. Press previous once. It must return exactly to `A`.
4. Disable shuffle. The next action must follow the canonical neighbor of the current item.
5. Repeat enable/disable once while playing. Playback intent and progress must be preserved.

### Duplicate occurrences and queue mutations

1. Put the same business media item into the queue at least twice.
2. Enable shuffle and traverse one complete cycle.
3. Every queue occurrence must be visited exactly once; duplicate IDs must not collapse.
4. Add one track while shuffled. Existing occurrence order must remain valid and the new
   occurrence must be reachable once.
5. Replace the current track metadata or refreshed URL. Current canonical index, playback
   position, and occurrence identity must remain stable.
6. Remove one occurrence. Remaining occurrences must still form a valid reversible sequence.

### Natural completion and repeat modes

1. In shuffle mode, record the explicit next target from a chosen current track, then return
   to that current track.
2. Seek near the end and let it complete naturally. The target must equal the recorded
   explicit next target, even when that target is not the canonical neighbor.
3. With `RepeatMode.ONE`, natural completion must repeat the current occurrence.
4. With `RepeatMode.ALL`, completion at the end of the playback order must wrap to the first
   occurrence in that same order.

### External media controls

Exercise Control Center, lock-screen, or headset next/previous controls while shuffle is on:

1. Record the app next target from a chosen current track and return to the current track.
2. Invoke external next. It must select the same target.
3. Invoke external previous. It must return exactly to the prior occurrence.
4. Confirm the UI, current-track hook, and now-playing metadata all agree after each action.

The iOS accessibility tree may collapse the player bottom sheet into one node. If so, take a
fresh screenshot, use coordinates derived from that screenshot, and verify results from app
logs and visible title changes. Do not reuse stale coordinates across layouts.

### Atomic queue transaction

Verify the mobile integration through real app flows:

1. Select a nonzero canonical queue index, leave shuffle enabled, pause, and restart the app.
2. Startup restore must select the same canonical track, stay paused, and reapply shuffle.
3. Replace the queue by playing another playlist. The requested canonical index must be
   selected without exposing an intermediate empty/old queue to hooks.
4. Confirm queue/current-track events agree with the final transaction state.

Also confirm the API contract from `packages/player/src/player.ts`:

```ts
setQueueWithOptions(tracks, {
  beginIndex: 0,
  position: 0,
  preservePlaybackState: false,
});
```

`beginIndex` is canonical, `position` is seconds, and invalid options must reject before the
platform operation. If no production UI flow uses `preservePlaybackState: true`, do not add a
permanent debug screen solely for this check; compilation plus the existing wrapper tests are
acceptable, and the limitation must be stated in the verification notes.

## Failure Policy

If compilation or runtime behavior fails:

1. Reproduce the smallest failing path.
2. Fix it inside `packages/player`; do not add an app-layer iOS workaround.
3. Keep the canonical queue and occurrence-token contracts unchanged.
4. Do not alter persisted queue formats.
5. Add or extend a deterministic test when the failure exposes an observable contract not
   already covered.
6. Re-run the baseline checks, native build, and the affected runtime scenario.

Do not change Android transport code unless the iOS fix modifies a genuinely shared public
contract. Do not start Epic 5 in this task.

## Documentation Update After Success

Update all of the following with the actual simulator/device, commands, observed transitions,
and any limitation:

```txt
agent-doc/v3-plan/README.md
agent-doc/v3-plan/epic-breakdown.md
agent-doc/v3-plan/player-foundation.md
agent-doc/v3-plan/agent-handoff-guide.md
```

When native iOS compilation and runtime checks pass, remove wording that says the latest iOS
implementation remains unverified. Keep evidence concise and reproducible; do not claim a
scenario that was not exercised.

## Definition of Done

The task is complete only when:

- The latest iOS native module builds and the Dev Client opens.
- All current player Jest tests, player build, and mobile TypeScript checks pass.
- Stable next/previous, natural completion, and at least one external media-control path are
  observed on iOS using one playback order.
- Queue replacement/restoration is observed with the expected canonical index and paused or
  playing intent.
- Duplicate occurrence behavior is verified, or an explicit evidence-backed blocker is
  recorded after all reachable UI/test paths have been exhausted.
- The v3 status documents contain the new iOS evidence and no stale verification gap.
- Temporary processes are stopped, playback is paused, and evidence remains only in `.temp/`.
- Changes are committed with one of these conventional messages:

```txt
docs(player): record Epic 1 iOS verification
fix(player): complete Epic 1 iOS verification
```

## Required Final Report

Return:

1. Commit hash and commit subject.
2. Simulator/device and iOS version.
3. Exact build and verification commands with pass/fail results.
4. Observed app, natural-end, and external-control transitions.
5. Queue transaction result.
6. Files changed.
7. Any remaining risk, explicitly labeled as unverified rather than inferred.
