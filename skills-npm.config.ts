import { defineConfig } from "skills-npm";

export default defineConfig({
  // 装进与 install-skills.mjs 一致的四个 agent。
  agents: ["claude-code", "opencode", "codex", "gemini-cli"],
  // monorepo：递归扫描 workspace 内的包。
  recursive: true,
  // 仅采纳内部 scope 的包，避免第三方依赖夹带 skill 造成供应链风险。
  include: ["@bilisound/*"],
  // .gitignore 由仓库手动维护（见 `**/skills/npm-*`），不让本工具改动。
  gitignore: false,
  yes: true,
});
