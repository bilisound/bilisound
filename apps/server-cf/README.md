# @bilisound/server-cf

Bilisound Cloudflare Worker — 为 Web 客户端代理 B 站 API 请求。

## 为什么需要这个 Worker

浏览器端无法直接调用 B 站 API（CORS 限制 + Referer 校验），因此 Web 客户端将所有 B 站请求通过此 Worker 中转。

## 架构

```
Web 客户端 (BilisoundSDKRemote)
  │
  │  GET /api/internal/metadata?id=BV...
  ▼
Cloudflare Worker (本服务)
  │
  │  用 BilisoundSDKDirect 调用 B 站 API
  ▼
api.bilibili.com
```

## API 端点

所有端点位于 `/api/internal/` 前缀下，需通过 Referer 白名单校验。

| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| `GET` | `/api/internal/resolve-b23` | `id` | 解析 b23.tv 短链接 |
| `GET` | `/api/internal/metadata` | `id` | 获取视频元数据 (标题/分P/UP主) |
| `GET` | `/api/internal/resource` | `id`, `episode`, `dl?` | 获取音频资源 (支持 Range) |
| `HEAD` | `/api/internal/resource` | `id`, `episode`, `dl?` | 获取资源头信息 |
| `GET` | `/api/internal/user-list` | `userId`, `listId`, `page`, `mode` | 分页获取用户列表 |
| `GET` | `/api/internal/user-list-all` | `userId`, `listId`, `mode` | 一次性获取完整列表 |
| `GET` | `/api/internal/image` | `url`, `referer` | 图片代理 (域名白名单) |
| `GET` | `/api/internal/app/update` | `arch`, `nightly?` | App 版本更新检查 |

## SDK 工厂

`utils/sdk.ts` 从 `env.ENDPOINT_BILI` 中随机选择 B 站 API endpoint 创建 `BilisoundSDKDirect` 实例，配置 KV 缓存 (TTL 3600s)。

## 中间件

- `withRefererCheck`: 全局 Referer 白名单 (`*.bilisound.moe`, `*.bilisound.com`, `*.client-mobile.pages.dev`, `localhost`)

## 开发

```bash
pnpm -C apps/server-cf dev    # wrangler dev
pnpm -C apps/server-cf deploy # wrangler deploy
```

部署前需将 `wrangler.example.toml` 复制为 `wrangler.toml` 并填入 KV namespace。
