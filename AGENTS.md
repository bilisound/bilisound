# Repository Guidelines

本文件是所有 AI agent 的统一入口。**Compatible with**: Claude Code, opencode, OpenAI Codex, Gemini CLI。

> **IMPORTANT**: 优先「检索式」推理，而非「预训练记忆」式推理。项目约定请从 `agent-doc/` 检索阅读，不要凭通用知识臆测本仓库的结构与规则。

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
│   ├── player/            ← @bilisound/player — Expo 原生音频播放模块
│   └── ui/                ← @bilisound/ui — v3 Tamagui 组件库与独立 Expo 展示项目
```

- **apps/mobile**: Expo 客户端。源文件按功能分目录：`app/`（路由页面）、`components/`、`business/`、`store/`、`storage/`、`hooks/`、`utils/`、`api/`、`constants/`。资源在 `assets/` 和 `public/`。
- **apps/server-cf**: Cloudflare Worker，为 Web 端代理 B 站 API 请求。入口 `index.ts`，路由在 `route/bilisound.ts`。
- **apps/server-netlify**: Netlify Functions，代理 GitHub Releases 用于版本检查与 APK 下载。
- **packages/sdk**: 运行时无关的核心逻辑，发布为 `@bilisound/sdk`（TypeScript → `dist/`）。
- **packages/player**: Expo 原生音频播放模块（iOS/Android/Kotlin + Swift + Web shim），发布为 `@bilisound/player`。
- **packages/ui**: v3 跨平台组件库，按 design token、recipe、component 分层，并可作为独立 Expo 项目运行。

## Architecture Overview

**数据流**: `用户输入 URL → SDK (解析 B23/获取元数据/音频流) → Player (播放/下载) → 音频输出`

- **SDK 双模式**: Web 端使用 `BilisoundSDKRemote`（通过 server-cf 代理），原生端使用 `BilisoundSDKDirect`（直接调 B 站 API 并做 WBI 签名）。切换逻辑在 `apps/mobile/api/bilisound.ts`。
- **两个 Server 的区别**: `server-cf` 是 B 站 API 代理（核心后端），`server-netlify` 是 GitHub Release 代理（仅版本分发）。
- **平台分叉**: `.web.ts` 后缀文件为 Web 专属实现，同名无后缀文件供原生端使用。

架构细节参见 **[agent-doc/architecture.md](agent-doc/architecture.md)**。

## Where to Look

| 你想了解……                                | 去看……                                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 整体架构、数据流、SDK 双模式、Server 职责 | [agent-doc/architecture.md](agent-doc/architecture.md)                                                         |
| B 站术语 (bvid, cid, WBI, DASH 等)        | [agent-doc/glossary.md](agent-doc/glossary.md)                                                                 |
| 存储层 (SQLite/MMKV/Zustand)              | [agent-doc/data-layer.md](agent-doc/data-layer.md)                                                             |
| 页面路由结构                              | [agent-doc/routes.md](agent-doc/routes.md)                                                                     |
| 进入 mobile 主界面、物理 Android 调试     | [agent-doc/mobile-debugging.md](agent-doc/mobile-debugging.md)                                                 |
| 验证命令、既有 tsc / ESLint 失败          | [agent-doc/verification.md](agent-doc/verification.md)                                                         |
| 图片资源、看板娘、PNG/SVG 渲染坑          | [agent-doc/assets-and-images.md](agent-doc/assets-and-images.md)                                               |
| v3 分层改造计划、史诗任务、交接文档       | [agent-doc/v3-plan/README.md](agent-doc/v3-plan/README.md)                                                     |
| Player 模块 API                           | [packages/player/README.md](packages/player/README.md)                                                         |
| CF Worker API 端点                        | [apps/server-cf/README.md](apps/server-cf/README.md)                                                           |
| 创建 / 管理 AI agent skill                | [agent-doc/skills.md](agent-doc/skills.md)                                                                     |
| NativeWind / className 迁移到 StyleSheet  | [agent-doc/skills/migrate-to-plain-stylesheet/SKILL.md](agent-doc/skills/migrate-to-plain-stylesheet/SKILL.md) |

## What subproject user may want you to view

| 用户提到……                     | 去看……            |
| ------------------------------ | ----------------- |
| App、客户端、Android、iOS、Web | `apps/mobile`     |
| 服务端                         | `apps/server-cf`  |
| 播放库、播放服务               | `packages/player` |
| API、SDK                       | `packages/sdk`    |

## Build, Test, and Development Commands

- Android builds require **JDK 21**. This must be a full JDK with `java`, `javac`, and `jlink`; a JRE is not sufficient.
- If multiple JDKs are installed locally, prefer `jenv`. If `jenv version` reports `21` is not installed, run `jenv add "$(/usr/libexec/java_home -v 21)"` first, then use `jenv local 21` from the repository root.
- The committed `.java-version` records this project requirement for `jenv` and compatible version managers.
- Before diagnosing Android Gradle failures, verify `java -version`, `javac -version`, `jlink --version`, and `pnpm -C apps/mobile exec ./android/gradlew --version` all resolve to JDK 21.

- Root build: `pnpm build` — runs Turborepo builds (e.g., `packages/sdk`).
- Lint all: `pnpm lint` — runs package lint tasks.
- Format: `pnpm format` — Prettier write across repo.
- Mobile dev: `pnpm -C apps/mobile start` (Expo dev client), `pnpm -C apps/mobile ios`, `pnpm -C apps/mobile android`, `pnpm -C apps/mobile web`.
- Mobile release: `pnpm -C apps/mobile build:android`, `pnpm -C apps/mobile build:web`.
- SDK build: `pnpm -C packages/sdk build` (tsdown → `dist/`).
- Player build: `pnpm -C packages/player build` (expo-module build).
- UI typecheck: `pnpm -C packages/ui typecheck`; showcase: `pnpm -C packages/ui web`.
- CF Worker dev: `pnpm -C apps/server-cf dev`; deploy: `pnpm -C apps/server-cf deploy`.
- Netlify dev: `pnpm -C apps/server-netlify dev`; deploy: `pnpm -C apps/server-netlify deploy`.

## Long-Running Process Rules

开发服务器（`expo start`、`pnpm dev`、`pnpm -C apps/server-cf dev`、`npx serve` 等）和任何不会自行退出的命令，**禁止直接裸跑**。必须使用以下任一方式处理：

1. **后台运行 + 验证 + kill**：将进程放到后台，等待就绪后验证，最后终止。
   ```bash
   pnpm -C apps/mobile web &
   DEV_PID=$!
   sleep 10
   curl -s http://localhost:8081 > /dev/null && echo "Server ready"
   kill $DEV_PID 2>/dev/null
   ```
2. **timeout 包裹**：使用 `timeout` 命令限制最长运行时间。
   ```bash
   timeout 30 pnpm -C apps/mobile web
   ```
3. **bash tool 的 timeout 参数**：调用 bash tool 时将 `timeout` 参数设为 30000（30 秒）或其他合理值。

**判断标准**：如果一个命令在正常情况下不会自行退出（如 dev server、watch mode、`tail -f`），就属于「长期运行进程」，必须按上述规则处理。构建命令（`pnpm build`）、lint（`pnpm lint`）等会正常结束的命令不受此限制。

## Agent Temporary Files

- Agent 运行过程中产生的临时截图、快照、日志、pid 文件等统一写入仓库根目录的 `.temp/`。
- 不要把临时文件写入 `/tmp`。临时产物留在仓库内便于检视和清理，也避免部分 agent 反复请求仓库外目录的访问权限。
- 使用 `agent-device` 调试移动端时，优先使用项目的 Expo Dev Client（`moe.bilisound.app.dev`），不要使用 Expo Go。Expo Go 不是本项目运行目标，容易出现 SDK / bundle 不匹配，导致验证结论失真。

## Coding Style & Naming Conventions

- Prettier: 2‑space indent, semicolons, double quotes, trailing commas, width 120.
- ESLint: Expo config + Prettier plugin (see `apps/mobile/eslint.config.js`).
- Files: hooks `useThing.ts`, components `kebab‑case.tsx`, modules commonly kebab‑case.
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
