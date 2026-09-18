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

列定义以 `storage/sqlite/schema.ts` 为准；原生端的实际建表语句在迁移状态机里（见下节）。从 schema 看不出的约定：

- `playlist_meta.amount` 是冗余的曲目数。`addToPlaylist` 与 `deletePlaylistDetail` 不会更新它，调用方需要再调用 `syncPlaylistAmount`；`replacePlaylistDetail` 与 `clonePlaylist` 会自行更新。
- `playlist_meta.source` 存 `PlaylistSource`（`typings/playlist.ts`）的 JSON 字符串，编解码在 `features/playlist/mappers.ts`；`extended_data` 也是 JSON 文本。
- 删除歌单时 `deletePlaylistMeta` 显式删除对应的 `playlist_detail` 行，不依赖外键级联。
- `theme_profile` 只存在于原生端 SQLite；Web 端的主题元数据与图片 Blob 存在 IndexedDB 的 `themeProfile` / `themeAsset` 对象存储。

### 迁移

- `storage/sqlite/drizzle/` 是 Drizzle Kit 生成的 SQL 与 schema 历史，目前不由运行时 migrator 执行。
- 原生端实际迁移入口是 `apps/mobile/utils/migration/playlist.ts`。它读取 MMKV 中的 `playlist_db_version`，执行手写的 SQLite 建表 / ALTER / 数据修复状态机；当前目标版本为 5。
- Web 端由 `storage/sqlite/init-web.ts` 的 IndexedDB `upgrade` 回调按数据库版本创建对象存储；当前版本为 2。
- 修改结构化存储时，必须同时更新 schema 与对应平台的实际迁移路径，不能只运行 Drizzle Kit。
- 原生端启动迁移的顺序以 `apps/mobile/utils/init.ts` 为准：歌单库迁移之后还有 `features/cache/migration.ts`（按 `CACHE_STATUS_VERSION` 把存量离线音频录入缓存标记）；播放队列恢复时，`features/playback/queue-persistence.ts` 会调用 `utils/migration/legacy-queue.ts` 与 `utils/migration/shuffle-queue.ts` 处理旧版队列文件与随机播放 key。

## MMKV

**位置**: `apps/mobile/storage/`；缓存标记位于 `apps/mobile/features/cache/`。

MMKV 用于简单状态的快速持久化。Web 端通过 `react-native-mmkv` 的 Web 实现提供对应 KV 存储。

| MMKV 实例 ID       | 文件                             | 当前存储内容                                                            |
| ------------------ | -------------------------------- | ----------------------------------------------------------------------- |
| `storage-queue`    | `queue.ts`                       | canonical 队列、当前索引、数据版本、随机偏好与 canonical index 播放顺序 |
| `storage-playlist` | `playlist.ts`                    | 当前队列所属歌单、歌单 DB 迁移版本、单曲循环恢复标记及旧版迁移数据      |
| `cache-status`     | `features/cache/cache-status.ts` | BV + 分 P → 本地缓存标记                                                |
| `storage-zustand`  | `zustand.ts`                     | Zustand persist 通用适配器（superjson 序列化）                          |

`storage/queue.ts` 的 `queue_list_backup` key 为兼容旧数据而保留；当前存储的是随机播放顺序 `number[]`，不再是备份队列。

**注意**: `storage/playlist.ts` 是播放上下文与迁移状态，不是歌单 CRUD。歌单 CRUD 在 `storage/sqlite/playlist.ts`。

## Zustand

业务状态在各 `apps/mobile/features/<domain>/` 内；`apps/mobile/store/` 只保留无业务语义的 UI 交互状态。store 默认只在内存中，只有显式使用 `persist` 与 `storage/zustand.ts` 的 `createStorage()` 才会写入 MMKV（`storage-zustand` 实例）。当前持久化的 store：

| persist 名       | 文件                           | 内容                                                                                |
| ---------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| `settings-store` | `features/config/store.ts`     | 应用设置；feature 外只通过 `features/config` 的 selectors（响应式）或 policies 读取 |
| `history-store`  | `features/playback/history.ts` | 播放历史                                                                            |

persist 名就是已上线的存储 key，改名或改变存储结构都需要迁移。完整 store 列表不在此维护，用下面的命令查找：

```bash
grep -rln 'from "zustand"' apps/mobile --include='*.ts' --include='*.tsx' --exclude-dir=node_modules
```

用户主题持久化在 SQLite `theme_profile` / IndexedDB，`features/theme/registry.ts` 的 store 只是内存缓存。

## 文件系统（原生端）

路径定义位于 `apps/mobile/constants/file.ts`：

| 目录                       | 内容                       |
| -------------------------- | -------------------------- |
| `documentDirectory/sounds` | 离线音频                   |
| `documentDirectory/themes` | 用户主题图片               |
| `cacheDirectory/logs`      | 日志                       |
| `cacheDirectory/downloads` | 下载与音视频处理的中间文件 |

Web 端不使用这些原生目录；主题图片 Blob 保存在 IndexedDB，当前离线下载链路主要面向原生端。
