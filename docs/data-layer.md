# 数据层

Bilisound 使用三层存储架构：SQLite 存储结构化数据，MMKV 存储简单 KV 状态，Zustand 管理 UI 临时状态。

## 概览

```
┌─────────────────────────────────────────────────────────┐
│                     apps/mobile                         │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Zustand    │  │    MMKV      │  │   SQLite     │  │
│  │  (UI 状态)   │  │  (KV 持久化)  │  │  (Drizzle)   │  │
│  │              │  │              │  │              │  │
│  │ settings     │  │ queue        │  │ playlist_meta│  │
│  │ download     │  │ playlist     │  │ playlist_    │  │
│  │ bottom-sheet │  │ cache-status │  │   detail     │  │
│  │ ...          │  │ zustand      │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  Web 端替换:                                            │
│  MMKV → localStorage (dummy)                           │
│  SQLite → IndexedDB (via idb)                          │
└─────────────────────────────────────────────────────────┘
```

## SQLite (Drizzle ORM)

**位置**: `apps/mobile/storage/sqlite/`

### 数据库文件

| 文件 | 职责 |
|------|------|
| `main.ts` | 初始化 expo-sqlite + Drizzle 实例 |
| `schema.ts` | Drizzle 表定义 (playlist_meta, playlist_detail) |
| `playlist.ts` | 原生端 CRUD 操作 (增删改查歌单) |
| `playlist.web.ts` | Web 端 IndexedDB CRUD 操作 (通过 idb 库) |
| `init-web.ts` | IndexedDB 初始化 |

### 表结构

**playlist_meta** — 歌单元数据

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | INTEGER PK | 自增主键 |
| `title` | TEXT | 标题 |
| `color` | TEXT | 主题色 |
| `amount` | INTEGER | 曲目数量 |
| `img_url` | TEXT | 封面 URL |
| `description` | TEXT | 描述文本 |
| `source` | TEXT | 来源信息 JSON (PlaylistSource 类型) |
| `filter_rules` | TEXT | 过滤规则 |
| `extended_data` | TEXT | 扩展数据 (JSON) |

**playlist_detail** — 歌单曲目

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | INTEGER PK | 自增主键 |
| `playlist_id` | INTEGER FK | 外键 → playlist_meta.id |
| `author` | TEXT | UP主名称 |
| `bvid` | TEXT | BV号 |
| `duration` | INTEGER | 时长 (秒) |
| `episode` | INTEGER | 分P编号 |
| `title` | TEXT | 曲目标题 |
| `img_url` | TEXT | 封面 |
| `extended_data` | TEXT | 扩展数据 (JSON) |

### 迁移

迁移 SQL 文件位于 `storage/sqlite/drizzle/`，由 Drizzle Kit 生成。

## MMKV

**位置**: `apps/mobile/storage/`

MMKV 是微信团队开源的高性能 KV 存储，用于简单状态的快速持久化。Web 端降级为 localStorage。

| MMKV 实例 ID | 文件 | 存储内容 |
|-------------|------|---------|
| `storage-queue` | `queue.ts` | 播放队列、播放模式 (0/1/2 REPEAT)、随机队列、备份队列 |
| `storage-playlist` | `playlist.ts` | 当前播放歌单引用 (id + 是否恢复) |
| `cache-status` | `cache-status.ts` | BV+分P → 本地缓存标记 (boolean) |
| `storage-zustand` | `zustand.ts` | Zustand store 通用持久化中间件 (superjson 序列化) |

**注意**: `storage/playlist.ts` 是 MMKV 的播放状态，不是歌单 CRUD。歌单 CRUD 在 `storage/sqlite/playlist.ts`。

## Zustand

**位置**: `apps/mobile/store/`

| Store | 文件 | 用途 |
|-------|------|------|
| settings | `settings.ts` | 应用设置 (主题、API 地址等) |
| download | `download.ts` | 下载任务列表与状态 |
| bottom-sheet | `bottom-sheet.ts` | 底部弹出面板状态 |
| apply-playlist | `apply-playlist.ts` | "加入歌单" 选择器状态 |
| error-message | `error-message.ts` | 全局错误消息提示 |
| features | `features.ts` | 功能开关 |
| history | `history.ts` | 播放历史 |
| playback-speed | `playback-speed.ts` | 播放速度偏好 |

Zustand store 可通过 `storage/zustand.ts` 的 MMKV 中间件持久化（需要显式配置）。
