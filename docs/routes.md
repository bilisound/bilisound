# 路由结构

Bilisound 使用 Expo Router 文件路由系统 (`apps/mobile/app/`)。

## 路由图

```
app/
├── _layout.tsx                    ← 根布局: Stack 导航 + 主题/初始化/后台事件
│
├── (main)/                        ← Tab 导航组 (歌单 | 搜索 | 设置)
│   ├── _layout.tsx                ← Tabs 布局 + 当前播放迷你栏
│   ├── index.tsx                  → /              首页搜索
│   ├── settings.tsx               → /settings      设置入口
│   └── (playlist)/                ← 歌单子导航组
│       ├── _layout.tsx            ← Stack 导航
│       ├── playlist.tsx           → /playlist      歌单列表
│       ├── detail/[id].tsx        → /detail/:id    歌单详情
│       └── meta/[id].tsx          → /meta/:id      歌单编辑
│
├── video/[id].tsx                 → /video/:id     视频详情 (分P列表)
├── current.tsx                    → /current       当前播放 (Web)
├── description.tsx                → /description   描述编辑 (Sheet)
├── download.tsx                   → /download      下载管理
├── download-web.tsx               → /download-web  Web 下载 (存根)
├── remote-list.tsx                → /remote-list   远程列表 (合集/收藏预览)
├── apply-playlist.tsx             → /apply-playlist  加入歌单
├── history.tsx                    → /history       历史记录
├── barcode.tsx                    → /barcode       二维码扫描
├── test.tsx                       → /test          测试页 (开发)
│
├── settings/                      ← 设置子页面
│   ├── theme.tsx                  → /settings/theme  主题
│   ├── logs.tsx                   → /settings/logs   日志列表
│   ├── log/[id].tsx               → /settings/log/:id  日志详情
│   ├── data.tsx                   → /settings/data   数据管理
│   ├── credit.tsx                 → /settings/credit  致谢
│   ├── license.tsx               → /settings/license  协议
│   └── about.tsx                  → /settings/about   关于
│
└── utils/
    └── cover-picker.tsx           → /utils/cover-picker  封面选择器
```

## 导航结构

### 根布局 (`_layout.tsx`)

- Stack 导航器
- 注入主题、全局 Provider
- 注册后台播放事件监听
- 应用初始化逻辑

### (main) Tab 组 (`(main)/_layout.tsx`)

- Native Tabs 导航 (expo-router/ui 的 `<Tabs>`)
- 三个 Tab: 歌单、搜索、设置
- 底部固定当前播放迷你栏 (进度条 + 歌曲信息)

### (playlist) 子导航 (`(main)/(playlist)/_layout.tsx`)

- Stack 导航器
- 歌单列表 → 歌单详情 → 歌单编辑

## 关键路由说明

| 路由 | 用途 | 备注 |
|------|------|------|
| `/` | 首页搜索 | 输入 BV 号/链接搜索视频 |
| `/playlist` | 歌单列表 | 本地创建的歌单 |
| `/detail/:id` | 歌单详情 | 查看/播放歌单内容 |
| `/meta/:id` | 歌单编辑 | 编辑歌单元数据 |
| `/video/:id` | 视频详情 | 显示分 P 列表，可添加到歌单 |
| `/current` | 全屏播放页 | Web 端专用 |
| `/remote-list` | 远程列表预览 | 合集/系列/收藏夹预览，可创建本地歌单 |
| `/download` | 下载管理 | 查看/管理已下载缓存 |
| `/barcode` | 扫码 | 扫描二维码快速打开内容 |
| `/apply-playlist` | 加入歌单 | 选择目标歌单 |
| `/description` | 描述编辑 | 以 Sheet 形式弹出 |
| `/settings/*` | 设置 | 主题、日志、数据、关于等 |

## 路由组说明

- `(main)` — 目录带括号表示路由组，不影响 URL 路径，仅用于组织布局
- `(playlist)` — 嵌套在 main 下的子路由组
- `[id]` — 动态路由参数，如 `/detail/42` 映射到 `detail/[id].tsx`
