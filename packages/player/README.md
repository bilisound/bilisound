# @bilisound/player

Bilisound 专用的 Expo 原生音频播放模块。提供完整的播放控制、队列管理和后台播放能力。

> 这是 Bilisound 项目的内部包。如需通用音频播放方案，请考虑 [React Native Track Player](https://rntp.dev/)。

## 在本项目中的角色

Player 是数据流的最后一环，接收 SDK 获取的音频 URL，提供播放控制 API 和 React Hooks。

```
SDK 获取音频 URL → Player.addTrack() → Player.play() → 音频输出
```

## 核心 API

### 播放控制

| 函数 | 说明 |
|------|------|
| `play()` | 开始/恢复播放 |
| `pause()` | 暂停 |
| `toggle()` | 切换播放/暂停 |
| `prev()` / `next()` | 上/下一首 |
| `seek(to)` | 跳转到指定位置 (ms) |
| `jump(to)` | 跳到队列指定索引 |
| `setSpeed(speed, retainPitch)` | 播放速度 (0.5-2.0) |

### 队列管理

| 函数 | 说明 |
|------|------|
| `setQueue(tracks, startIndex)` | 设置完整队列 |
| `addTrack(track)` / `addTracks(tracks)` | 添加曲目 |
| `deleteTracks(indices)` | 删除指定曲目 |
| `clearQueue()` | 清空队列 |
| `replaceTrack(index, track)` | 替换曲目 |

### 下载管理

| 函数 | 说明 |
|------|------|
| `addDownload(id, uri, metadata)` | 添加下载任务 |
| `getDownloads(state?)` | 查询下载状态 |
| `pauseDownload(id)` / `resumeDownload(id)` | 暂停/恢复下载 |
| `removeDownload(id)` | 移除下载 |

### 状态查询

| 函数/Hook | 说明 |
|-----------|------|
| `getCurrentTrack()` | 当前曲目 |
| `getIsPlaying()` | 播放中? |
| `getProgress()` | 当前进度 |
| `getRepeatMode()` | 循环模式 |
| `useProgress()` | 进度 Hook (0.5s 轮询) |
| `useQueue()` | 队列 Hook |
| `useIsPlaying()` | 播放状态 Hook |

## Hooks

所有 Hook 从 `@bilisound/player` 直接导出：

```ts
import { useCurrentTrack, useIsPlaying, useProgress, useQueue } from "@bilisound/player";
```

## 循环模式

| 值 | 含义 |
|----|------|
| `0` | 不循环 (OFF) |
| `1` | 单曲循环 (ONE) |
| `2` | 列表循环 (ALL) |

## 事件

通过 `registerBackgroundEventListener` 注册后台事件处理，在 `apps/mobile/app/_layout.tsx` 中初始化。

## 功能列表

- 完整播放控制 (play, pause, seek, next/prev)
- 队列管理 (支持增删改替换)
- 循环模式 (OFF/ONE/ALL)
- 播放速度调整 (保留音高)
- 后台播放
- 下载管理 (音频缓存)
- 自定义网络 Headers
- 跨平台 (iOS/Android/Web)

## 安装

### 在 Expo 项目中

```bash
npx expo install @bilisound/player
```

### 在裸 React Native 项目中

```bash
npm install @bilisound/player
cd ios && pod install
```
