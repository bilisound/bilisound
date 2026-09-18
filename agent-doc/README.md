# Agent Documentation

本目录存放面向 AI agent 的**规则与 skill**。

## 怎么用

- **先读入口**：所有 agent 的统一入口是仓库根的 [`../AGENTS.md`](../AGENTS.md)。
- **按需跳读**：根据手头任务，参照 `AGENTS.md` 里的「Where to Look」索引表读对应文档。
- **架构 / 术语等正文文档**：在本路径。

## 文档职责

同一事实只在一处维护，其他文档链接过去：

- `AGENTS.md`：仓库规则、常用命令，以及唯一的任务索引「Where to Look」。新增主题页时在那里补一行。
- 主题页（`architecture.md`、`data-layer.md`、`routes.md` 等）：契约、理由与已知陷阱。端点、表字段、store、平台分叉文件等完整清单以源码或对应 README 为准，只写查找方式，不抄清单。
- `verification.md` 负责检查范围与通过标准；`mobile-debugging.md` 负责如何运行与故障处置。
- `skills.md` 负责 skill 的来源、安装与覆盖的 agent。
- `v3-plan/`：进行中的计划。epic 状态只在 [epic-breakdown.md 的 Status Overview](v3-plan/epic-breakdown.md#status-overview) 维护。
- `devlogs/`：历史资料，见下节。

## 历史资料

`devlogs/` 是历史目录，存放开发日志、一次性审计报告和阶段验收记录，文件名为 `YYYYMMDD-<topic>.md`，内容反映写作当时的代码状态。

- 历史目录中的文档默认不读取、不检索，也不作为当前行为、约束或待办的依据。
- 仅当用户明确指定参考某份记录、按该记录实施，或要求追溯历史决策时，才按需读取。普通功能需求不自动启用历史资料。
- 历史执行指令（例如审计清单里的「删除」「迁移」「待修复」）不自动生效；实施前必须核对当前源码。
- 例外：按 `write-devlog` skill 写新 devlog 时，可读取已有 devlog 参考格式与风格，但不从中推断当前行为。
- 检索本目录时排除历史目录，例如 `grep -rn <pattern> agent-doc --exclude-dir=devlogs`。
- 新的开发日志、已完成的审计报告和一次性验收记录放进 `devlogs/`，不要放在本目录顶层与当前主题页并列。

`v3-plan/` 是进行中的计划，不属于历史目录；其中已完成的记录由 [v3-plan/README.md](v3-plan/README.md) 自行标注。
