# Bilisound - 20260601 Expo SDK 56 升级与 Android 底部导航修复

## 背景

本次改动将移动端从 Expo SDK 55 升级到 SDK 56。升级后 Android 真机可以构建运行，但验证过程中暴露了两类问题：

- SDK 56 相关依赖在 pnpm monorepo 下没有完全暴露，导致 Metro 或原生运行时报缺失模块。
- Android 底部导航外观相较升级前出现回归，`pb-safe` 对 bottom safe-area 的处理不稳定，底部 TabBar 视觉上贴近系统手势条。

因此本次除了 SDK 版本升级，也同步处理了 Android dev-client 启动、Metro 解析、NativeWind safe-area 样式和相关 peer dependency 问题。

## 主要变更

### 1. 升级 Expo SDK 56 与核心运行时依赖

移动端依赖从 SDK 55 系列升级到 SDK 56 系列，包括 Expo、React、React Native、React Native Screens、Reanimated、Worklets、Jest Expo 和 TypeScript 等。

文件引用：`apps/mobile/package.json:76`

```json
"expo": "~56.0.8",
"expo-router": "~56.2.8",
"react": "19.2.3",
"react-dom": "19.2.3",
"react-native": "0.85.3",
"react-native-reanimated": "~4.3.1",
"react-native-worklets": "0.8.3",
"typescript": "~6.0.3"
```

自定义原生模块 `@bilisound/player` 的开发依赖也同步升级到 Expo SDK 56 对应版本。

文件引用：`packages/player/package.json:32`

```json
"devDependencies": {
  "@types/react": "~19.2.14",
  "expo": "~56.0.8",
  "expo-module-scripts": "^5.0.8",
  "expo-modules-core": "~56.0.14",
  "react-native": "0.85.3"
}
```

### 2. 迁移 React Navigation 入口到 Expo Router

SDK 56 要求应用代码不再直接从 `@react-navigation/*` 导入 React Navigation API。项目中保留运行时 API 用法，但将 import 来源切换到 `expo-router/react-navigation`。

文件引用：`apps/mobile/app/_layout.tsx:7`

```ts
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
```

文件引用：`apps/mobile/app/(main)/(playlist)/detail/[id].tsx:2`

```ts
import { usePreventRemove } from "expo-router/react-navigation";
```

同时从 `apps/mobile/package.json` 移除了 `@react-navigation/native` 直接依赖。

### 3. 更新 Worklets Babel 插件

SDK 56 下 `react-native-reanimated` 使用 `react-native-worklets@0.8.x`，Babel 插件从旧的 `react-native-worklets-core/plugin` 改为 `react-native-worklets/plugin`。

文件引用：`apps/mobile/babel.config.js:18`

```js
plugins: [
  ["react-native-worklets/plugin"],
  [
    "module-resolver",
    {
      root: ["./"],
      alias: {
        "~": "./",
        "tailwind.config": "./tailwind.config.js",
      },
    },
  ],
],
```

### 4. 修复 Android 底部导航 safe-area 回归

升级后 Android 底部导航依赖的 `pb-safe` 行为不稳定，导致 bottom safe-area 视觉上被吞。修复方式是不再只依赖 NativeWind safe-area class，而是在 `TabList` 上显式注入 `useSafeAreaInsets()` 计算出的 padding。

文件引用：`apps/mobile/app/(main)/_layout.tsx:234`

```tsx
const isSideTabList = windowDimensions.width >= breakpoints.sm;

const tabListSafeAreaStyle = isSideTabList
  ? {
      paddingTop: edgeInsets.top,
      paddingLeft: edgeInsets.left,
      paddingRight: 0,
      paddingBottom: edgeInsets.bottom,
    }
  : {
      paddingLeft: edgeInsets.left,
      paddingRight: edgeInsets.right,
      paddingBottom: edgeInsets.bottom,
    };
```

文件引用：`apps/mobile/app/(main)/_layout.tsx:261`

```tsx
<TabList
  style={tabListSafeAreaStyle}
  className={
    "flex-0 basis-auto pl-safe pr-safe pb-safe !flex-row !justify-around bg-background-50 " +
    "max-sm:w-full sm:h-full sm:!flex-col sm:pl-safe sm:pr-0 sm:pt-safe sm:!justify-start " +
    "xl:w-64 xl:items-center"
  }
>
```

Android 真机验证中，底部 TabBar 与系统手势条之间的空白已恢复。

### 5. 修复 pnpm monorepo 下的 Metro 解析问题

SDK 56 依赖链中出现多个包内依赖无法解析的问题，例如 `@babel/runtime/helpers/createClass`、`react-freeze`、`@expo/log-box/src/LogBox`、`react-native-css-interop/jsx-runtime`。其中一个关键原因是 Metro 配置中禁用了层级查找。

移除 `disableHierarchicalLookup = true`，恢复 Expo 推荐的解析行为。

文件引用：`apps/mobile/metro.config.js:14`

```js
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
```

为了让 pnpm 下需要由 Metro 直接解析的 peer dependency 明确可见，补充了以下依赖：

文件引用：`apps/mobile/package.json:28`

```json
"@babel/runtime": "^7.29.7",
"@expo/dom-webview": "~56.0.5",
"react-freeze": "^1.0.4",
"react-native-css-interop": "^0.2.1"
```

其中 `react-native-css-interop` 锁定到 NativeWind 4.2.1 所需的 `0.2.1`，避免错误安装到较新版本后导致样式断点异常。

### 6. 统一 `@expo/dom-webview` 版本

Android 运行时曾出现以下原生错误：

```txt
java.lang.NoClassDefFoundError: Failed resolution of: Lexpo/modules/kotlin/types/AnyTypeProvider;
at expo.modules.webview.DomWebViewModule.definition(DomWebViewModule.kt:84)
```

原因是依赖树中仍存在 `@expo/dom-webview@55.0.3`，与 SDK 56 的 `expo-modules-core` 不兼容。通过根 package 的 pnpm override 将其统一到 56 版本。

文件引用：`package.json:23`

```json
"pnpm": {
  "overrides": {
    "@expo/dom-webview": "~56.0.5"
  }
}
```

### 7. 补充 Expo Config 插件

`expo install --fix` 提示动态配置无法自动写入 `expo-image` 和 `expo-sharing` 插件，因此手动补充到 `app.config.ts`。

文件引用：`apps/mobile/app.config.ts:92`

```ts
"expo-font",
"expo-asset",
"expo-sqlite",
"expo-image",
"expo-sharing",
```

## 验证

升级和修复过程中执行过以下验证。

```bash
npx expo prebuild --clean --platform android
```

结果：成功重新生成 `android/` 原生项目。

```bash
npx expo run:android --no-bundler --device 23113RKC6C
```

结果：Android debug APK 构建并安装成功，Gradle 输出 `BUILD SUCCESSFUL`。

```bash
npx expo start --port 8081 --clear -c --dev-client
```

结果：Metro 正常启动，Android bundle 构建成功，真机日志显示应用初始化、数据库初始化和缓存命中正常。

```bash
agent-device snapshot -i --platform android --session android-verify
```

结果：Android 真机可见主界面元素，包括 `扫描二维码`、`历史记录`、输入框 `粘贴完整链接或带前缀 ID 至此`、底部 Tab `歌单 / 查询 / 设置`。

```bash
pnpm run build:web
```

结果：Web export 成功，输出到 `apps/mobile/dist`。

```bash
npx expo-doctor
```

结果：`20/21 checks passed`。剩余失败项为 monorepo 中 `packages/player` 自身 devDependency 带来的 duplicate native module 警告，当前 Android 真机构建和运行已验证通过。

## 提交

```txt
a8faa767035875c0744a3b4ebf9edeb5b2514e42 chore: upgrade mobile app to Expo SDK 56
```
