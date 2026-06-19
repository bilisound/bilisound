# Mobile 调试入口

本页用于 agent 调试 `apps/mobile`，尤其是已连接的物理 Android 设备。目标是减少进入主界面的试错成本。

## Android 物理机 + Expo Dev Client

1. 使用 `agent-device` 前，先按 skill 要求确认版本并读取工作流帮助。
2. 设备可能已被 `bilisound-tablet` 会话占用。遇到 `DEVICE_IN_USE` 时，复用提示中的 session，不要强行抢设备。
3. 启动 Metro 前先配置端口反向代理：

```bash
adb reverse tcp:8081 tcp:8081
```

4. 使用 `agent-device metro prepare` 启动或复用 Expo Metro。不要裸跑长期运行的 `expo start`：

```bash
EXPO_PUBLIC_ENV=development agent-device metro prepare --project-root apps/mobile --kind expo --public-base-url http://127.0.0.1:8081 --port 8081
```

5. 打开 dev app：

```bash
agent-device open moe.bilisound.app.dev --platform android --session bilisound-tablet --relaunch
```

6. 首屏通常是 Expo Dev Client 服务器列表，不是业务主界面。选择 `http://127.0.0.1:8081` 对应的 `Bilisound Dev`。
7. 看到 `歌单`、`查询`、`设置` 后，才算进入业务主界面。
8. 调试结束后停止 `metro prepare` 输出里的 `pid`，并删除它生成的 `apps/mobile/.agent-device/` 临时日志目录。

## 常见判断

- `snapshot -i` 能确认页面结构和可点击节点，但不能证明图片、阴影、透明度等视觉内容正确。
- 图片、布局、横屏、SafeArea、NativeWind/StyleSheet 迁移必须截图验证。
- `agent-device metro reload` 后如果掉回系统桌面或 Dev Client 页，重新打开 app 并再次选择 `127.0.0.1:8081`。
