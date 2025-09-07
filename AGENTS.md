# Repository Guidelines

Bilisound 是一个第三方音视频客户端，采用 monorepo 结构，支持 iOS、Android 和 Web 平台。项目旨在提供一个纯净、专注的音视频播放体验，特别是针对播放列表和离线使用的场景。

Bilisound 的目标是：

- 提供在移动端和 Web 上一致的用户体验。
- 方便用户创建、管理和分享音视频播放列表（歌单）。
- 支持将音视频内容下载到本地，供离线使用。
- 专注于核心的播放功能，无广告和不相关的社交元素。

## Project Structure & Module Organization

- apps/mobile: Expo React Native client (iOS/Android/Web). Source lives alongside feature folders under `components/`, `business/`, `store/`, `utils/`, etc. Assets in `assets/` and `public/`.
- apps/server-netlify: Netlify Functions for release proxying. Entrypoints in `netlify/functions/`.
- packages/sdk: Runtime‑agnostic core logic published as `@bilisound/sdk` (TypeScript built to `dist/`).
- Tooling: pnpm workspaces + Turborepo (`pnpm-workspace.yaml`, `turbo.json`).

## Build, Test, and Development Commands

- Root build: `pnpm build` — runs Turborepo builds (e.g., `packages/sdk`).
- Lint all: `pnpm lint` — runs package lint tasks.
- Format: `pnpm format` — Prettier write across repo.
- Mobile dev: `pnpm -C apps/mobile start` (Expo dev client), `pnpm -C apps/mobile ios`, `pnpm -C apps/mobile android`, `pnpm -C apps/mobile web`.
- Mobile release: `pnpm -C apps/mobile build:android`, `pnpm -C apps/mobile build:web`.
- SDK build: `pnpm -C packages/sdk build` (tsdown → `dist/`).
- Netlify dev: `pnpm -C apps/server-netlify dev`; deploy: `pnpm -C apps/server-netlify deploy`.

## Coding Style & Naming Conventions

- Prettier: 2‑space indent, semicolons, double quotes, trailing commas, width 120.
- ESLint: Expo config + Prettier plugin (see `apps/mobile/eslint.config.js`).
- Files: hooks `useThing.ts`, components `Thing.tsx` (PascalCase exports), modules commonly kebab‑case.
- Imports: use local alias `~/` in mobile per `tsconfig.json`.

## Testing Guidelines

- Current status: no required CI tests.

## Commit & Pull Request Guidelines

- Commits: Conventional Commits (e.g., `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`). Keep scope small and messages imperative.
- PRs: clear description, linked issues, rationale, before/after screenshots for UI, and testing notes. Keep changes focused; update docs when behavior changes.

## Security & Configuration Tips

- Android signing: place `apps/mobile/credentials/bilisound-release.keystore` and root‑level `credentials.json` (both git‑ignored). Do not commit secrets.
- Environment/config: prefer platform configs (`app.config.ts`, Netlify `netlify.toml`). Avoid hard‑coding keys; use platform stores or deploy‑time variables.
