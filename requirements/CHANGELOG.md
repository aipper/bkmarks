# 需求变更历史

本文件记录所有需求变更,按时间倒序排列。

---

## 2026-01-30

### 变更类型
Change（破坏性变更）

### 变更内容
移除 Cloudflare Workers AI 支持，并将默认 AI Provider 设为 `none`（默认关闭，fail-closed）。

### 原因/背景
用户要求：默认不再使用 Cloudflare 的 AI，同时彻底移除 Workers AI 依赖与相关配置。

### 影响范围
- 配置：`wrangler.toml` 移除 `[ai] binding = "AI"`，默认 `AI_PROVIDER = "none"`
- 服务端：移除 `workers` provider 逻辑与 `env.AI` 依赖
- UI：移除 Workers AI 选项，新增迁移提示
- 数据：若 KV 中存在历史 `provider="workers"` 配置，强制迁移为 `none` 并提示管理员重新选择 Provider

### 回滚思路
- 回滚到本次变更前的提交（恢复 Workers AI 相关代码与 `wrangler.toml` 的 `[ai]` 绑定）。

### 关联 issues/PR
待创建

### 记录人
Sisyphus (AI Assistant)

---

## 2026-01-30

### 变更类型
Change（新增功能）

### 变更内容
新增管理员动态 AI 配置能力，支持在 UI 中配置 OpenAI、Gemini 等 AI Provider，无需重新部署。

### 详细变更
1. 新增管理员 API：
   - `GET /api/admin/ai-config`：获取当前 AI 配置（不含密钥）
   - `POST /api/admin/ai-config`：更新 AI 配置

2. 新增 AI 配置管理 UI：
   - 管理员专用"AI 设置"页面
   - 支持 Provider 选择：workers / openai / openai_compatible / gemini
   - 支持配置模型名称、API Base URL、API Key
   - 支持实时测试 AI 连通性

3. 配置存储机制：
   - AI 配置存储在 KV：`system:ai_config`
   - API 密钥加密存储：`system:ai_secret`
   - 优先级：KV 动态配置 > wrangler.toml 环境变量

4. 向后兼容：
   - 保持 wrangler.toml 配置作为默认值
   - 未配置动态配置时，自动使用环境变量

### 原因/背景
用户需求：当前 AI 配置只能通过 wrangler.toml 环境变量配置，修改后需要重新部署。需要支持在 UI 中动态配置，方便管理员快速切换 AI Provider 和模型。

### 影响范围
- API：新增 2 个管理员接口
- UI：新增 1 个配置页面
- 配置逻辑：ai.ts 需要读取 KV 配置
- 权限：仅管理员可访问
- 数据库：新增 2 个 KV 键（`system:ai_config`, `system:ai_secret`）

### 关联 issues/PR
待创建

### 记录人
Sisyphus (AI Assistant)

---
