# 验证与已知失败

本页记录当前对 agent 最有用的验证命令和已知失败，避免把既有问题误判成本次改动。

## 推荐验证

- Android bundle 验证：

```bash
pnpm -C apps/mobile exec expo export --platform android --clear
```

- 改动文件空白检查：

```bash
git diff --check -- <changed-files>
```

- UI 视觉验证：按 [mobile-debugging.md](mobile-debugging.md) 进入业务界面，再用 `agent-device screenshot` 截图。

## 当前已知失败

- `pnpm -C apps/mobile exec tsc --noEmit` 当前全量失败。已知类别包括：
  - `expo-file-system` / `expo-file-system/legacy` 类型解析失败
  - 若干 UI 组件 ref 类型不兼容
  - `app/settings/logs.tsx` 的 `unknown` 类型问题
  - Node 类型缺失导致的 `fs`、`path`、`global`、`ImportMeta.dir` 报错
- 如果本次改动目标文件没有出现在 `tsc` 输出中，不要把这些既有错误当作本次回归。
- `pnpm -C apps/mobile exec eslint ...` 当前可能被 ESLint 10 与 `@typescript-eslint` 兼容问题挡住，典型错误为 `Class extends value undefined is not a constructor or null`。

## 结果记录

最终回复应区分三类结果：

- 已通过：例如 bundle export、截图确认、`git diff --check`
- 已执行但被既有问题阻塞：例如全量 `tsc`、ESLint
- 未执行：说明原因，不要写成通过
