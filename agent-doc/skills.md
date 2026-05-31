# Skills 管理

本文件说明本项目如何管理 AI agent skill。

## 概览

Skill 是可复用的指令集，定义在 `SKILL.md` 中，可通过 `/skill-name` 调用，用来扩展 AI agent 的能力。

| 设置             | 取值                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| **真实来源**     | `agent-doc/skills/<skill-name>/SKILL.md`（本地 skill）                   |
| **外部 skill**   | 在 `scripts/install-skills.mjs` 的 `EXTERNAL_SKILLS` 显式声明            |
| **npm 包 skill** | npm 包内置并声明，配置见 `skills-npm.config.ts`（白名单 `@bilisound/*`） |
| **自动安装**     | `pnpm install`（经 `prepare` 生命周期）                                  |
| **覆盖 agent**   | Claude Code、opencode、OpenAI Codex、Gemini CLI                          |

## 目录结构

```
agent-doc/skills/
└── <your-skill>/
    ├── SKILL.md           # 必需
    ├── references/        # 可选
    └── scripts/           # 可选
```

## 安装产物在哪里

`prepare` 会调用 [`skills`](https://github.com/vercel-labs/skills) CLI 把 skill 安装进各 agent 目录：

- Claude Code → `.claude/skills/<skill-name>/`
- opencode / Codex / Gemini CLI → `.agents/skills/<skill-name>/`

以下都是生成产物，**均被 git 忽略**：`.claude/skills`、`.agents/skills`、`skills-lock.json`、`**/skills/npm-*`。
唯一应当编辑的是 `agent-doc/skills/<skill-name>/SKILL.md`（本地 skill）或 `scripts/install-skills.mjs`（外部 skill 列表）。
改完重新 `pnpm install` 即可重新生成。

此外，`prepare` 还会调用 [`skills-npm`](https://github.com/antfu/skills-npm)：扫描 monorepo 内的 npm 包，把它们 `skills/` 目录里内置的 skill 软链成 `skills/npm-<包名>-<skill名>`。出于供应链安全，只采纳 `skills-npm.config.ts` 白名单（`@bilisound/*`）内的包。

## 新增 skill

### 本地 skill

1. `pnpm exec skills init <skill-name>` 在 `agent-doc/skills/` 下生成模板，或手动新建 `agent-doc/skills/<skill-name>/SKILL.md`。
2. `pnpm install` 重新安装。
3. 在 `AGENTS.md` 的「Where to Look」索引里补一行（[为什么？](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)）。

### 外部 skill

在 `scripts/install-skills.mjs` 的 `EXTERNAL_SKILLS` 数组里追加 `[仓库, skill 名]`（skill 名用 `"*"` 表示安装该仓库的全部 skill），然后 `pnpm install`。

### npm 包 skill

让某个 `@bilisound/*` 包对外提供 skill：在该包内新建 `skills/<skill-name>/SKILL.md`，`pnpm install` 时 `skills-npm` 会自动发现并软链。白名单（`include`）在 `skills-npm.config.ts` 维护。

## 参考

- Skill 格式：https://code.claude.com/docs/en/skills.md
- Skills CLI：https://github.com/vercel-labs/skills
- Skills-npm CLI：https://github.com/antfu/skills-npm
