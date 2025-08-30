# Bilisound 客户端

基于 React Native (Expo) 的 Bilisound 客户端，支持 iOS、Android 和 Web 三个平台。

## 技术栈

| 名称                                                                  | 简介                         |
| --------------------------------------------------------------------- | ---------------------------- |
| [Expo](https://expo.dev/)                                             | 基于 React Native 的跨端框架 |
| [React Query](https://tanstack.com/query/latest)                      | 异步请求状态管理             |
| [FFmpegKit for React Native](https://github.com/arthenica/ffmpeg-kit) | 音频提取和转码处理           |
| [Zustand](https://zustand-demo.pmnd.rs/)                              | React 全局状态管理           |
| [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv)    | 持久化键值对存储             |

## 开发模式

由于本项目引用了若干带有原生代码的第三方库，因此不能使用 Expo Go。开发前，请根据 [这篇文档](https://docs.expo.dev/guides/local-app-development/) 的说明设置好开发环境，构建 Development build 进行开发。

### iOS

```bash
pnpm run ios
```

### Android

```bash
pnpm run android
```

### Web (Beta，不同于当前线上 Web 版)

```bash
pnpm run web
```

## 构建生产版本

构建生产版本以前，需要准备好 keystore 文件 (Android)……

### Android

```bash
pnpm run build:android
```
