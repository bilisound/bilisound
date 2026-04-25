# 添加一个远程列表类别的 Checklist

本文档记录了在 Bilisound 中新增一种远程列表类别（如收藏夹、合集、列表等）所需的全部步骤。

> 以 `favorite`（收藏夹）的添加过程为参考蓝本。

## 架构概览

```
URL/QR Code
  │
  ▼
format.ts (URL 解析，提取 mode/userId/listId)
  │
  ▼
resolveVideoAndJump() → 路由到 /remote-list?mode=xxx
  │
  ▼
remote-list.tsx (调用 SDK 获取列表，展示 UI)
  │
  ▼
SDK getUserList / getUserListFull (按 mode 分发到不同 API 端点)
  │
  ▼
apply-playlist.tsx → quickCreatePlaylist() (写入数据库，source.subType = mode)
```

大部分代码对 `UserListMode` 是**泛型消费**的——只需在少数关键位置编写新 mode 的具体逻辑，其余会自动支持。

## Checklist

### 1. SDK 类型层

- [ ] **扩展 `UserListMode` 联合类型**
  - 文件：`packages/sdk/src/types.ts`
  - 位置：`export type UserListMode = "season" | "series" | ...`
  - 添加新的字符串字面量

- [ ] **添加 Bilibili API 响应类型**（如果响应结构不同于现有类型）
  - 文件：`packages/sdk/src/types-vendor.ts`
  - 参考 `UserSeasonInfo`、`UserSeriesInfo`、`UserFavoriteInfo` 的定义模式
  - 注意根据实际 API 返回的 JSON 结构编写，不要猜

### 2. SDK 实现层

- [ ] **添加私有 API 调用方法**
  - 文件：`packages/sdk/src/sdk/direct.ts`
  - 参考 `getUserSeason()`、`getUserSeries()`、`getUserFavorite()` 的模式
  - 包含：API 端点、请求参数、缓存 key、referer header

- [ ] **在 `getUserList()` 的 switch 中新增 case**
  - 文件：`packages/sdk/src/sdk/direct.ts`
  - 注意：如果新 API 的响应结构没有 `data.archives` 字段，**必须 early return**，因为 switch 之后的共用代码会访问 `response.data.archives`
  - 返回的 `GetEpisodeUserResponse` 需要正确映射字段：
    - `pageSize`、`pageNum`、`total`（分页信息）
    - `rows`（视频列表，每项包含 `bvid`、`title`、`cover`、`duration`）
    - `meta`（元数据：`name`、`description`、`cover`、`userId`、`seasonId`）
  - `meta.seasonId` 虽然名字叫 seasonId，实际上是一个通用的列表 ID 字段

- [ ] **检查 `getUserListFull()` 的分页逻辑是否适用**
  - 文件：`packages/sdk/src/sdk/direct.ts`
  - 当前逻辑：用 `Math.ceil(total / pageSize)` 计算总页数
  - 如果新 API 的分页模型差异较大（比如收藏夹用 `has_more`），考虑添加早退条件

### 3. URL 解析层

- [ ] **添加新的 URL 正则表达式**
  - 文件：`apps/mobile/business/format.ts`
  - 与现有 `USER_LIST_URL_REGEX` 等常量并列声明

- [ ] **在 `resolveVideo()` 中添加 URL 匹配逻辑**
  - 文件：`apps/mobile/business/format.ts`
  - 位于 `if (url.hostname === "space.bilibili.com")` 块内
  - 返回 `UserListParseResult`，包含 `type: "userList"`、`mode`、`userId`、`listId`

- [ ] **更新 JSDoc 注释**
  - 文件：`apps/mobile/business/format.ts`
  - 在 `resolveVideo()` 的文档注释中添加新 URL 格式示例

### 4. UI 层

- [ ] **更新页面标题**
  - 文件：`apps/mobile/app/remote-list.tsx`
  - 当前逻辑：`mode === "favorite" ? "收藏夹详情" : "合集详情"`
  - 如果新 mode 需要不同的标题，扩展此条件表达式

### 5. 构建验证

- [ ] **SDK 类型检查**：`pnpm --filter @bilisound/sdk exec tsc --noEmit`
- [ ] **SDK 构建**：`pnpm --filter @bilisound/sdk build`
- [ ] **移动端类型检查**：在 `apps/mobile` 目录下运行 `npx tsc --noEmit`（忽略已有的无关类型错误）

### 6. 运行时验证

- [ ] 手动输入新类型的 URL，确认跳转到 remote-list 页面
- [ ] 确认页面标题正确显示
- [ ] 确认列表数据正确加载
- [ ] 下滑触发分页加载
- [ ] 点击「创建歌单」按钮，确认歌单成功创建
- [ ] 扫描包含新类型 URL 的二维码
- [ ] 在 Web 端重复以上测试（通过 remote SDK 代理）

## 无需修改的文件

以下文件通过 `UserListMode` 类型传播**自动获得支持**，添加新 mode 时不需要改动：

| 文件 | 原因 |
|------|------|
| `packages/sdk/src/sdk/base.ts` | 抽象方法签名泛型接受 `UserListMode` |
| `packages/sdk/src/sdk/remote.ts` | 仅将 mode 作为字符串参数传递给服务端 |
| `apps/server-cf/route/bilisound.ts` | `mode as UserListMode` 直接转发给 SDK |
| `apps/mobile/api/bilisound.ts` | SDK 的薄封装层 |
| `apps/mobile/typings/playlist.ts` | `PlaylistSource.subType` 使用 `UserListMode` |
| `apps/mobile/business/playlist/update.ts` | 通过 `source.subType` 透传调用 SDK |
| `apps/mobile/business/qrcode.ts` | 调用 `resolveVideoAndJump()`，无 mode 特定逻辑 |
| `apps/mobile/app/barcode.tsx` | 调用 `handleQrCode()`，无 mode 特定逻辑 |
| `apps/mobile/store/apply-playlist.ts` | 接受任意 `PlaylistSource` |
| `apps/mobile/storage/sqlite/schema.ts` | `source` 字段存储 JSON 字符串，无需 schema 变更 |
| `apps/mobile/storage/sqlite/playlist.ts` | `quickCreatePlaylist()` 泛型处理 source |

## 注意事项

- **失效/不可用的条目**：如果新 API 返回的列表项中可能包含无效条目（如收藏夹的失效视频 `attr === 1`），应在 SDK 层过滤掉，避免传到 UI 层造成困惑。
- **分页模型差异**：不同 Bilibili API 的分页字段名不尽相同（`page_num` / `pn` / `page.num`），在 SDK case 中做好映射即可，对外统一为 `pageSize` + `pageNum` + `total`。
- **缓存 key 命名**：遵循 `bilisound_get{TypeName}_{id}_{page}` 的命名规范。
- **early return**：如果新 mode 的 API 响应结构跟 season/series 差异较大（没有 `data.archives` 字段），在 switch case 中必须 early return 完整的 `GetEpisodeUserResponse`，不能 fall through 到共用的 `response.data.archives.map()` 代码。
