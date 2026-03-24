# RFC: Bilisound Playlist RESTful API

- **Status**: Draft
- **Date**: 2026-03-24
- **Author**: tcdw

## 1. 概述

本 RFC 提议为 Bilisound 移动端应用增加 RESTful API 功能，允许外部应用（如 OpenClaw）通过 HTTP 接口操作歌单、控制播放队列。API 服务在应用运行时以本地 HTTP Server 的形式提供。

## 2. 设计原则

- **RESTful 风格**: 资源以名词命名，使用标准 HTTP 方法表达操作语义
- **JSON 通信**: 请求和响应体均使用 `application/json`
- **最小暴露**: 只暴露外部应用合理需要的功能，不暴露内部实现细节
- **幂等安全**: GET/PUT/DELETE 保持幂等，POST 用于非幂等操作

## 3. 通用约定

### 3.1 Base URL

```
http://localhost:{port}/api/v1
```

端口号可在应用设置中配置，默认值待定。

### 3.2 认证

采用 **配对码 + Access Token** 的两阶段认证机制。

#### 配对流程

Bilisound 生成一个短时 6 位配对码，展示给用户。

OpenClaw 输入这个配对码，向 Bilisound 发起配对请求。

#### 授权阶段

如果配对码正确，而且没过期，Bilisound 给 OpenClaw 签发一个随机生成的长期 access token。

#### 使用阶段

以后 OpenClaw 调 management API 时，只带这个 token：

```text
Authorization: Bearer <random_token>
```

#### 管理阶段

Bilisound 后台可以查看：

- 已授权客户端列表
- 每个客户端的名字
- 创建时间
- 最后使用时间
- 撤销按钮

#### 免认证接口

以下接口不需要 Token 即可访问：

- `GET /status` — 服务发现与连接测试
- `POST /pair` — 配对请求

#### Token 管理

用户可在 Bilisound 设置中查看所有已配对的客户端，并可随时吊销任意客户端的 Token。

### 3.3 通用响应格式

**成功响应：**

```json
{
  "data": { ... }
}
```

**列表响应：**

```json
{
  "data": [ ... ]
}
```

**错误响应：**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Playlist not found"
  }
}
```

### 3.4 通用错误码

| HTTP Status | Code                | 说明                             |
| ----------- | ------------------- | -------------------------------- |
| 400         | `BAD_REQUEST`       | 请求参数无效                     |
| 401         | `UNAUTHORIZED`      | 未提供或无效的 Token             |
| 401         | `INVALID_PAIR_CODE` | 配对码无效或已过期               |
| 404         | `NOT_FOUND`         | 资源不存在                       |
| 409         | `CONFLICT`          | 操作冲突（如对同步歌单执行编辑） |
| 422         | `VALIDATION_ERROR`  | 请求体校验失败                   |
| 429         | `TOO_MANY_REQUESTS` | 请求过于频繁（配对暴力破解保护） |
| 500         | `INTERNAL_ERROR`    | 服务端内部错误                   |

---

## 4. 数据模型

以下为 API 层面暴露的数据结构，基于现有数据库 schema 设计。

### 4.1 PlaylistMeta

| 字段          | 类型                   | 必填 | 说明                         |
| ------------- | ---------------------- | ---- | ---------------------------- |
| `id`          | number                 | 只读 | 歌单 ID（自增主键）          |
| `title`       | string                 | 是   | 歌单标题                     |
| `color`       | string                 | 是   | 十六进制颜色值，如 `#ff6600` |
| `amount`      | number                 | 只读 | 歌单内曲目数量（自动维护）   |
| `imgUrl`      | string \| null         | 否   | 封面图 URL                   |
| `description` | string \| null         | 否   | 歌单描述                     |
| `source`      | PlaylistSource \| null | 只读 | 上游同步来源信息             |

### 4.2 PlaylistTrack

| 字段         | 类型   | 必填 | 说明                    |
| ------------ | ------ | ---- | ----------------------- |
| `id`         | number | 只读 | 曲目记录 ID（自增主键） |
| `playlistId` | number | 只读 | 所属歌单 ID             |
| `author`     | string | 是   | UP 主/作者名            |
| `bvid`       | string | 是   | Bilibili 视频 BV 号     |
| `duration`   | number | 是   | 时长（秒）              |
| `episode`    | number | 是   | 分 P 序号（从 1 开始）  |
| `title`      | string | 是   | 曲目标题                |
| `imgUrl`     | string | 是   | 封面图 URL              |

### 4.3 PlaylistSource

```typescript
type PlaylistSource =
  | { type: "video"; originalTitle: string; lastSyncAt: number; bvid: string }
  | { type: "playlist"; originalTitle: string; lastSyncAt: number; subType: string; userId: number; listId: number };
```

### 4.4 QueueItem

| 字段         | 类型    | 说明             |
| ------------ | ------- | ---------------- |
| `id`         | string  | 队列内唯一标识   |
| `title`      | string  | 曲目标题         |
| `artist`     | string  | 作者名           |
| `duration`   | number  | 时长（秒）       |
| `artworkUri` | string  | 封面图 URL       |
| `bvid`       | string  | Bilibili BV 号   |
| `episode`    | number  | 分 P 序号        |
| `isCached`   | boolean | 是否已缓存到本地 |

---

## 5. API 接口列表

### 5.1 歌单管理

#### `GET /playlists`

获取所有歌单列表。

**Query Parameters:**

| 参数            | 类型    | 默认值  | 说明                         |
| --------------- | ------- | ------- | ---------------------------- |
| `excludeSynced` | boolean | `false` | 是否排除有上游同步来源的歌单 |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "title": "我的歌单",
      "color": "#ff6600",
      "amount": 12,
      "imgUrl": "https://...",
      "description": "一些喜欢的歌",
      "source": null
    }
  ]
}
```

---

#### `GET /playlists/:id`

获取单个歌单的元数据。

**Response:** `200 OK`

```json
{
  "data": {
    "id": 1,
    "title": "我的歌单",
    "color": "#ff6600",
    "amount": 12,
    "imgUrl": "https://...",
    "description": "一些喜欢的歌",
    "source": null
  }
}
```

---

#### `POST /playlists`

创建新歌单。

**Request Body:**

```json
{
  "title": "新歌单",
  "description": "歌单描述",
  "color": "#3399ff",
  "imgUrl": "https://..."
}
```

| 字段          | 必填 | 说明                     |
| ------------- | ---- | ------------------------ |
| `title`       | 是   | 歌单标题                 |
| `description` | 否   | 歌单描述                 |
| `color`       | 否   | 颜色值，不提供则随机生成 |
| `imgUrl`      | 否   | 封面图 URL               |

**Response:** `201 Created`

```json
{
  "data": {
    "id": 5,
    "title": "新歌单",
    "color": "#3399ff",
    "amount": 0,
    "imgUrl": "https://...",
    "description": "歌单描述",
    "source": null
  }
}
```

---

#### `POST /playlists/quick`

快速创建歌单并同时添加曲目（对应 `quickCreatePlaylist`）。

**Request Body:**

```json
{
  "title": "从视频创建的歌单",
  "description": "",
  "imgUrl": "https://...",
  "tracks": [
    {
      "author": "UP主名",
      "bvid": "BV1xxxxxxxxxx",
      "duration": 240,
      "episode": 1,
      "title": "曲目标题",
      "imgUrl": "https://..."
    }
  ]
}
```

**Response:** `201 Created`（同 `POST /playlists`，`amount` 反映实际添加的曲目数）

---

#### `PATCH /playlists/:id`

更新歌单元数据（部分更新）。

> 对有 `source` 的同步歌单，仅允许修改 `title`、`color`、`description`。

**Request Body:**

```json
{
  "title": "修改后的标题",
  "color": "#00cc00"
}
```

**Response:** `200 OK`（返回更新后的完整歌单元数据）

---

#### `DELETE /playlists/:id`

删除歌单及其所有曲目。

**Response:** `204 No Content`

---

#### `POST /playlists/:id/clone`

克隆歌单（标题追加"（副本）"后缀，移除上游同步绑定）。

**Response:** `201 Created`（返回新歌单的元数据）

---

### 5.2 歌单曲目管理

#### `GET /playlists/:id/tracks`

获取歌单内所有曲目。

**Query Parameters:**

| 参数     | 类型   | 默认值 | 说明                             |
| -------- | ------ | ------ | -------------------------------- |
| `search` | string | -      | 模糊搜索关键词（匹配标题和作者） |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 101,
      "playlistId": 1,
      "author": "UP主名",
      "bvid": "BV1xxxxxxxxxx",
      "duration": 240,
      "episode": 1,
      "title": "曲目标题",
      "imgUrl": "https://..."
    }
  ]
}
```

---

#### `POST /playlists/:id/tracks`

向歌单添加一首或多首曲目。

> 对有 `source` 的同步歌单返回 `409 CONFLICT`。

**Request Body:**

```json
{
  "tracks": [
    {
      "author": "UP主名",
      "bvid": "BV1xxxxxxxxxx",
      "duration": 240,
      "episode": 1,
      "title": "曲目标题",
      "imgUrl": "https://..."
    }
  ]
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "added": 3,
    "amount": 15
  }
}
```

---

#### `PUT /playlists/:id/tracks`

替换歌单内全部曲目（用于重新排序或批量编辑）。

> 对有 `source` 的同步歌单返回 `409 CONFLICT`。

**Request Body:**

```json
{
  "tracks": [
    {
      "author": "UP主名",
      "bvid": "BV1xxxxxxxxxx",
      "duration": 240,
      "episode": 1,
      "title": "曲目标题",
      "imgUrl": "https://..."
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "amount": 10
  }
}
```

---

#### `DELETE /playlists/:id/tracks/:trackId`

从歌单中删除单首曲目。

> 对有 `source` 的同步歌单返回 `409 CONFLICT`。

**Response:** `204 No Content`

---

#### `DELETE /playlists/:id/tracks`

批量删除曲目。

> 对有 `source` 的同步歌单返回 `409 CONFLICT`。

**Request Body:**

```json
{
  "trackIds": [101, 102, 103]
}
```

**Response:** `204 No Content`

---

### 5.3 歌单同步

#### `POST /playlists/:id/sync`

从上游来源同步歌单内容（仅对有 `source` 的歌单有效）。

> 对没有 `source` 的歌单返回 `409 CONFLICT`。

**Response:** `200 OK`

```json
{
  "data": {
    "amount": 25,
    "source": {
      "type": "playlist",
      "originalTitle": "原始标题",
      "lastSyncAt": 1711276800000
    }
  }
}
```

---

### 5.4 导入导出

#### `GET /export/playlists`

导出全部歌单数据。

**Response:** `200 OK`

```json
{
  "data": {
    "kind": "moe.bilisound.app.exportedPlaylist",
    "version": 1,
    "meta": [ ... ],
    "detail": [ ... ]
  }
}
```

---

#### `GET /export/playlists/:id`

导出单个歌单数据。

**Response:** `200 OK`（格式同上，仅包含指定歌单）

---

#### `POST /import/playlists`

导入歌单数据。

**Request Body:**

```json
{
  "kind": "moe.bilisound.app.exportedPlaylist",
  "version": 1,
  "meta": [ ... ],
  "detail": [ ... ]
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "imported": 3
  }
}
```

---

### 5.5 播放队列

#### `GET /queue`

获取当前播放队列。

**Response:** `200 OK`

```json
{
  "data": {
    "tracks": [
      {
        "id": "BV1xxxxxxxxxx_1",
        "title": "曲目标题",
        "artist": "UP主名",
        "duration": 240,
        "artworkUri": "https://...",
        "bvid": "BV1xxxxxxxxxx",
        "episode": 1,
        "isCached": true
      }
    ],
    "currentIndex": 2,
    "playingMode": "normal"
  }
}
```

---

#### `GET /queue/current`

获取当前正在播放的曲目及播放状态。

**Response:** `200 OK`

```json
{
  "data": {
    "track": {
      "id": "BV1xxxxxxxxxx_1",
      "title": "曲目标题",
      "artist": "UP主名",
      "duration": 240,
      "artworkUri": "https://...",
      "bvid": "BV1xxxxxxxxxx",
      "episode": 1,
      "isCached": true
    },
    "index": 2,
    "position": 67.5,
    "isPlaying": true
  }
}
```

---

#### `POST /queue/play-playlist`

将歌单加载到播放队列并开始播放（对应 `replaceQueueWithPlaylist`）。

**Request Body:**

```json
{
  "playlistId": 1,
  "startIndex": 0
}
```

| 字段         | 必填 | 说明                       |
| ------------ | ---- | -------------------------- |
| `playlistId` | 是   | 歌单 ID                    |
| `startIndex` | 否   | 从第几首开始播放，默认 `0` |

**Response:** `200 OK`

```json
{
  "data": {
    "queueLength": 12,
    "currentIndex": 0
  }
}
```

---

#### `POST /queue/add`

添加曲目到播放队列末尾（通过 BV 号和分 P，对应 `addTrackFromDetail`）。

**Request Body:**

```json
{
  "bvid": "BV1xxxxxxxxxx",
  "episode": 1
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "index": 12,
    "queueLength": 13
  }
}
```

---

#### `POST /queue/jump`

跳转到队列中的指定曲目。

**Request Body:**

```json
{
  "index": 5
}
```

**Response:** `200 OK`

---

#### `POST /queue/next`

跳到下一首。

**Response:** `200 OK`

---

#### `POST /queue/previous`

跳到上一首。

**Response:** `200 OK`

---

#### `POST /queue/play`

开始 / 恢复播放。

**Response:** `200 OK`

---

#### `POST /queue/pause`

暂停播放。

**Response:** `200 OK`

---

#### `PUT /queue/mode`

设置播放模式。

**Request Body:**

```json
{
  "mode": "shuffle"
}
```

| 值          | 说明     |
| ----------- | -------- |
| `"normal"`  | 顺序播放 |
| `"shuffle"` | 随机播放 |

**Response:** `200 OK`

---

### 5.6 配对与认证

#### `POST /pair`

提交配对请求。**此接口不需要 Token。**

**Request Body:**

```json
{
  "code": "482916",
  "clientName": "OpenClaw",
  "clientVersion": "1.2.0"
}
```

| 字段            | 必填 | 说明                                     |
| --------------- | ---- | ---------------------------------------- |
| `code`          | 是   | 用户在 Bilisound 界面上看到的 6 位配对码 |
| `clientName`    | 是   | 客户端应用名称，用于在管理界面中展示     |
| `clientVersion` | 否   | 客户端版本号                             |

**Response:** `201 Created`

```json
{
  "data": {
    "accessToken": "bsk_a1b2c3d4e5f6...",
    "clientId": "clnt_xxxxxxxx",
    "expiresAt": null
  }
}
```

| 字段          | 说明                                          |
| ------------- | --------------------------------------------- |
| `accessToken` | 持久化 Access Token，以 `bsk_` 为前缀         |
| `clientId`    | 客户端唯一标识，以 `clnt_` 为前缀             |
| `expiresAt`   | 过期时间戳，`null` 表示永不过期（需手动吊销） |

**Error:** `401 Unauthorized` — 配对码无效或已过期

```json
{
  "error": {
    "code": "INVALID_PAIR_CODE",
    "message": "Pair code is invalid or expired"
  }
}
```

**Error:** `429 Too Many Requests` — 连续配对失败次数过多（防暴力破解）

---

#### `DELETE /pair`

吊销当前 Token（客户端主动断开配对）。

**Response:** `204 No Content`

---

### 5.7 系统

#### `GET /status`

获取 API 服务状态（可用于服务发现和连接测试）。**此接口不需要 Token。**

**Response:** `200 OK`

```json
{
  "data": {
    "app": "bilisound",
    "apiVersion": 1,
    "deviceName": "tcdw 的 iPhone"
  }
}
```

---

## 6. 安全考虑

1. **仅监听 localhost**: API Server 默认仅监听常见局域网 IP 段（并防止通过 IPv6 无意间泄露到公网）
2. **配对认证**: 外部应用必须通过配对流程获取 Token，确保物理设备持有者知情授权
3. **配对码安全**: 配对码为 6 位数字，有效期 5 分钟，同一时刻只能存在一个有效配对码；连续失败 5 次后锁定 15 分钟，防止暴力破解
4. **Token 管理**: 用户可在设置中查看所有已配对客户端（名称、版本、配对时间、最后活跃时间），并可随时吊销任意客户端的 Token
5. **同步歌单保护**: 有上游同步来源的歌单，其曲目列表只能通过 sync 接口更新，不允许直接增删改

## 7. 待讨论事项

1. **端口选择策略**: 固定端口 vs 动态端口（动态端口需要服务发现机制）
2. **WebSocket 支持**: 是否需要提供实时事件推送（如播放状态变化、歌单变更通知），以便外部应用能实时响应
3. **分页**: 当前歌单和曲目数量通常较小，暂不设计分页；如未来需要可在 v2 引入
4. **批量操作限制**: 单次添加曲目数量是否需要上限
5. **CORS**: 是否需要支持浏览器端 Web 应用访问（如果需要，应配置 CORS 头）
6. **`DELETE /playlists/all`**: 是否暴露"删除全部歌单"操作——该操作破坏性极强，可能不适合通过 API 提供
