# Bilisound 移动端可访问性（a11y）审计报告

> 生成时间：2026-06-20
> 最近复核：2026-06-23（iOS Simulator）
> 审计范围：`apps/mobile` 设置相关页面、底部导航、通用布局组件
> 审计方式：基于 agent-device 自动化操作与 React Native accessibility tree 快照的实操验证

## 总体结论

初始审计时，Bilisound 移动端的可访问性**较差**。在自动化验证过程中，大量核心交互无法通过语义化元素定位完成，不得不依赖坐标点击、adb shell 输入以及 deep link 跳转等“旁门左道”。这表明应用当时对屏幕阅读器、自动化测试工具和辅助技术都不够友好。

2026-06-22 在 Android 物理设备上复核后，P0 项已经有明显改善：底部导航、设置列表行、设置开关行都能被 accessibility tree 识别并操作。2026-06-23 在 iOS Simulator 上复核后，P0 项同样基本可用，且 iOS 能暴露底部导航 selected 状态和输入框显式 label。P1 项仍未完全达标：页面标题/header 语义、页面切换焦点迁移、toast/live region 语义仍需要继续整改或补充稳定验证。

## 2026-06-23 iOS Simulator 复核

复核环境：

- 设备：iPhone 17 Pro Simulator，iOS 26.3 runtime。
- App：`Bilisound Dev` / `moe.bilisound.app.dev`。
- 工具：`agent-device 0.17.6`。
- Xcode：Xcode 26.2 (17C52)。
- 启动方式：本机原无可用 iOS Simulator runtime，通过 `xcodebuild -downloadPlatform iOS` 下载并登记 iOS 26.3.1 Simulator 后，执行 `pnpm -C apps/mobile exec expo run:ios --device "iPhone 17 Pro" --no-bundler` 构建并安装 dev client，再用 Expo Dev Client URL 进入业务 UI。

复核前置问题：

- 初始 `xcrun simctl list runtimes available` / `devices available` 为空，需要下载新的 iOS Simulator runtime。
- `expo run:ios` 构建、安装成功，但最后激活 Simulator 窗口时触发 `osascript` 权限/进程检查错误；该错误发生在安装后，不影响已安装 app 的后续验证。
- 使用 `--host localhost` 启动 Metro 时，宿主机 `localhost:8081` 可访问但 `127.0.0.1:8081` 不可访问，iOS dev client 拉取 bundle 时红屏 `Could not connect to development server`。改用 `--host lan` 并通过 `http://192.168.24.214:8081` 打开后进入业务 UI。
- 进入业务 UI 后出现一次 RN warning overlay：`Uncaught (in promise, id: 0) Error: No track is currently playing`，通过 `agent-device react-native dismiss-overlay` 清理后继续验证。

复核结果：

| 整改项 | 当前状态 | iOS Simulator 证据 |
| --- | --- | --- |
| 底部导航可发现性 | 已改善 | 首页 snapshot 能看到 `歌单标签`、`查询标签`、`设置标签` 三个节点，均为 `Button`。 |
| 底部导航 role / selected | 部分整改 | iOS tree 中三项仍是 `Button`，不是 `tab`；当前项 attrs 可暴露 `selected: true`，如 `查询标签`、`设置标签`。 |
| 设置列表行 | 已整改 | 设置页 `外观设置，切换应用主题和看板娘显示`、`数据管理，管理离线缓存和数据备份`、`下载管理，尚无任务正在进行`、`关于 Bilisound，版本 2.3.0` 均暴露为 `Button`。 |
| 设置开关行 | 已整改 | `使用 av 号而非 bv 号...`、`自动缓存队列中的曲目...`、`开发者模式...` 暴露为 `Switch`，attrs 通过 `value` 暴露开关状态。 |
| 文本输入框直接输入 | 已整改 | 首页查询输入框暴露为 `TextField`，`agent-device fill @e7 "av123"` 可直接输入。 |
| 文本输入框 label | 已整改（iOS） | 输入前 label 为 `视频链接或 ID`；输入后 attrs 同时暴露 `label: "视频链接或 ID"` 和 `value: "av123"`。这优于 Android 复核时只暴露 placeholder 的情况。 |
| 页面标题/header | 未完全达标 | 设置页标题 `设置` 暴露为 `Other`；关于页标题 `关于` 暴露为 `StaticText`，未体现 header 语义。 |
| 页面切换焦点迁移 | 未发现整改证据 | 从设置页进入关于页后，snapshot 未显示标题 focused，也未观察到页面切换宣告。 |
| Toast / 动态提示 | 未充分验证 | `components/notify-toast.tsx` 中 `Text` 已设置 `role="alert"`、`aria-live="assertive"`、`aria-atomic="true"`，但本次 iOS 实操未稳定触发可观测 toast；不能据此判定已达标。 |

当前优先级判断：

- P0：iOS 上设置列表、开关、底部导航均可被 accessibility tree 识别和操作；底部导航仍需决定是否继续追求跨平台 `tab` role，或将 `Button + selected` 作为平台折中写入规范。
- P1：iOS 文本输入 label 已达标；页面标题/header、焦点迁移仍未达标；toast/live region 需要补一个稳定可复现路径后再复核。
- P2：仍未看到 testID / accessibilityLabel 编码规范和自动化 a11y 检测落地。

## 2026-06-22 Android 实机复核

复核环境：

- 设备：Android 物理设备 `23113RKC6C`。
- App：`moe.bilisound.app.dev`。
- 工具：`agent-device 0.15.2`。
- 启动方式：重装当前源码构建的 debug APK 后，通过 Expo Dev Client URL `exp+bilisound-client-mobile://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081` 进入业务 UI。

复核前置问题：

- 设备上原有 dev client 打开后出现 RN 红屏：`Exception in native call from JS / requireNonNull`。
- 日志定位到缺少 `expo.modules.ExpoModulesPackageList`，属于旧 APK / 原生构建状态问题。
- 使用 JDK 21 环境执行 `./gradlew installDebug` 重新安装 debug APK 后恢复验证。

复核结果：

| 整改项 | 当前状态 | Android 实机证据 |
| --- | --- | --- |
| 底部导航可发现性 | 已改善 | 首页 snapshot 能看到 `歌单标签`、`查询标签`、`设置标签` 三个可点节点。 |
| 底部导航 role / selected | 部分整改 | Android tree 中三项均为 `android.widget.Button`，不是 `tab`；`get attrs` 未暴露 selected 状态。 |
| 设置列表行 | 已整改 | 设置页 `外观设置，切换应用主题和看板娘显示`、`数据管理，管理离线缓存和数据备份`、`关于 Bilisound，版本 2.3.0` 等行均暴露为 `button`。 |
| 设置开关行 | 已整改 | `使用 av 号而非 bv 号...`、`自动缓存队列中的曲目...`、`开发者模式...` 等条目暴露为 `android.widget.Switch`。 |
| 文本输入框直接输入 | 已整改 | 首页查询输入框暴露为 `android.widget.EditText`，可通过 `agent-device fill` 直接输入。 |
| 文本输入框 label | 部分整改 | 首页查询输入框实际暴露 label/value 为 placeholder `粘贴完整链接或带前缀 ID 至此`，未暴露代码中设置的 `accessibilityLabel="视频链接或 ID"`。 |
| 页面标题/header | 未完全达标 | 设置页顶部标题未在 snapshot 中出现；关于页可找到 `关于`，但类型为 `android.view.View`，未体现 header 语义。 |
| 页面切换焦点迁移 | 未发现整改证据 | 从设置页进入关于页后，snapshot 未显示标题 focused，也未观察到页面切换宣告。 |
| Toast / 动态提示 | 部分可感知但语义弱 | 播放器循环模式 toast 文本如 `使用列表循环` 可被 `wait text` / `find` 捕获，但 attrs 显示为普通 `android.view.View`，未体现 alert/live region 语义。 |

当前优先级判断：

- P0：设置列表和开关语义已基本完成；底部导航仍需决定是否继续追求 Android 上的 `tab` role / selected state，或将 `button` 作为平台折中写入规范。
- P1：文本输入可直接操作，但 label 暴露不符合预期；页面标题/header、焦点迁移、动态提示语义仍需继续整改。
- P2：仍未看到 testID / accessibilityLabel 编码规范和自动化 a11y 检测落地。

## 操作过程中暴露的具体问题

### 1. 底部导航栏不可访问

- **现象**：`agent-device snapshot` 无法检索到「歌单 / 查询 / 设置」三个底部标签的文字或按钮节点。
- **后果**：自动化脚本只能凭坐标盲猜；实际测试中多次点错，误入扫码页、下载管理页、关于页等无关页面。
- **根因**：导航项很可能使用了自定义绘制布局，未设置 `accessibilityLabel`、`accessibilityRole="button/tab"` 以及 `accessibilityState={{ selected }}`。

### 2. 设置列表项缺乏语义标识

- **现象**：「导出日志」「关于 Bilisound」「下载管理」等行组件没有稳定的 accessibility 标签或 testID。
- **后果**：点击「导出日志」时连续误触到「下载管理」和「关于」页面；最终只能通过 `bilisound://settings/logs` deep link 直达目标。
- **根因**：`SettingMenuItem` 等共享行组件未统一暴露 `accessibilityRole="button"` 和描述性 label。

### 3. 文本输入框焦点管理不标准

- **现象**：dev client 的连接 URL 输入框无法直接用 `agent-device type` 输入，必须先点击文本框元素获取焦点。
- **后果**：辅助技术和自动化工具难以直接操作输入框。
- **根因**：输入组件的焦点行为可能依赖自定义手势，未遵循原生 `TextInput` 的焦点语义。

### 4. 页面切换缺少可感知通知

- **现象**：通过 deep link 跳转后，没有明显的 accessibility 焦点迁移或页面切换宣告。
- **后果**：屏幕阅读器用户可能不知道页面已经改变。
- **根因**：未使用 `accessibilityRole="header"`、Live Region 或焦点管理来宣告页面变化。

## 为什么会绕这么多弯路

本次验证中走了大量非预期路径，主要原因不是测试工具能力不足，而是应用本身缺少可访问性工程规范：

1. **未给可交互元素添加语义角色**：React Native 不会自动给 `Pressable` / `View` 加 role，需要开发者主动声明。
2. **自定义布局替代了原生导航语义**：底部导航和设置列表看起来是自定义实现，但 accessibility tree 中没有暴露子节点。
3. **缺少 testID / accessibilityLabel 规范**：没有为关键交互路径提供稳定的机器可读标识。
4. **输入组件未遵循原生焦点语义**：导致辅助技术和自动化工具都需要“手动聚焦”才能输入。

## 整改优先级建议

### P0：必须立即修复（阻塞辅助技术使用）

1. **底部导航栏**
   - 每个 tab 添加 `accessibilityLabel`（如「歌单标签」、「查询标签」、「设置标签」）。
   - 添加 `accessibilityRole="tab"`。
   - 添加 `accessibilityState={{ selected: boolean }}` 反映当前选中状态。

2. **设置列表行组件**
   - 在 `SettingMenuItem` 上统一添加 `accessibilityRole="button"`。
   - 提供描述性 `accessibilityLabel`，包含标题和副标题信息（如「外观设置，切换应用主题和看板娘显示」）。
   - 开关类条目添加 `accessibilityRole="switch"` 和 `accessibilityState={{ checked }}`。

### P1：强烈建议修复（显著提升可用性）

3. **文本输入框**
   - 确保所有 `TextInput` 都能通过 accessibility 焦点直接接收输入。
   - 添加 `accessibilityLabel` 和 `accessibilityHint`。

4. **页面标题与切换宣告**
   - 每个 screen 顶部标题使用 `accessibilityRole="header"`。
   - 页面切换后，将 accessibility 焦点移动到标题或主要内容区。
   - 对动态内容（如 toast、错误提示）使用 Live Region。

### P2：长期优化

5. **建立 testID / accessibilityLabel 编码规范**
   - 在 `AGENTS.md` 或相关规范中约定：所有可交互元素必须提供稳定的 `testID` 或 `accessibilityLabel`。
   - 新功能在 PR  review 中检查 a11y 标识。

6. **引入自动化 a11y 检测**
   - 可考虑集成 `@react-native-community/eslint-plugin` 的 a11y 规则，或使用 axe / accessibility-insights 等工具进行回归检测。

## 参考文件

- 受影响组件：
  - `apps/mobile/components/setting-menu.tsx`
  - `apps/mobile/components/layout.tsx`
  - `apps/mobile/components/layout-button.tsx`
  - `apps/mobile/app/(main)/settings.tsx`
- 需重点检查的其他区域：
  - 底部导航实现（未在本次迁移中修改，但操作困难最突出）
  - 全局 `TextInput` 封装
  - `Pressable` / `TouchableOpacity` 等可交互基座组件

## 结论

本次设置页 NativeWind → StyleSheet 迁移本身完成，但验证过程充分暴露了应用 a11y 的薄弱。建议在新会话中针对上述 P0/P1 项进行专项整改，优先补全底部导航和设置列表的 accessibility 语义，并为后续新增 UI 建立可访问性检查清单。
