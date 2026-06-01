---
name: write-devlog
description: Use when the user asks to write a devlog, development log, 开发日志, or document a feature/change for this project. Covers file naming, format conventions, and content structure.
---

# Write Devlog

为 Bilisound 项目编写开发日志（devlog）。日志放在 `agent-doc/devlogs/`。

## 文件名

格式：`YYYYMMDD-<kebab-topic>.md`

例如：

- `20260517-image-generation.md`
- `20260516-admin-web-ui.md`

## 文档结构

````markdown
# AI Gateway - YYYYMMDD Topic 标题

## 背景

描述为什么要做这个改动，解决了什么问题，之前的状态是什么。

## 主要变更

分小节列出关键变更，每个变更附带代码片段或文件引用。

### 1. 小标题

说明做了什么。代码片段使用 ` ```ts ` 等标记。

使用文件路径引用：`packages/core/src/config.ts:42`

### 2. 另一个变更

...

## 验证

列出跑过的命令和结果：

```bash
bun test
bunx tsc --noEmit
bun build ...
```

## 提交

```txt
<commit-hash> <commit message>
```
````

## 注意事项

- 为了防止死循环，代码和文档要分两次提交。在文档记录下来代码的 git commit hash 以后，再提交文档
- 从 `git log` 获取实际的 commit hash
- 从 `git diff` 获取实际的改动内容
- 代码片段要准确，不要凭空编造
- 保持与其他 devlog 一致的风格（参考 `agent-docs/devlogs/` 下已有文件）
- 用中文写文档内容
