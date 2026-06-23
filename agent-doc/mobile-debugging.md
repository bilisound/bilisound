# Mobile 调试入口

本页用于 agent 调试 `apps/mobile`，尤其是已连接的物理 Android 设备。目标是减少进入主界面的试错成本。

## Android 物理机 + Expo Dev Client

1. 使用 `agent-device` 前，先按 skill 要求确认版本并读取工作流帮助。
2. 设备可能已被 `bilisound-tablet` 会话占用。遇到 `DEVICE_IN_USE` 时，复用提示中的 session，不要强行抢设备。
3. 不要使用 Expo Go。使用已安装的 Bilisound Expo Dev Client（`moe.bilisound.app.dev`），否则 SDK / bundle 版本可能不匹配。
4. `agent-device` 产生的临时截图、快照、日志、pid 文件写入仓库根目录 `.temp/`，不要写到 `/tmp`。
5. 可用 agent 专用脚本固化 Metro / app 打开流程：

```bash
pnpm -C apps/mobile run agent:android:metro
pnpm -C apps/mobile run agent:android:open
```

6. 若手动执行，启动 Metro 前先配置端口反向代理：

```bash
adb reverse tcp:8081 tcp:8081
```

7. 使用 `agent-device metro prepare` 启动或复用 Expo Metro。不要裸跑长期运行的 `expo start`：

```bash
EXPO_PUBLIC_ENV=development agent-device metro prepare --project-root apps/mobile --kind expo --public-base-url http://127.0.0.1:8081 --port 8081
```

8. 打开 dev app：

```bash
agent-device open moe.bilisound.app.dev --platform android --session bilisound-tablet --relaunch
```

9. 首屏通常是 Expo Dev Client 服务器列表，不是业务主界面。选择 `http://127.0.0.1:8081` 对应的 `Bilisound Dev`。
10. 看到 `歌单`、`查询`、`设置` 后，才算进入业务主界面。
11. 若 `snapshot -i` 为空，或 raw tree 只看到 `ComposeView` / `Tools`，通常是 Expo Dev Client 右上角 `Tools button` 浮层污染了 accessibility tree。打开 Expo dev menu，关闭 `Tools button` 开关，再重新抓 snapshot。
12. 当前未发现项目级 npm / Expo 配置能在启动时强制关闭 `Tools button`。不要用固定坐标脚本假装自动关闭；该开关属于设备本地 dev menu 状态，先手动关闭一次更可靠。
13. 调试结束后停止 `metro prepare` 输出里的 `pid`，并删除它生成的 `apps/mobile/.agent-device/` 临时日志目录。

## 常见判断

- `snapshot -i` 能确认页面结构和可点击节点，但不能证明图片、阴影、透明度等视觉内容正确。
- 图片、布局、横屏、SafeArea、NativeWind/StyleSheet 迁移必须截图验证。
- `agent-device metro reload` 后如果掉回系统桌面或 Dev Client 页，重新打开 app 并再次选择 `127.0.0.1:8081`。
- Expo Dev Client 的 `Tools button` 是 a11y 验证常见干扰源；业务 UI 视觉正常但 snapshot 为空时，优先检查它，而不是直接判定页面无语义。
