# 数据层

Bilisound 的客户端状态与持久化由四类机制协作：Zustand 管理 UI 与功能状态，MMKV 持久化简单 KV，SQLite / IndexedDB 存储结构化数据，文件系统保存离线音频、主题资源和临时文件。部分 Zustand store 会通过 MMKV 中间件持久化，并非全部都是临时状态。

## 概览

```text
Native（iOS / Android）
  Zustand ──可选 persist──> MMKV
  MMKV                     队列快照、随机播放顺序、设置、历史、缓存标记
  SQLite + Drizzle         歌单、曲目、用户主题元数据
  FileSystem               离线音频、主题图片、日志与下载中间文件

Web
  Zustand ──可选 persist──> react-native-mmkv Web 存储
  IndexedDB                歌单、曲目、用户主题及主题图片 Blob
```

## SQLite (Drizzle ORM)

**位置**: `apps/mobile/storage/sqlite/`

### 主要数据库文件

| 文件 / 模块                     | 职责                                                            |
| ------------------------------- | --------------------------------------------------------------- |
| `main.ts`                       | 初始化 expo-sqlite + Drizzle 实例                               |
| `schema.ts`                     | Drizzle 表定义（playlist_meta、playlist_detail、theme_profile） |
| `playlist.ts`                   | 原生端歌单 CRUD                                                 |
| `playlist.web.ts`               | Web 端 IndexedDB 歌单 CRUD                                      |
| `init-web.ts`                   | 初始化 Web IndexedDB 与对象存储                                 |
| `features/theme/storage.ts`     | 原生端用户主题元数据与图片文件存储                              |
| `features/theme/storage.web.ts` | Web 端用户主题与图片 Blob 存储                                  |

### 表结构

**playlist_meta** — 歌单元数据

| 列              | 类型       | 说明                                |
| --------------- | ---------- | ----------------------------------- |
| `id`            | INTEGER PK | 自增主键                            |
| `title`         | TEXT       | 标题                                |
| `color`         | TEXT       | 主题色                              |
| `amount`        | INTEGER    | 曲目数量                            |
| `img_url`       | TEXT       | 封面 URL                            |
| `description`   | TEXT       | 描述文本                            |
| `source`        | TEXT       | 来源信息 JSON (PlaylistSource 类型) |
| `filter_rules`  | TEXT       | 过滤规则                            |
| `extended_data` | TEXT       | 扩展数据 (JSON)                     |

**playlist_detail** — 歌单曲目

| 列              | 类型       | 说明                    |
| --------------- | ---------- | ----------------------- |
| `id`            | INTEGER PK | 自增主键                |
| `playlist_id`   | INTEGER FK | 外键 → playlist_meta.id |
| `author`        | TEXT       | UP主名称                |
| `bvid`          | TEXT       | BV号                    |
| `duration`      | INTEGER    | 时长 (秒)               |
| `episode`       | INTEGER    | 分P编号                 |
| `title`         | TEXT       | 曲目标题                |
| `img_url`       | TEXT       | 封面                    |
| `extended_data` | TEXT       | 扩展数据 (JSON)         |

**theme_profile** — 原生端用户主题元数据

| 列                | 类型    | 说明            |
| ----------------- | ------- | --------------- |
| `id`              | TEXT PK | 主题 ID         |
| `name`            | TEXT    | 主题名称        |
| `created_at`      | INTEGER | 创建时间        |
| `updated_at`      | INTEGER | 更新时间        |
| `palette_json`    | TEXT    | 调色板 JSON     |
| `yuru_chara_json` | TEXT    | 看板娘布局 JSON |
| `image_asset_id`  | TEXT    | 主题图片资源 ID |

### 迁移

- `storage/sqlite/drizzle/` 是 Drizzle Kit 生成的 SQL 与 schema 历史，目前不由运行时 migrator 执行。
- 原生端实际迁移入口是 `apps/mobile/utils/migration/playlist.ts`。它读取 MMKV 中的 `playlist_db_version`，执行手写的 SQLite 建表 / ALTER / 数据修复状态机；当前目标版本为 5。
- Web 端由 `storage/sqlite/init-web.ts` 的 IndexedDB `upgrade` 回调按数据库版本创建对象存储；当前版本为 2。
- 修改结构化存储时，必须同时更新 schema 与对应平台的实际迁移路径，不能只运行 Drizzle Kit。

## MMKV

**位置**: `apps/mobile/storage/`

MMKV 用于简单状态的快速持久化。Web 端通过 `react-native-mmkv` 的 Web 实现提供对应 KV 存储。

| MMKV 实例 ID       | 文件              | 当前存储内容                                                            |
| ------------------ | ----------------- | ----------------------------------------------------------------------- |
| `storage-queue`    | `queue.ts`        | canonical 队列、当前索引、数据版本、随机偏好与 canonical index 播放顺序 |
| `storage-playlist` | `playlist.ts`     | 当前队列所属歌单、歌单 DB 迁移版本、单曲循环恢复标记及旧版迁移数据      |
| `cache-status`     | `cache-status.ts` | BV + 分 P → 本地缓存标记                                                |
| `storage-zustand`  | `zustand.ts`      | Zustand persist 通用适配器（superjson 序列化）                          |

`storage/queue.ts` 的 `queue_list_backup` key 为兼容旧数据而保留；当前存储的是随机播放顺序 `number[]`，不再是备份队列。

**注意**: `storage/playlist.ts` 是播放上下文与迁移状态，不是歌单 CRUD。歌单 CRUD 在 `storage/sqlite/playlist.ts`。

## Zustand

**位置**: `apps/mobile/store/`、`apps/mobile/features/config/`，以及各 feature 内的局部 store。

| Store / 状态   | 文件                               | 用途                           | 持久化 |
| -------------- | ---------------------------------- | ------------------------------ | ------ |
| settings       | `features/config/store.ts`         | 应用设置与资源、下载、诊断策略 | MMKV   |
| download       | `store/download.ts`                | 当前下载任务列表与状态         | 否     |
| bottom-sheet   | `store/bottom-sheet.ts`            | 底部弹出面板状态               | 否     |
| apply draft    | `features/playlist/apply-draft.ts` | 创建 / 加入歌单过程的临时草稿  | 否     |
| error-message  | `store/error-message.ts`           | 全局错误消息提示               | 否     |
| features       | `store/features.ts`                | 功能开关                       | MMKV   |
| history        | `store/history.ts`                 | 播放历史                       | MMKV   |
| playback-speed | `store/playback-speed.ts`          | 当前播放速度与保留音高状态     | 否     |

Zustand store 只有显式使用 `persist` 与 `storage/zustand.ts` 适配器时才会写入 MMKV。

## 文件系统（原生端）

路径定义位于 `apps/mobile/constants/file.ts`：

| 目录                       | 内容                       |
| -------------------------- | -------------------------- |
| `documentDirectory/sounds` | 离线音频                   |
| `documentDirectory/themes` | 用户主题图片               |
| `cacheDirectory/logs`      | 日志                       |
| `cacheDirectory/downloads` | 下载与音视频处理的中间文件 |

Web 端不使用这些原生目录；主题图片 Blob 保存在 IndexedDB，当前离线下载链路主要面向原生端。
