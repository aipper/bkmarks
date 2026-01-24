# Bkmarks 书签导航系统

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/aipper/bkmarks)



## 功能概述
- Chrome 扩展读取书签并同步到服务端
- Cloudflare Workers 提供账号登录、多用户、书签存储（R2）、链接有效性检测（Cron/接口）、导航 UI
- URL 规范化与去重；规则生成基础 tags（后续可接入 AI 分类）

## 目录结构
- server：Cloudflare Workers 服务端（Hono + TypeScript）
- extension：Chrome 扩展（Manifest v3）

## 前置准备
- Node.js 18+
- Cloudflare 账号
- Wrangler CLI
  ```bash
  npm i -D wrangler@4
  ```

## Cloudflare 资源与绑定
1. 创建 KV 命名空间（在 Dashboard 或 wrangler）
2. 创建 R2 存储桶：bkmarks-data
3. 在 `wrangler.toml` 填入实际 `kv_namespaces.id` / `preview_id` 与 `r2_buckets.bucket_name`
4. 设置环境变量：
   - AI_DAILY_CALL_LIMIT_GLOBAL
   - AI_DAILY_CALL_LIMIT_PER_USER
   - ADMIN_RESET_TOKEN（用于安全维护接口）

## 本地开发
```bash
cd server
npm install
npm run dev
# 访问 http://localhost:8787/app
```

## 首次初始化与管理员
- 首次注册的账号自动成为管理员，随后注册即关闭
- 管理员创建新用户：`POST /api/admin/create-user`
- 安全维护接口（需 `X-Admin-Reset-Token`）：
  - 重置注册开关：`POST /api/system/reset-registration`
  - 设置密码：`POST /api/system/set-password`

## 扩展加载
1. 打开 Chrome → 扩展程序 → 开发者模式
2. “加载已解压的扩展程序”，选择 `extension` 目录
3. 在扩展选项页填入服务端地址与账号密码
4. 新增/删除书签后，扩展会调用 `/api/bookmarks/sync`

## 扩展打包
用于发布到 Chrome Web Store 或分享 zip 包。

```bash
./scripts/package-extension.sh
```

产物会生成在 `dist/`，文件名包含 `manifest.json` 中的版本号。

## 部署到 Cloudflare Workers
```bash
# 仓库根目录部署
npx wrangler deploy
```
部署后，将你的 Worker 域名（如 `https://YOUR_WORKER.workers.dev`）填入扩展设置。

或使用上方的“一键部署到 Cloudflare”按钮（需要你的仓库是公开或对 Cloudflare 账户可见）：
- 点开后，Cloudflare 会自动拉取该仓库并引导创建 Worker
- 创建后在控制台为该 Worker 绑定 KV 与 R2（与 `wrangler.toml` 中的绑定名一致）
- 设置环境变量（如 `ADMIN_RESET_TOKEN`、AI 配额等）

快速跳转到 Cloudflare Workers 控制台：
- https://dash.cloudflare.com/?to=/:account/workers

## API 摘要
- 认证：
  - `POST /api/auth/register`（未初始化时开放）
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- 书签：
  - `POST /api/bookmarks/sync`（扩展同步 created/changed/removed）
  - `GET /api/bookmarks/list`
- 链接检测：
  - `POST /api/links/check?limit=20`
- 管理：
  - `POST /api/admin/create-user`
  - `POST /api/system/reset-registration`（需要令牌）
  - `POST /api/system/set-password`（需要令牌）

## 注意
- R2/KV 绑定必须在 wrangler.toml 与 Dashboard 配置一致
- Workers AI 接入（分类）建议按照每日调用配额进行自我限流
- 生产环境请将 `ADMIN_RESET_TOKEN` 设置为高强度随机值

## AI Provider（可选）
默认使用 Cloudflare Workers AI（需要 `wrangler.toml` 里的 `[ai] binding = "AI"`）。

也支持切换到第三方大模型 API（不把密钥写进仓库）：

- OpenAI / OpenAI 兼容（NewAPI 等）：
  - `AI_PROVIDER=openai` 或 `AI_PROVIDER=openai_compatible`
  - `OPENAI_API_KEY`：在 Cloudflare Dashboard 里用 secret 配置
  - `OPENAI_BASE_URL`：如 `https://api.openai.com/v1` 或你的兼容网关 `https://xxx/v1`
  - `OPENAI_MODEL`：如 `gpt-4o-mini`
- Gemini：
  - `AI_PROVIDER=gemini`
  - `GEMINI_API_KEY`：在 Cloudflare Dashboard 里用 secret 配置
  - `GEMINI_MODEL`：如 `gemini-1.5-flash`

切换后 `/api/config` 与 `/api/system/status` 会返回当前 provider/model（不会返回密钥）。
