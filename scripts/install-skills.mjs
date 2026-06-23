// 自动初始化 AI agent skill。
// 在 `pnpm install` 的 prepare 生命周期里运行，把项目 skill 安装进各 agent 目录
// （claude-code → .claude/skills/；其余 → .agents/skills/）。
//
// 真实来源：
//   - 外部 skill：本文件下方 EXTERNAL_SKILLS 显式声明
//   - 本地 skill：agent-doc/skills/<name>/SKILL.md
// 安装产物（.claude/skills、.agents/skills、skills-lock.json）均被 gitignore。

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// skills CLI（截至 1.5.12）的缺陷：多 agent「软链接模式」下，它会把 .claude/skills/<name>
// 软链到 .agents/skills/<name>，但若 .claude 父目录尚不存在则静默跳过——CLI 仍打印
// “symlink → Claude Code”，实际却什么都没装。fresh checkout / git worktree 里没有 .claude，
// 于是 Claude Code 一个项目 skill 都拿不到。这里提前把目录建好，绕过该缺陷。
mkdirSync(join(repoRoot, ".claude", "skills"), { recursive: true });

// 覆盖的 agent。换工具时改这里即可。
const AGENTS = ["claude-code", "opencode", "codex", "gemini-cli"];

// 外部来源的 skill：[仓库, 仓库内的 skill 名]。"*" = 安装该仓库的全部 skill。
// expo/skills 用 "*" 拉取官方整套 Expo skill（等价于其 Claude Code 的 `expo` 捆绑插件）。
const EXTERNAL_SKILLS = [["expo/skills", "*"]];

const LOCAL_SKILLS_DIR = join(repoRoot, "agent-doc", "skills");

// CI 不需要 skill，且会带来不必要的联网与克隆开销。
if (process.env.CI) {
  console.log("[install-skills] CI 环境，跳过 skill 安装");
  process.exit(0);
}

function run(bin, args) {
  const result = spawnSync("pnpm", ["exec", bin, ...args], {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, DISABLE_TELEMETRY: "1" },
  });
  // skill 只是增强项，安装失败不应阻断整个 pnpm install。
  if (result.status !== 0) {
    console.warn(`[install-skills] 安装失败（已忽略）: ${bin} ${args.join(" ")}`);
  }
}

function hasLocalSkills() {
  if (!existsSync(LOCAL_SKILLS_DIR)) return false;
  // 仅当存在至少一个 <name>/SKILL.md 时才安装，避免对空目录调用导致报错。
  return readdirSync(LOCAL_SKILLS_DIR, { withFileTypes: true }).some(
    entry => entry.isDirectory() && existsSync(join(LOCAL_SKILLS_DIR, entry.name, "SKILL.md")),
  );
}

// 1) 外部 github skill
for (const [source, skill] of EXTERNAL_SKILLS) {
  run("skills", ["add", source, "--skill", skill, "--agent", ...AGENTS, "--yes"]);
}

// 2) 本地 skill（agent-doc/skills/）
if (hasLocalSkills()) {
  run("skills", ["add", "./agent-doc/skills", "--agent", ...AGENTS, "--yes"]);
}

// 3) npm 包内置 skill（配置见 skills-npm.config.ts，含 @bilisound/* 白名单）
run("skills-npm", ["--yes"]);
