# 验证

本页记录本仓库特有的验证手段。通用命令见 `AGENTS.md` 的 Build/Test/Development 一节。

## 推荐验证

- Android bundle 验证（比 tsc 更能暴露 Metro / 平台解析问题）：

```bash
pnpm -C apps/mobile exec expo export --platform android --clear
```

- 改动文件空白检查：

```bash
git diff --check -- <changed-files>
```

- UI 视觉验证：按 [mobile-debugging.md](mobile-debugging.md) 进入业务界面，再用 `agent-device screenshot` 截图。

## Mobile 单元测试（Jest）

`apps/mobile` 的 Jest 用例位于各模块的 `__tests__/`（`package.json` 的 `jest.testMatch`），主要在 `features/<domain>/__tests__/`、`storage/sqlite/__tests__/` 和 `components/__tests__/`。

`pnpm -C apps/mobile test` 是 `jest --watchAll`，不会自行退出，属于长期运行进程。按改动范围运行对应目录，并关闭 watch：

```bash
pnpm -C apps/mobile exec jest features/playlist/__tests__ --watchAll=false
```

## Mobile 静态检查

根目录 `pnpm lint` 不包含 `apps/mobile`（它没有 `lint` 脚本）。检查改动文件：

```bash
pnpm -C apps/mobile exec eslint <changed-files>
pnpm -C apps/mobile exec tsc --noEmit
```

`tsc` 可能报出 `node_modules` 内第三方源码的类型错误；按错误路径区分既有问题与本次改动，处理方式见下节。

## 关于既有失败

不要预设 `tsc` / ESLint 处于失败状态。**先跑，再判断**。

如果确实遇到与本次改动无关的失败，在最终回复里说明是既有问题，但不要因为「文档说这里本来就是坏的」而跳过验证或忽略输出。

## 结果记录

最终回复应区分三类结果：

- 已通过：例如 bundle export、截图确认、`git diff --check`
- 已执行但被既有问题阻塞：说明具体错误
- 未执行：说明原因，不要写成通过
