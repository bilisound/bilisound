# Mobile 调试入口

本页用于 agent 调试 `apps/mobile`，尤其是已连接的物理 Android 设备。目标是减少进入主界面的试错成本。

## Android 物理机 + Expo Dev Client

1. 使用 `agent-device` 前，先按 skill 要求确认版本并读取工作流帮助。
2. 设备可能已被 `bilisound-tablet` 会话占用。遇到 `DEVICE_IN_USE` 时，复用提示中的 session，不要强行抢设备。
3. 不要使用 Expo Go。使用已安装的 Bilisound Expo Dev Client（`moe.bilisound.app.dev`），否则 SDK / bundle 版本可能不匹配。
4. `agent-device` 产生的临时截图、快照、日志、pid 文件写入仓库根目录 `.temp/`，不要写到 `/tmp`。
5. 先检查 Android dev client 是否可能落后于 native 相关提交：

```bash
pnpm -C apps/mobile run agent:android:doctor
```

该脚本只读取 adb / git 状态，不会重装 app。若它提示 stale 或 native-sensitive working tree changes，先重装 dev client：

```bash
pnpm -C apps/mobile exec expo run:android --no-bundler
```

6. 可用 agent 专用脚本固化 Metro / app 打开流程：

```bash
pnpm -C apps/mobile run agent:android:metro
pnpm -C apps/mobile run agent:android:open
```

7. 若手动执行，启动 Metro 前先配置端口反向代理：

```bash
adb reverse tcp:8081 tcp:8081
```

8. 使用 `agent-device metro prepare` 启动或复用 Expo Metro。不要裸跑长期运行的 `expo start`：

```bash
EXPO_PUBLIC_ENV=development agent-device metro prepare --project-root apps/mobile --kind expo --public-base-url http://127.0.0.1:8081 --port 8081
```

9. 打开 dev app：

```bash
agent-device open moe.bilisound.app.dev --platform android --session bilisound-tablet --relaunch
```

10. 首屏通常是 Expo Dev Client 服务器列表，不是业务主界面。选择 `http://127.0.0.1:8081` 对应的 `Bilisound Dev`。
11. 看到 `歌单`、`查询`、`设置` 后，才算进入业务主界面。
12. 若 `snapshot -i` 为空，或 raw tree 只看到 `ComposeView` / `Tools`，通常是 Expo Dev Client 右上角 `Tools button` 浮层污染了 accessibility tree。打开 Expo dev menu，关闭 `Tools button` 开关，再重新抓 snapshot。
13. 当前未发现项目级 npm / Expo 配置能在启动时强制关闭 `Tools button`。不要用固定坐标脚本假装自动关闭；该开关属于设备本地 dev menu 状态，先手动关闭一次更可靠。
14. 调试结束后停止 `metro prepare` 输出里的 `pid`，并删除它生成的 `apps/mobile/.agent-device/` 临时日志目录。

## 常见判断

- `snapshot -i` 能确认页面结构和可点击节点，但不能证明图片、阴影、透明度等视觉内容正确。
- 图片、布局、横屏、SafeArea、NativeWind/StyleSheet 迁移必须截图验证。
- `agent-device metro reload` 后如果掉回系统桌面或 Dev Client 页，重新打开 app 并再次选择 `127.0.0.1:8081`。
- Expo Dev Client 的 `Tools button` 是 a11y 验证常见干扰源；业务 UI 视觉正常但 snapshot 为空时，优先检查它，而不是直接判定页面无语义。

## Metro 编译环境异常排查（布局错位 / a11y 树异常 / CssInterop 告警）

**现象**（2026-08 真机会话实测）：

- NativeWind 样式大面积失效：AlertDialog 内容堆叠在屏幕左上角、无遮罩、按钮全宽垂直堆叠（flex-row / justify-center / w-full 全部不生效）。
- a11y 树不稳定：对话框按钮时隐时现、bounds 与实际渲染位置错位，导致 agent-device 点击/ref 操作失败，被迫用 raw ref 或坐标盲点。
- Metro 日志持续刷 `Cannot update a component (CssInterop.View) while rendering a different component (CssInterop.Modal/View/Text/Image)`，且告警横幅会遮挡底部 tab 栏。

**根因**：watchman 的 fsevents watch 反复 recrawl（事件丢失）→ Metro 感知不到文件变化、转换缓存不一致 → 部分模块（尤其 node_modules 里的 @gluestack-ui 等）拿到未走 NativeWind JSX 转换的旧编译产物 → className → style 转换失效。**与业务代码无关**，同一份代码在干净环境下完全正常。

**排查步骤**：

1. 检查 watchman 状态：

```bash
watchman watch-project <仓库根目录>
```

   出现 `Recrawled this watch N times` 警告即命中本问题。

2. 确认代码改动真的进了 bundle（`agent-device metro reload` 不生效 ≠ 代码无效，先验证）：

```bash
curl -s "http://127.0.0.1:8081/.expo/.virtual-metro-entry.bundle?platform=android&dev=true&minify=false" -o /tmp/bundle.js
# 检查你最近的改动标记是否出现在 bundle 里
```

3. 修复：重置 watchman 并重启 Metro：

```bash
watchman watch-del <仓库根目录>
watchman watch-project <仓库根目录>
# kill 旧 Metro 后重新启动（必要时带 --clear 清 Metro 缓存）
```

**教训**：在 Metro watch 失效的情况下做过多个「修复实验」（cssInterop 注册、硬编码 className 等）都看似无效，实际是改动从未进入 bundle。凡是在改代码后怀疑「修复不生效」，**先 curl bundle 确认改动已编译**，再讨论代码本身。
