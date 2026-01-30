# 书签导航系统需求文档

## 1. 概述

本项目旨在构建一个个人书签管理与导航系统，包含两个核心模块：
1. **Chrome 浏览器扩展**：负责读取书签、监听变更并同步到服务端。
2. **服务端（Cloudflare Workers）**：提供多用户账号体系、API 接口、AI 智能分类、链接有效性检测以及导航前端页面。

**核心约束**：
- 基于 Cloudflare 免费计划（Workers + KV + R2）实现。
- 支持多用户，但以个人/小规模使用为主。
- 导航 UI 追求简约美观（参考 Apple Human Interface Guidelines）。

---

## 2. 模块一：服务端 (Cloudflare Workers)

### 2.1 技术架构
- **运行环境**：Cloudflare Workers (TypeScript)
- **数据库/缓存**：Workers KV
  - 存储用户信息、会话 Session、系统配置、AI 每日调用计数。
- **对象存储**：R2
  - 存储用户的书签数据（原始结构 + AI 分类结果 + 链接状态）。
- **AI 能力**：可配置外部 AI Provider（默认关闭）
  - 支持 OpenAI / Gemini / OpenAI 兼容接口。
  - 默认 Provider 为 `none`（fail-closed），必须由管理员显式启用。

### 2.2 账号体系
- **登录方式**：账号 + 密码。
- **流程**：
  - 用户通过 `/login` 接口提交用户名和密码。
  - 服务端验证 KV 中的密码哈希。
  - 验证成功后生成 Session ID，存入 KV 并设置 HttpOnly Cookie。
- **多用户隔离**：每个用户的数据在 KV 和 R2 中通过 `userId` 进行物理隔离。

### 2.3 API 接口
- **认证类**：
  - `POST /api/auth/login`：登录
  - `POST /api/auth/logout`：登出
- **书签类**：
  - `POST /api/bookmarks/sync`：接收 Chrome 扩展上传的增量/全量书签数据。
  - `GET /api/bookmarks/list`：获取导航页所需的书签列表（含分类、状态）。
  - `GET /api/tags`：获取 Tag 列表及常用 Tag 统计。
- **系统类**：
  - `GET /api/config`：获取当前配置（如是否开启 AI 等）。

### 2.4 AI 分类与配额管理

#### 2.4.1 AI Provider 配置

**配置方式**：
- **方式一（推荐）**：通过管理员 UI 动态配置（无需重新部署）
  - 访问 `/app` → "AI 设置"（仅管理员可见）
  - 选择 Provider：none / openai / openai_compatible / gemini
  - 配置参数：模型名称、API Base URL、API Key
  - 支持实时测试 AI 连通性
- **方式二（兼容）**：通过 `wrangler.toml` 环境变量配置
  - 适用于部署时固定配置
  - 修改后需重新部署：`npx wrangler deploy`

**配置优先级**：KV 动态配置 > wrangler.toml 环境变量

**安全机制**：
- API 密钥加密存储在 KV（`system:ai_secret`）
- API 接口不返回密钥
- 仅管理员可修改配置
- 配置变更审计（建议）

**管理员 API**：
- `GET /api/admin/ai-config`：获取当前 AI 配置（不含密钥）
  ```json
  {
    "ok": true,
    "config": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "baseUrl": "https://api.openai.com/v1",
      "hasSecret": true
    }
  }
  ```
- `POST /api/admin/ai-config`：更新 AI 配置
  ```json
  {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-xxx"
  }
  ```
  响应：
  ```json
  { "ok": true }
  ```
  错误：
  - 403：非管理员
  - 400：配置无效
  - 503：AI 测试失败（可选）

**支持 Provider**：
- `none`：未启用（关闭 AI）
- `openai`：OpenAI 官方 API
- `openai_compatible`：OpenAI 兼容接口（如 NewAPI）
- `gemini`：Google Gemini

**默认配置**（未配置时使用）：
- `none`：默认关闭
- `openai`：gpt-4o-mini
- `gemini`：gemini-1.5-flash

**兼容性/迁移**：
- 已移除 Cloudflare Workers AI 支持。
- 若历史 KV 配置中存在 `provider="workers"`，服务端会强制迁移为 `provider="none"` 并提示管理员重新选择。

#### 2.4.2 分类策略
- **基础规则**：基于域名（如 github.com -> 代码）和 Chrome 文件夹名称自动生成 Tag。
- **AI 增强**：对未分类或新书签，调用 AI 进行文本分类。

#### 2.4.3 配额控制
- 服务端环境变量配置每日最大调用次数（全局 + 单用户）。
- 使用 KV (`ai_usage:yyyy-mm-dd`) 实时计数。
- 超出配额时自动降级为仅使用规则分类。

### 2.5 链接有效性检测
- **机制**：利用 Workers Cron Triggers 定时触发。
- **流程**：
  - 批量读取用户书签 URL。
  - 发送 HEAD 请求（失败回退 GET）检测 HTTP 状态。
  - 更新 R2 中的 `bookmarks_status.json`。
- **状态展示**：在导航页标记失效链接（如 404/5xx/Timeout）。

---

## 3. 模块二：Chrome 浏览器扩展

### 3.1 核心功能
- **书签读取**：使用 `chrome.bookmarks` API 读取完整书签树。
- **实时同步**：
  - 监听 `onCreated`, `onRemoved`, `onChanged`, `onMoved` 事件。
  - 发生变更时，向服务端发送增量更新请求。
- **配置页**：
  - 设置服务端地址（API Endpoint）。
  - 输入账号密码（用于获取同步凭证）。
  - 选择同步范围（可选，默认全部）。

### 3.2 其它同步方式（可选备份）
- 支持将书签导出为 JSON 并上传到标准 WebDAV 服务器（作为备选方案）。

---

## 4. 导航界面 (Web UI)

### 4.1 设计风格
- **参考规范**：Apple Human Interface Guidelines (Web 版)。
- **视觉特征**：
  - 简约浅色背景，清晰的层级关系。
  - 统一的圆角卡片，轻微阴影，细腻的交互动效。

### 4.2 核心交互
- **首页布局**：
  - **顶栏**：全局搜索框 + 用户菜单。
  - **常用 Tag 区**：横向滚动/排列的 Pill 按钮（基于使用频次自动筛选 Top N）。
  - **内容区**：书签网格卡片列表。
- **多视图切换**：
  - 支持按 Tag 筛选。
  - 支持特殊视图：“全部”、“最近添加”、“失效链接”。
- **书签卡片**：
  - 显示：Favicon、标题、域名、Tag 标签。
  - 状态：若链接失效，以视觉样式（置灰或红点）显著标识。

### 4.3 去重策略
- **服务端去重**：
  - 基于 URL 进行归一化去重。
  - 同一 URL 在不同文件夹的收藏，合并为一个导航卡片，但在详情中保留所有来源 Tag。

---

## 5. 其它要求

- **数据隐私**：所有数据存储在用户私有 R2 桶路径下，不做公开分享。
- **成本控制**：严格控制 AI 调用和 R2 读写，确保在 Cloudflare 免费额度内运行。
