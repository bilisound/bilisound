# Agent Documentation

本目录存放面向 AI agent 的**规则与 skill**。

## 怎么用

- **先读入口**：所有 agent 的统一入口是仓库根的 [`../AGENTS.md`](../AGENTS.md)。
- **按需跳读**：根据手头任务，参照 `AGENTS.md` 里的「Where to Look」索引表读对应文档。
- **架构 / 术语等正文文档**：在本路径。
- **Skill 管理**：见 [skills.md](skills.md)。

## 快速入口

| 任务 | 文档 |
| --- | --- |
| 进入 mobile 主界面、使用物理 Android 调试 | [mobile-debugging.md](mobile-debugging.md) |
| 判断验证命令是否可用、识别既有失败 | [verification.md](verification.md) |
| 修改图片资源、看板娘、静态 PNG/SVG | [assets-and-images.md](assets-and-images.md) |
| 理解整体架构和数据流 | [architecture.md](architecture.md) |
| 查页面路由 | [routes.md](routes.md) |
| 查存储层 | [data-layer.md](data-layer.md) |

## 支持的 AI 工具

skill 会在 `pnpm install` 时自动安装进以下 agent：Claude Code、opencode、OpenAI Codex、Gemini CLI。
