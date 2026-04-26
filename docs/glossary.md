# 术语表

## B 站 (Bilibili) 术语

| 术语 | 全称/含义 | 说明 |
|------|----------|------|
| **bvid** | BV ID | B 站视频 ID，格式如 `BV1xx411c7mD`，大小写敏感 |
| **aid** | AV ID | B 站旧版视频数字 ID，如 `av170001` |
| **cid** | Content ID | 视频内容 ID，用于获取实际媒体流地址 |
| **epid** | Episode ID | 剧集 ID，用于番剧/影视的某一集 |
| **season** | 番剧/影视季 | B 站内容组织形式，一个 season 包含多个 ep |
| **series** | 视频合集 | UP 主创建的合集，将多个视频组织在一起 |
| **favorite** | 收藏夹 | 用户的收藏夹，每个收藏夹有独立 ID (mlid) |
| **festival** | 活动/节日页面 | B 站活动页，同样有视频列表 |
| **WBI** | Web Browser Interface Signing | B 站 API 签名机制，需要 img_key + sub_key 计算签名 |
| **DASH** | Dynamic Adaptive Streaming over HTTP | B 站使用的流媒体传输协议，音频和视频分离 |
| **durl** | Direct URL | B 站 API 中表示直接播放地址的字段名 |
| **b23.tv** | B站短链接 | `https://b23.tv/xxxx` 格式的短链接，需解析得到真实地址 |
| **UP主** | Uploader | B 站视频上传者/创作者 |

## 项目术语

| 术语 | 说明 |
|------|------|
| **Direct SDK** | `BilisoundSDKDirect` — 原生端直接从客户端调 B 站 API |
| **Remote SDK** | `BilisoundSDKRemote` — Web 端通过 CF Worker 代理调 B 站 API |
| **CF Worker** | Cloudflare Worker — 部署在 Cloudflare Edge 上的 Serverless 函数 |
| **Native Module** | Expo 原生模块 — 通过 `expo-modules-core` 桥接原生平台的 JS 模块 |
| **Expo Router** | Expo 的文件路由系统 — 基于文件系统自动生成路由 |
| **NativeWind** | 将 Tailwind CSS 编译为 React Native StyleSheet 的工具 |
| **GluestackUI** | 基于 NativeWind 的 UI 组件库 |
| **Drizzle ORM** | TypeScript ORM，本项目的 SQLite 数据库层 |
| **MMKV** | 高性能 KV 存储 (微信开源)，用于简单状态持久化 |
| **Zustand** | 轻量 React 状态管理库 |
| **TOML** | 歌单导出格式 (使用 smol-toml 库) |

## URL / ID 格式速查

| 格式 | 示例 | 说明 |
|------|------|------|
| BV 号 | `BV1xx411c7mD` | 12 位，以 `BV` 开头 |
| AV 号 | `av170001` | 纯数字，以 `av` 开头 |
| B 站视频链接 | `https://www.bilibili.com/video/BV1xx411c7mD` | 标准链接 |
| b23 短链 | `https://b23.tv/xxxx` | 需解析 |
| 合集链接 | `https://space.bilibili.com/{uid}/series/{sid}` | UP 主合集 |
| 收藏夹链接 | `https://space.bilibili.com/{uid}/favlist?fid={mlid}` | 用户收藏夹 |
