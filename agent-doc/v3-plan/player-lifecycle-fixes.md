# Android 播放器生命周期修复计划

状态：**计划中，尚未实施**（2026-11-03）

本计划来自一次 Android 播放器生命周期审计。审计时 `develop` 位于 `2b3606c3`，文中的行号都以这个提交为准；实施前请重新核对源码。审计范围只覆盖 Android 原生层（`packages/player/android`）和 `apps/mobile` / `apps/mobile-next` 的 JS 初始化与后台事件链路，**没有覆盖 iOS 和 Web**。

## 背景与结论

问题起点是：「怎么保证不会创建多个播放器实例？」原来的回答是「用了 Singleton」。

审计结论是：

- ExoPlayer 只在 `BilisoundPlaybackService.onCreate()` 中创建。它的唯一性来自 **Android Service 模型**：同一进程内，同一个 Service 类最多只有一个实例。`companion object` 里的 `activePlayer` 不负责创建播放器，它只是一个指向服务内部的静态引用。
- 真正的缺陷出在**生命周期**上。服务销毁以后，静态引用（`activePlayer`）和模块持有的 `controllerFuture` 都不会随之失效或重建；JS 侧初始化在 Activity 重建时也会重复执行。
- Media3 的 `SimpleCache` / `DownloadManager` 采用单例，这是必要且正确的，不需要修改。

## 证据汇总

设备：Redmi K30 5G，Android 16（API 36）。使用重新安装的 Dev Client `moe.bilisound.app.dev`。Media3 的行为通过 1.4.1 AAR 字节码（`javap`）核对。

| ID  | 问题                                                                                                                           | 证据                                                                                                                                                                                     | 优先级 |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| F3  | 未播放时从最近任务划掉 App：Session 被释放，但 ExoPlayer 没有释放；Controller 断连后再也不会重建。进程存活时，播放器会完全失效 | **真机复现**：服务和 session 都消失了，但旧 player 的 `ExoPlayer:Playb` 线程仍然存活。重新打开 App 后，`init()` 和点「播放」都报 `Playback service is not ready`，直到进程被杀           | P0     |
| F1  | 进程存活时 Activity 被重建，`apps/mobile` 会重新执行 `init()`，导致当前播放被暂停并回到 0 秒                                   | **真机复现**两种触发方式：`settings put system font_scale 1.1`；播放中从最近任务划掉 App，再重新打开。两种情况下状态都从 `PLAYING` 变成 `PAUSED, position=0`                             | P0     |
| F2  | `getController()` 在主线程阻塞调用 `controllerFuture.get()`                                                                    | 静态分析加字节码确认：Controller 的连接回调本身也在主线程执行，如果在连接完成前调用 `get()` 会死锁并导致 ANR。实际触发时机未验证                                                         | P0     |
| F4  | `BilisoundTaskService.onHeadlessJsTaskFinish` 无条件调用 `stopForeground` + `stopSelf()`                                       | **真机复现**：其他 Headless 任务还没结束，宿主服务就被停掉并重新 `onCreate`。本轮未观察到崩溃                                                                                            | P1     |
| F6  | 没有启用音频焦点、耳机拔出暂停和 WakeMode                                                                                      | **真机复现**：播放时 `dumpsys audio` 的焦点栈为空，`content=CONTENT_TYPE_UNKNOWN`。字节码确认 Builder 的默认值：`handleAudioFocus=false`、`handleAudioBecomingNoisy=false`、`wakeMode=0` | P1     |
| F5  | 每个播放事件都会启动一次前台服务和一次 Headless JS（包括每 10 秒一次的进度事件）                                               | **真机**：后台熄屏时仍然每 10 秒启动一次。系统以 `PROC_STATE_FGS / BFSL` 放行，所以播放期间**不会**抛 `ForegroundServiceStartNotAllowedException`；问题仅剩性能开销                      | P2     |
| F7  | 进程全局的 500 ms 时间窗会吞掉期间发生的真实切歌事件                                                                           | 静态分析确认，触发窗口很窄                                                                                                                                                               | P2     |
| F8  | 播放出错后没有恢复路径：App 侧没有任何代码消费 `onPlaybackError`                                                               | 静态分析确认                                                                                                                                                                             | P2     |
| F12 | 请求 header 只保存在内存中：进程重启后自动恢复的下载，以及切歌前对下一首的预加载，可能都不带 Referer/UA                        | 静态分析确认；是否会导致 403 待验证                                                                                                                                                      | P2     |
| F9  | MediaController（异步）和静态 `activePlayer`（同步）两条控制路径混用                                                           | 静态分析确认；会产生什么可见后果属于合理推测                                                                                                                                             | P3     |
| F10 | `toggle` 用 `isPlaying` 判断播放/暂停，缓冲时无法暂停                                                                          | 静态分析确认                                                                                                                                                                             | P3     |
| F11 | `OnDestroy` / `OnStartObserving` 中投递的 Runnable 没有异常保护                                                                | 合理推测                                                                                                                                                                                 | P3     |

已排除的问题：

- **前台服务被系统拦截**：播放期间不会发生，见 F5。
- **`OnStartObserving` 重复注册监听器**：它会按事件名触发多次，但 Media3 的 `ListenerSet` 和 `DownloadManager` 的监听器集合都基于 `CopyOnWriteArraySet`，会自动去重，因此不会产生重复事件。
- **屏幕旋转**：`orientation|screenSize|uiMode` 已在 `configChanges` 中声明，旋转不会重建 Activity。

## 实施顺序

```txt
Step 1  P0-A 服务生命周期（F3 服务侧）
Step 2  P0-B 模块 Controller 连接管理（F3 模块侧 + F2）  ← 依赖 Step 1 的释放语义
Step 3  P0-C JS 队列恢复幂等（F1，同时补上 mobile-next 守卫的漏洞）
Step 4  P1   Headless 服务（F4）+ 事件收敛（F5）
Step 5  P1   音频焦点（F6）+ toggle 语义（F10）    ← F6 会产生 playbackSuppression，必须和 F10 一起改
Step 6  P2/P3 其余各项
```

Step 1 到 Step 3 应该放在同一个发布版本中。如果只修复服务侧，`apps/mobile` 仍然会因为 F1 打断播放；如果只修复 F1，F3 场景下播放器仍然会失效。

## P0-A：服务生命周期（F3 服务侧）

**文件**：`packages/player/android/src/main/java/moe/bilisound/player/services/BilisoundPlaybackService.kt`

**现状**

- `onTaskRemoved`（:387-399）：未播放时调用 `mediaSession.release()`，然后把 `mediaSession` 置为 `null` 并调用 `stopSelf()`；**player 没有 release，静态引用也没有清空**。
- `onDestroy`（:227-241）：通过 `mediaSession?.run { player.release() }` 释放 player。如果 session 已经在上一步被置为 `null`，这段代码会被整个跳过，player 因此泄漏。
- 自定义 `onTaskRemoved` 的初衷是规避 androidx/media#1557：加载了播放列表但没有播放就划掉 App，会残留一条失效的媒体通知。修复时必须保留这个意图。

**Media3 1.4.1 的事实**（来自字节码）

- 默认的 `onTaskRemoved` 是：`if (!isPlaybackOngoing()) stopSelf()`。
- `pauseAllPlayersAndStopSelf()` 只做两件事：把所有 session 的 `playWhenReady` 设为 `false`，然后 `stopSelf()`。它**不会** release session。
- 模块中的 MediaController 和服务在同一进程内绑定。只要绑定存在，`stopSelf()` 就不会真正销毁服务。

**方案**

1. 用一个字段 `private var player: ExoPlayer?` 持有 player，不再通过 `mediaSession.player` 间接访问。
2. 新增一个幂等的 `releaseAll()`：依次 `progressUpdateJob.cancel()`、`player.removeListener`、`player.release()`、`mediaSession.release()`，然后把字段置为 `null`，最后在 companion 中**仅当 `activePlayer === this.player` 时**清空 `activePlayer`、`activePlaybackOrder` 和 `pendingPlaybackOrder`，避免误清下一个服务实例设置的引用。
3. 未播放时的 `onTaskRemoved` 改为 `releaseAll(); stopSelf()`；`onDestroy` 中无条件调用 `releaseAll()`，再调用 `coroutineScope.cancel()`。
4. 保留「未播放就释放 session」的行为，用来规避 #1557。服务因此提前进入失效状态，由 P0-B 负责在下一次调用时重新连接并拉起服务。

**验收**

- 未播放时划掉 App：`ps -T -p <pid> | grep "ExoPlayer:Playb"` 应该没有输出。
- 静态引用 `activePlayer` 不会比它所指向的 player 活得更久。

## P0-B：模块 Controller 连接管理（F3 模块侧 + F2）

**文件**：`packages/player/android/src/main/java/moe/bilisound/player/BilisoundPlayerModule.kt`

**现状**

- `getController()`（:192-195）在主线程阻塞调用 `controllerFuture?.get()`，没有超时，也不检查 `isDone`。
- `controllerFuture` 只在 `OnCreate`（:245-261）中创建一次。Controller 断连后，Media3 会通过 `onServiceDisconnected`、`onBindingDied` 或 Session 发出的 disconnect 回调让 Controller 自行 release，但模块里**从不重建**。
- 直连路径（`setQueue*`、`clearQueue`、`replaceTrack`、`get/setPlaybackOrder`）依赖 `activePlayer` 非空，服务一旦销毁就直接抛异常。

**方案**

1. 新增 `withController(promise, block)`：
   - 如果 future 已完成，且 Controller 处于 `isConnected` 状态，就直接在主线程执行 `block`。
   - 如果 future 为 `null`、已失败，或 Controller 已断连，就重新调用 `MediaController.Builder(...).buildAsync()`，把 `block` 放进等待队列，在 `addListener(..., ContextCompat.getMainExecutor(context))` 回调中依次执行；连接失败时 reject 队列里所有等待的 promise。
   - **不再调用阻塞式 `get()`**。
2. 所有 `AsyncFunction` 都改为通过 `withController` 执行，**直连路径也要经过它**：连接成功意味着服务的 `onCreate` 已经执行完毕，`activePlayer` 此时一定不为空。
3. 给 Controller 注册 `MediaController.Listener.onDisconnected`：把 future 置为 `null`，同时移除 `playerListener`。**不要在断连回调中立即重连**，否则划掉任务后服务会立刻被重新拉起，可能再次产生 #1557 那种残留通知；等到下一次命令时再按需重连。
4. 重连成功后，如果 JS 侧仍然有事件订阅，要把 `playerListener` 重新挂上去。可以用一个布尔值记录「是否处于 observing 状态」，在 `OnStartObserving` 中置位。
5. `OnDestroy` 不再调用 `getController()`，而是直接对已完成的 future 执行 `removeListener` 和 `release()`，并用 try/catch 包住（同时处理 F11）。

**验收**

- 未播放时划掉 App，再重新打开：队列能恢复（依赖 P0-C），点「播放」可以正常出声，Metro 里不再出现 `Playback service is not ready`。
- 在本地临时把 `buildAsync()` 包进 `postDelayed(…, 3000)` 来拉长连接握手，启动后立刻调用 `play`：不会 ANR，命令在连接完成后执行。验证完这个临时改动**不要提交**。

## P0-C：JS 队列恢复幂等（F1）

**文件**

- `apps/mobile/app/_layout.tsx:83, 98-104`：用 `useRef` 做守卫，作用域只是单次挂载。
- `apps/mobile/utils/init.ts:61`、`apps/mobile/features/playback/queue-persistence.ts:79-84`：调用 `setQueueWithOptions(..., { preservePlaybackState: false })`，而且没有传 `position`。
- `apps/mobile-next/app/_layout.tsx:21-46`：用模块级的 `initialization` Promise 做守卫，所以**不会出现 F1**；但守卫成功后就再也不会恢复队列。

**问题的两面**

- `apps/mobile`：每次重新挂载都会重新恢复队列，覆盖原生侧正在播放的状态（F1）。
- `apps/mobile-next`：只在 JS 运行时内恢复一次。在 F3 场景下，服务被销毁而 JS 运行时还在，原生队列已经清空，JS 却认为初始化已经完成，于是队列不会再恢复。P0-B 修好以后，这个缺口就会暴露出来。

**方案**（两个 App 使用同一套规则）

1. 把「一次性初始化」（日志、目录、数据库迁移、缓存迁移、占位资源）和「队列恢复」拆开：
   - 一次性初始化：采用 mobile-next 的模块级 Promise 守卫，`apps/mobile` 照搬这个模式。
   - 队列恢复：抽出一个 `ensureQueueRestored()`，**每次根组件挂载都调用**。它先 `await Player.getTracks()`，只有在原生队列为空时，才从 `queueStorage` 恢复。
2. 原生队列不为空时，以原生侧为准，不再覆盖。这样可以覆盖 Activity 重建、任务被移除后重开、Headless 冷启动后再进入前台等情况。
3. 队列快照保存在 `features/playback/queue-snapshot.ts` 中，目前**不记录播放进度**。进程被杀后从 0 秒开始是现有的设计取舍，不属于本计划范围。

**验收**

- 播放中执行 `settings put system font_scale 1.1`（测完要恢复成 `1.0`）：继续播放，进度保持不变。
- 播放中从最近任务划掉 App，再重新打开：继续播放，进度保持不变。
- 未播放时划掉 App，再重新打开（与 P0-B 联合验证）：队列恢复，可以播放。
- 为 `ensureQueueRestored` 编写 Jest 用例：mock `@bilisound/player`，当原生队列不为空时，断言不调用 `setQueueWithOptions`。按 [verification.md](../verification.md) 用 `--watchAll=false` 运行。

## P1：Headless 服务与事件收敛（F4、F5）

**文件**：`services/BilisoundTaskService.kt:69-74`，`services/BilisoundPlaybackService.kt:248-256, 401-420`，`apps/*/features/playback/background.ts`

**方案**

1. 删除 `onHeadlessJsTaskFinish` 覆写中的 `stopForeground(STOP_FOREGROUND_REMOVE)` 和 `stopSelf()`，交给 RN 基类按 `activeTasks.isEmpty()` 判断何时停止（见 RN 0.88 `HeadlessJsTaskService.kt:100-105`）。
2. 只把 JS 真正需要处理的事件发给 Headless 任务。目前只有 `onTrackChange`，P2 阶段会再加上 `onPlaybackError`。进度、`isPlaying`、`playbackState` 这几类事件在前台已经通过 `sendEvent` 送达，不再额外启动前台服务。
3. 给 `emitJSEvent` 加上 try/catch，捕获 `IllegalStateException`（`ForegroundServiceStartNotAllowedException` 是它的子类），记录日志后丢弃这次事件，不要让异常传出去导致进程崩溃。

**验收**

- 后台熄屏播放 2 分钟以上：日志中不再每 10 秒出现一次 `BilisoundTaskService onCreate`。
- 自动切歌后，下一首仍然能被刷新并正常播放。
- 一次切歌期间，Headless 任务结束前服务不会被重建。

## P1：音频焦点与 toggle（F6、F10）

**文件**：`BilisoundPlaybackService.kt:200-202`，`BilisoundPlayerModule.kt:366-380`

**方案**

1. 在 `ExoPlayer.Builder` 上补充以下配置：
   - `setAudioAttributes(AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MUSIC).build(), /* handleAudioFocus= */ true)`
   - `setHandleAudioBecomingNoisy(true)`
   - `setWakeMode(C.WAKE_MODE_NETWORK)`
2. 启用音频焦点后，会出现 `playWhenReady == true` 但 `isPlaying == false` 的状态（播放被抑制，或者正在缓冲）。因此 `toggle` 必须同步改成以 `playWhenReady` 为准，推荐直接使用 `Util.handlePlayPauseButtonAction(controller)`；UI 上播放/暂停按钮的图标也应该按 `Util.shouldShowPlayButton` 的语义显示。
3. 这项改动会改变产品行为：来电或其他 App 开始播放时，Bilisound 会自动暂停。需要写进变更日志。

**验收**

- 播放时，`dumpsys audio` 的焦点栈中能看到 `moe.bilisound.*`。
- 用另一个 App 播放音乐时，Bilisound 会暂停；拔出耳机时会暂停。
- 缓冲过程中点 toggle，能够暂停。

## P2/P3：其余各项

| ID  | 方案要点                                                                                                                                                                                                                                 | 文件                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| F7  | 删除进程全局的 500 ms 时间窗和 `replaceTrack` 中两处 `postDelayed`（100 ms / 500 ms），改用一次性标记：替换前记下 `mediaId`，只忽略这次替换产生的那一个 transition（`reason == PLAYLIST_CHANGED` 且 `mediaId` 不变）。                   | `BilisoundPlayerModule.kt:139, 161-181, 617-649`；`BilisoundPlaybackService.kt:67-85, 357-361` |
| F8  | 前台和 Headless 都处理 `onPlaybackError`：遇到 HTTP 403/410 时刷新当前曲目的 URL 并调用 `replaceTrack`；网络类错误按退避策略重试 `prepare()`，同时限制最大重试次数。                                                                     | `apps/*/features/playback/background.ts`、`track-operations.ts`                                |
| F12 | 在 `setQueue*` / `addTrack*` 时就为所有曲目写入 header bank，而不是等到切歌时才写；`DownloadManager` 初始化时遍历 `downloadIndex`，从 `request.data` 中恢复 header。                                                                     | `BilisoundPlayerModule.kt:102-159, 833-934`；`BilisoundPlaybackService.kt:373-377`             |
| F9  | 长期方案：把 `setMediaItems`、`replaceMediaItem`、`get/setPlaybackOrder` 改成 `MediaSession` 自定义命令（`SessionCommand`），让 MediaController 成为唯一的修改入口，然后删除 `activePlayer` 静态引用和 `pendingPlaybackOrder` 补偿逻辑。 | `BilisoundPlaybackService.kt:53-177`、`BilisoundPlayerModule.kt`                               |
| F11 | `OnDestroy` 和 `OnStartObserving` 投递的 Runnable 用 try/catch 包住，并改用 `appContext.reactContext?` 的空安全写法。随 P0-B 一起完成。                                                                                                  | `BilisoundPlayerModule.kt:263-279`                                                             |

## 真机回归清单

前置步骤见 [mobile-debugging.md](../mobile-debugging.md)。先运行 `agent:android:doctor`，如果提示 Dev Client 过旧就重新安装。临时产物统一写入 `.temp/`。

```bash
# 状态与进度
adb shell dumpsys media_session | grep -A12 moe.bilisound | grep -oE "state=[A-Z]+\([0-9]\), position=[0-9]+"
# 服务是否存活 / 旧 player 线程是否泄漏
adb shell dumpsys activity services moe.bilisound.app.dev | grep ServiceRecord
adb shell ps -T -p $(adb shell pidof moe.bilisound.app.dev) | grep ExoPlayer:Playb
# 音频焦点
adb shell dumpsys audio | sed -n '/Audio Focus stack entries/,/^$/p'
# 后台前台服务启动（以及系统放行的理由）
adb logcat -d | grep "Background started FGS"
# Activity 重建（测完务必恢复为 1.0）
adb shell settings put system font_scale 1.1
```

| 场景                         | 修复前（2026-11-03 实测）                                         | 修复后的期望                     |
| ---------------------------- | ----------------------------------------------------------------- | -------------------------------- |
| 播放中修改字体大小           | 暂停，进度回到 0 秒                                               | 继续播放，进度不变               |
| 播放中划掉 App，再重新打开   | 暂停，进度回到 0 秒                                               | 继续播放，进度不变               |
| 未播放时划掉 App，再重新打开 | 播放器失效（`Playback service is not ready`），旧 player 线程残留 | 队列恢复，可以播放，没有线程残留 |
| 后台熄屏播放                 | 每 10 秒启动一次 TaskService                                      | 只在切歌时启动                   |
| 播放时查看焦点栈             | 为空                                                              | 包含 Bilisound                   |

## 不在本计划范围

- **iOS / Web**：没有审计。P0-C 的 JS 改动在所有平台生效，需要在 iOS 上回归一遍。
- **升级 Media3**：当前版本 1.4.1 较旧，可以单独评估升级。升级时要重新核对 `onTaskRemoved` 默认行为、通知相关 API 和 `pauseAllPlayersAndStopSelf` 的语义。
- **播放恢复**（`MediaButtonReceiver` + `onPlaybackResumption`）：目前没有实现，与官方默认行为（关闭）一致，属于功能缺失，不是缺陷。
- **持久化播放进度**：属于产品决策。
