# Repository Guidelines

Bilisound 是一个第三方音视频客户端，采用 monorepo 结构，支持 iOS、Android 和 Web 平台。项目旨在提供一个纯净、专注的音视频播放体验，特别是针对播放列表和离线使用的场景。

Bilisound 的目标是：

- 提供在移动端和 Web 上一致的用户体验。
- 方便用户创建、管理和分享音视频播放列表（歌单）。
- 支持将音视频内容下载到本地，供离线使用。
- 专注于核心的播放功能，无广告和不相关的社交元素。

## Project Structure & Module Organization

```
bilisound/
├── apps/
│   ├── mobile/            ← Expo React Native 客户端 (iOS/Android/Web)
│   ├── server-cf/         ← Cloudflare Worker API 代理 (Web 端后端)
│   └── server-netlify/    ← Netlify Functions 版本分发代理
├── packages/
│   ├── sdk/               ← @bilisound/sdk — B 站 API 封装 (运行时无关)
│   └── player/            ← @bilisound/player — Expo 原生音频播放模块
```

- **apps/mobile**: Expo SDK 55 客户端。源文件按功能分目录：`app/`（路由页面）、`components/`、`business/`、`store/`、`storage/`、`hooks/`、`utils/`、`api/`、`constants/`。资源在 `assets/` 和 `public/`。
- **apps/server-cf**: Cloudflare Worker，为 Web 端代理 B 站 API 请求。入口 `index.ts`，路由在 `route/bilisound.ts`。
- **apps/server-netlify**: Netlify Functions，代理 GitHub Releases 用于版本检查与 APK 下载。
- **packages/sdk**: 运行时无关的核心逻辑，发布为 `@bilisound/sdk`（TypeScript → `dist/`）。
- **packages/player**: Expo 原生音频播放模块（iOS/Android/Kotlin + Swift + Web shim），发布为 `@bilisound/player`。

## Architecture Overview

**数据流**: `用户输入 URL → SDK (解析 B23/获取元数据/音频流) → Player (播放/下载) → 音频输出`

- **SDK 双模式**: Web 端使用 `BilisoundSDKRemote`（通过 server-cf 代理），原生端使用 `BilisoundSDKDirect`（直接调 B 站 API 并做 WBI 签名）。切换逻辑在 `apps/mobile/api/bilisound.ts`。
- **两个 Server 的区别**: `server-cf` 是 B 站 API 代理（核心后端），`server-netlify` 是 GitHub Release 代理（仅版本分发）。
- **平台分叉**: `.web.ts` 后缀文件为 Web 专属实现，同名无后缀文件供原生端使用。

架构细节参见 **[docs/architecture.md](docs/architecture.md)**。

## Where to Look

| 你想了解…… | 去看…… |
|------------|--------|
| 整体架构、数据流、SDK 双模式、Server 职责 | [docs/architecture.md](docs/architecture.md) |
| B 站术语 (bvid, cid, WBI, DASH 等) | [docs/glossary.md](docs/glossary.md) |
| 存储层 (SQLite/MMKV/Zustand) | [docs/data-layer.md](docs/data-layer.md) |
| 页面路由结构 | [docs/routes.md](docs/routes.md) |
| Player 模块 API | [packages/player/README.md](packages/player/README.md) |
| CF Worker API 端点 | [apps/server-cf/README.md](apps/server-cf/README.md) |

## Build, Test, and Development Commands

- Root build: `pnpm build` — runs Turborepo builds (e.g., `packages/sdk`).
- Lint all: `pnpm lint` — runs package lint tasks.
- Format: `pnpm format` — Prettier write across repo.
- Mobile dev: `pnpm -C apps/mobile start` (Expo dev client), `pnpm -C apps/mobile ios`, `pnpm -C apps/mobile android`, `pnpm -C apps/mobile web`.
- Mobile release: `pnpm -C apps/mobile build:android`, `pnpm -C apps/mobile build:web`.
- SDK build: `pnpm -C packages/sdk build` (tsdown → `dist/`).
- Player build: `pnpm -C packages/player build` (expo-module build).
- CF Worker dev: `pnpm -C apps/server-cf dev`; deploy: `pnpm -C apps/server-cf deploy`.
- Netlify dev: `pnpm -C apps/server-netlify dev`; deploy: `pnpm -C apps/server-netlify deploy`.

## Coding Style & Naming Conventions

- Prettier: 2‑space indent, semicolons, double quotes, trailing commas, width 120.
- ESLint: Expo config + Prettier plugin (see `apps/mobile/eslint.config.js`).
- Files: hooks `useThing.ts`, components `Thing.tsx` (PascalCase exports), modules commonly kebab‑case.
- Imports: use local alias `~/` in mobile per `tsconfig.json` (resolved to `apps/mobile/`).
- Platform extensions: `*.web.ts` for web-specific implementations (Expo convention).

## Testing Guidelines

- Current status: no required CI tests.

## Commit & Pull Request Guidelines

- Commits: Conventional Commits (e.g., `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`). Keep scope small and messages imperative.
- PRs: clear description, linked issues, rationale, before/after screenshots for UI, and testing notes. Keep changes focused; update docs when behavior changes.

## Security & Configuration Tips

- Android signing: place `apps/mobile/credentials/bilisound-release.keystore` and root‑level `credentials.json` (both git‑ignored). Do not commit secrets.
- Environment/config: prefer platform configs (`app.config.ts`, Netlify `netlify.toml`). Avoid hard‑coding keys; use platform stores or deploy‑time variables.
