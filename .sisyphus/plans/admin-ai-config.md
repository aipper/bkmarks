# Admin AI Configuration & UI Enhancement

## TL;DR

> **Quick Summary**: 实现管理员动态 AI 配置功能（无需重新部署）+ 玻璃拟态 UI 美化，支持 OpenAI/Gemini/Workers AI 多 Provider，密钥加密存储，连通性实时测试。
>
> **Deliverables**:
> - GET/POST /api/admin/ai-config API
> - POST /api/admin/ai-config/test 连通性测试
> - KV 加密存储（system:ai_config + system:ai_secret）
> - 配置优先级逻辑（KV > 环境变量）
> - 管理员 AI 配置 UI 页面（玻璃拟态风格）
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 4 → Task 8

---

## Context

### Original Request
实现管理员动态 AI 配置功能（无需重新部署），同时进行界面美化。

### Interview Summary
**Key Discussions**:
- 测试策略：手动验证（curl + 浏览器），无 TDD
- UI 字段：Provider 选择器，OpenAI API Key/Model/Base URL，Gemini API Key/Model，连通性测试按钮
- 错误处理：内联提示
- 配置优先级：KV 配置 > 环境变量

**Research Findings**:
- **Server patterns**: Hono with typed Bindings, KV usage patterns (users:/sessions:/system:/ai_usage:/tags:)
- **Auth pattern**: getAuthUserFromRequest + requireAdmin (index.ts:161-186)
- **UI generation**: ui.ts exports html()/css()/js() strings; ui_js.ts patches base JS
- **Current AI config**: Purely env-driven, synchronous functions in ai.ts
- **Security requirements**: Keys MUST be encrypted, stored separately in system:ai_secret
- **Glassmorphism**: CSS with backdrop-filter, @supports fallback, 4.5:1 contrast
- **OpenAI testing**: Minimal chat request with max_tokens=1, 8s timeout, x-request-id logging

### Metis Review
**Identified Gaps** (addressed):
- **密钥安全**: 必须加密存储，使用 AES-GCM 信封加密，master key 在 Worker Secret
- **Async 改造**: 引入缓存/预加载策略，避免全链路 async
- **错误处理**: 统一错误结构（code/message/requestId）
- **边界情况**: KV 配置无效时不回退，明确错误提示

---

## Work Objectives

### Core Objective
实现管理员可通过 Web UI 动态配置 AI Provider（无需重新部署），密钥安全存储，支持实时连通性测试，UI 采用现代玻璃拟态设计。

### Concrete Deliverables
- `GET /api/admin/ai-config` - 获取当前配置（不含密钥）
- `POST /api/admin/ai-config` - 保存配置（密钥加密存储）
- `POST /api/admin/ai-config/test` - 测试连通性（不计入配额）
- KV 存储：`system:ai_config`（非敏感）+ `system:ai_secret`（加密）
- AI 配置优先级：KV > 环境变量
- 管理员 AI 配置页面（玻璃拟态风格）
- 配置缓存机制（避免每请求读 KV）

### Definition of Done
- [ ] 管理员可通过 UI 修改 AI 配置并立即生效
- [ ] 密钥加密存储，GET API 不返回密钥
- [ ] 连通性测试成功/失败有明确提示
- [ ] UI 采用玻璃拟态设计，响应式布局
- [ ] 向后兼容：环境变量作为默认值
- [ ] 非管理员无法访问配置 API

### Must Have
- GET/POST /api/admin/ai-config API
- POST /api/admin/ai-config/test API
- KV 加密存储（AES-GCM）
- 配置优先级逻辑（KV > 环境变量）
- 管理员权限校验
- 连通性测试功能
- 玻璃拟态 UI

### Must NOT Have (Guardrails)
- 不暴露密钥到前端或日志
- 不引入新的测试框架（保持手动验证）
- 不支持 per-user 配置（仅系统级）
- 不支持审计日志（本期仅预留接口）
- 不支持配置版本控制/回滚
- 不引入 React/Vite 等前端框架

---

## Verification Strategy (MANDATORY)

> **Manual Verification Only** - 项目无测试基础设施，每个任务包含详细的手动验证步骤。

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual verification
- **Framework**: None
- **QA approach**: Curl for API, browser for UI

### Automated Verification (ALWAYS include, choose by deliverable type)

**For API changes** (using Bash curl):
```bash
# Agent runs:
curl -s -X GET http://localhost:8787/api/admin/ai-config \
  -H "Cookie: sid=<admin-session>" \
  | jq '.ok, .config.provider, .config.hasSecret'
# Assert: Returns ok=true, provider field present, hasSecret boolean
```

**For UI changes** (using Playwright via dev-browser skill):
```bash
# Agent executes via Playwright browser automation:
1. Navigate to: http://localhost:8787/app/settings-ai
2. Wait for: selector ".glass" to be visible
3. Assert: text "AI 配置" appears in page
4. Assert: selector "#provider-select" exists
5. Screenshot: .sisyphus/evidence/task-8-ai-config-ui.png
```

**For Config/Infra changes** (using Bash):
```bash
# Agent runs:
wrangler kv:key list --namespace-id=<KV-ID> --prefix="system:ai_config"
# Assert: Returns at least one key
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: 创建加密工具模块 (crypto.ts)
├── Task 2: 创建配置缓存模块 (config-cache.ts)
└── Task 3: 修改 AI 模块支持 KV 配置优先级 (ai.ts refactor)

Wave 2 (After Wave 1):
├── Task 4: 实现 GET/POST /api/admin/ai-config API
├── Task 5: 实现 POST /api/admin/ai-config/test API
└── Task 6: 添加配置缓存初始化到 Worker 启动流程

Wave 3 (After Wave 2):
├── Task 7: 扩展 UI 添加 AI 配置页面 (ui.ts)
├── Task 8: 扩展 UI JS 添加配置交互逻辑 (ui_js.ts)
└── Task 9: 添加玻璃拟态 CSS 样式 (ui.ts)

Critical Path: Task 1 → Task 3 → Task 4 → Task 8
Parallel Speedup: ~50% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | None (foundation) |
| 2 | None | 3, 6 | 1 |
| 3 | 1, 2 | 4, 5 | None |
| 4 | 1, 2, 3 | 7 | 5, 6 |
| 5 | 1, 2, 3 | 7 | 4, 6 |
| 6 | 2 | None | 4, 5 |
| 7 | 4, 5 | 8 | 6, 9 |
| 8 | 4, 5, 7 | None | 6, 9 |
| 9 | None | 7 | 6, 8 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | delegate_task(category="unspecified-high", load_skills=[], run_in_background=true) |
| 2 | 4, 5, 6 | dispatch parallel after Wave 1 completes |
| 3 | 7, 8, 9 | dispatch parallel after Wave 2 completes |

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info.

- [ ] 1. 创建加密工具模块 (crypto.ts)

  **What to do**:
  - 创建 `server/src/crypto.ts` 文件
  - 实现 AES-GCM 信封加密函数 `encryptSecret(masterKey, plaintext, kid)`
  - 实现 AES-GCM 解密函数 `decryptSecret(masterKey, encryptedBlob)`
  - 实现辅助函数 `b64(bytes)` 和 `unb64(string)`
  - 实现密钥派生函数 `hkdfKey(masterKey, salt)`
  - 定义类型 `EncryptedBlobV1` (包含 v, kid, saltB64, ivB64, ctB64)

  **Must NOT do**:
  - 不暴露 master key 到日志或错误信息
  - 不使用弱加密算法（必须 AES-GCM-256）

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-high`
    - Reason: 核心安全基础设施，需要高质量实现
  - **Skills**: `[]` (no specific skills needed)
    - Reason: 纯 TypeScript 实现，无需外部库或特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 3 (ai.ts refactor depends on encryption)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `server/src/auth.ts:hashPassword()` - 密码哈希模式（使用 WebCrypto API）
  - `server/src/auth.ts:verifyPassword()` - 验证模式（错误处理）

  **External References** (libraries and frameworks):
  - Web Crypto API: `https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API` - 加密操作标准接口
  - AES-GCM: `https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt` - 加密算法规范

  **WHY Each Reference Matters** (explain the relevance):
  - `auth.ts` 展示了如何在 Workers 中使用 WebCrypto API，crypto.ts 应遵循相同的模式
  - MDN 文档提供了 AES-GCM 的正确用法示例，确保加密实现符合标准

  **Acceptance Criteria**:

  > **CRITICAL: AGENT-EXECUTABLE VERIFICATION ONLY**

  **Automated Verification**:
  ```bash
  # Agent runs:
  cd server && node -e "
  const { encryptSecret, decryptSecret } = require('./src/crypto.ts');
  (async () => {
    const master = 'test-master-key';
    const plain = 'openai-api-key-123';
    const encrypted = await encryptSecret(master, plain, 'test-kid');
    console.log('Encrypted:', JSON.stringify(encrypted));
    const decrypted = await decryptSecret(master, encrypted);
    console.log('Decrypted:', decrypted);
    console.log('Match:', plain === decrypted);
  })();
  "
  # Assert: Output shows "Match: true"
  # Assert: Encrypted object contains v:1, kid, saltB64, ivB64, ctB64
  ```

  **Evidence to Capture**:
  - [ ] Terminal output from encryption/decryption test
  - [ ] Type definition in crypto.ts (EncryptedBlobV1)

  **Commit**: YES
  - Message: `feat(security): add AES-GCM encryption utility for AI config secrets`
  - Files: `server/src/crypto.ts`
  - Pre-commit: None

---

- [ ] 2. 创建配置缓存模块 (config-cache.ts)

  **What to do**:
  - 创建 `server/src/config-cache.ts` 文件
  - 定义类型 `AiConfig` (provider, model, baseUrl, hasSecret, updatedAt, updatedBy)
  - 实现函数 `loadAiConfigFromKV(env)` - 从 KV 读取配置
  - 实现函数 `saveAiConfigToKV(env, config)` - 保存配置到 KV
  - 实现函数 `getEffectiveAiConfig(env, cachedConfig)` - 获取有效配置（KV > env）
  - 实现缓存机制：内存缓存 + 30s TTL
  - 实现缓存失效函数 `invalidateAiConfigCache()`

  **Must NOT do**:
  - 不在缓存中存储密钥（仅存储 hasSecret 标志）
  - 不返回敏感信息到调用方

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-high`
    - Reason: 配置管理核心模块，影响整个系统
  - **Skills**: `[]` (no specific skills needed)
    - Reason: 纯 TypeScript 实现，依赖 Hono 和 KV

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 3, 6 (ai.ts and Worker startup depend on cache)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `server/src/index.ts:192-202` - KV 读取模式 (getUsageCount)
  - `server/src/index.ts:204-217` - KV 写入模式 (canUseAI)
  - `server/src/ai.ts:31-46` - 配置结构模式 (getAiPublicConfig)

  **Documentation References** (specs and requirements):
  - `requirements.md:50-67` - KV 配置优先级和键命名规范
  - `requirements/CHANGELOG.md` - 配置变更记录格式

  **WHY Each Reference Matters**:
  - index.ts 展示了 KV 的正确使用方式，包括错误处理和默认值
  - requirements.md 定义了 `system:ai_config` 的确切结构和优先级规则

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Agent runs:
  cd server && node -e "
  const { loadAiConfigFromKV, getEffectiveAiConfig } = require('./src/config-cache.ts');
  console.log('Module loaded successfully');
  console.log('Functions:', Object.keys(loadAiConfigFromKV));
  "
  # Assert: No errors, functions exported
  ```

  **Evidence to Capture**:
  - [ ] Terminal output showing module load
  - [ ] Type definition in config-cache.ts

  **Commit**: YES
  - Message: `feat(config): add AI config cache module with KV support`
  - Files: `server/src/config-cache.ts`
  - Pre-commit: None

---

- [ ] 3. 修改 AI 模块支持 KV 配置优先级 (ai.ts refactor)

  **What to do**:
  - 修改 `server/src/ai.ts` 导入 `getEffectiveAiConfig` 和 `decryptSecret`
  - 修改 `getAiProvider(env)` 函数支持从缓存读取配置
  - 修改 `isAiAvailable(env)` 函数检查缓存配置
  - 修改 `getAiPublicConfig(env)` 函数返回缓存配置
  - 修改 `runAiChat(env, messages, maxTokens)` 函数使用缓存配置
  - 在需要密钥的地方调用 `decryptSecret` 解密
  - 保持向后兼容：如果 KV 配置不存在，使用环境变量

  **Must NOT do**:
  - 不在日志中输出密钥或解密后的明文
  - 不破坏现有的环境变量配置路径

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-high`
    - Reason: 核心业务逻辑修改，影响所有 AI 功能
  - **Skills**: `[]` (no specific skills needed)
    - Reason: 纯 TypeScript 重构，依赖 Task 1, 2

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Wave 1)
  - **Blocks**: Tasks 4, 5 (API endpoints depend on refactored ai.ts)
  - **Blocked By**: Tasks 1, 2 (crypto and cache modules)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `server/src/ai.ts:8-21` - getAiProvider 现有实现
  - `server/src/ai.ts:23-29` - isAiAvailable 现有实现
  - `server/src/ai.ts:31-46` - getAiPublicConfig 现有实现
  - `server/src/ai.ts:70-146` - runAiChat 现有实现

  **WHY Each Reference Matters**:
  - 这些函数是 AI 模块的核心，必须保持接口兼容性
  - 现有实现展示了如何从 env 读取配置，需要扩展为支持 KV

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Agent runs:
  cd server && npm run dev &
  sleep 5
  curl -s http://localhost:8787/api/config | jq '.ai_enabled, .ai_provider, .ai_model'
  # Assert: Returns valid JSON with ai fields
  # Assert: No errors in terminal
  ```

  **Evidence to Capture**:
  - [ ] Terminal output from /api/config
  - [ ] No TypeScript errors during build

  **Commit**: YES
  - Message: `refactor(ai): add KV config priority support (fallback to env vars)`
  - Files: `server/src/ai.ts`
  - Pre-commit: `npm run build` (if build script exists)

---

- [ ] 4. 实现 GET/POST /api/admin/ai-config API

  **What to do**:
  - 在 `server/src/index.ts` 添加路由 `GET /api/admin/ai-config`
  - 实现读取当前配置逻辑（不返回密钥，只返回 hasSecret）
  - 添加管理员权限校验 (requireAdmin)
  - 在 `server/src/index.ts` 添加路由 `POST /api/admin/ai-config`
  - 实现保存配置逻辑：
    - 验证 provider 枚举值 (workers/openai/openai_compatible/gemini)
    - 验证 model 和 baseUrl 格式
    - 如果提供了 apiKey，加密后存储到 `system:ai_secret`
    - 如果 apiKey 为空字符串，清除 `system:ai_secret`
    - 如果 apiKey 未提供，保持现有密钥不变
    - 存储非敏感配置到 `system:ai_config`
    - 记录 updatedAt 和 updatedBy
  - 失效配置缓存
  - 返回成功响应 `{ok: true}`

  **Must NOT do**:
  - 不在 GET 响应中返回密钥或加密 blob
  - 不允许非管理员访问

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-high`
    - Reason: 核心 API 实现，安全关键
  - **Skills**: `[]` (no specific skills needed)
    - Reason: 纯 TypeScript，依赖 Hono 和之前的模块

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Tasks 7, 8 (UI depends on API)
  - **Blocked By**: Tasks 1, 2, 3 (crypto, cache, ai.ts refactor)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `server/src/index.ts:459-473` - POST /api/admin/create-user (admin 路由模式)
  - `server/src/index.ts:161-186` - getAuthUserFromRequest + requireAdmin
  - `server/src/index.ts:46-58` - GET /api/config (公共配置 API)

  **Documentation References** (specs and requirements):
  - `requirements.md:50-67` - API 规范和请求/响应格式
  - `requirements/requirements-issues.csv:REQ-011` - API 需求

  **WHY Each Reference Matters**:
  - /api/admin/create-user 展示了正确的管理员路由实现模式
  - requirements.md 定义了 API 的确切规范和字段

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Agent runs:
  # First login as admin
  SID=$(curl -s -X POST http://localhost:8787/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"test123"}' \
    -c - | grep sid | awk '{print $7}')

  # GET request (should succeed for admin)
  curl -s http://localhost:8787/api/admin/ai-config \
    -H "Cookie: sid=$SID" | jq '.ok, .config.provider, .config.hasSecret'
  # Assert: Returns ok=true, config object present

  # POST request (should save config)
  curl -s -X POST http://localhost:8787/api/admin/ai-config \
    -H "Cookie: sid=$SID" \
    -H "Content-Type: application/json" \
    -d '{"provider":"openai","model":"gpt-4o-mini","baseUrl":"https://api.openai.com/v1","apiKey":"sk-test"}' \
    | jq '.ok'
  # Assert: Returns ok=true

  # Verify config saved (GET again)
  curl -s http://localhost:8787/api/admin/ai-config \
    -H "Cookie: sid=$SID" | jq '.ok, .config.hasSecret'
  # Assert: Returns ok=true, hasSecret=true
  ```

  **Evidence to Capture**:
  - [ ] Terminal output from GET/POST requests
  - [ ] HTTP status codes (should be 200)

  **Commit**: YES
  - Message: `feat(api): add GET/POST /api/admin/ai-config endpoints with encryption`
  - Files: `server/src/index.ts`
  - Pre-commit: None

---

- [ ] 5. 实现 POST /api/admin/ai-config/test API

  **What to do**:
  - 在 `server/src/index.ts` 添加路由 `POST /api/admin/ai-config/test`
  - 实现连通性测试逻辑：
    - 从请求体读取 provider, apiKey, model, baseUrl
    - 根据 provider 执行最小测试请求：
      - openai/openai_compatible: POST /chat/completions, max_tokens=1
      - gemini: POST /generateContent, maxOutputTokens=1
      - workers: 调用 env.AI.run()（如果可用）
    - 设置 8s 超时
    - 捕获 x-request-id header（如果存在）
  - 实现错误处理：
    - 认证失败 (401): return `ai_auth_failed`
    - 速率限制 (429): return `ai_rate_limited`
    - 上游 5xx: return `ai_upstream_5xx`
    - 连接错误: return `ai_connection_error`
    - 超时: return `ai_timeout`
  - 返回测试结果：`{ok: true/false, latencyMs, code?, message?, requestId?}`
  - 测试请求不计入 AI 配额（不调用 markAIUsage）

  **Must NOT do**:
  - 不在日志中输出完整请求 URL（可能包含密钥）
  - 不测试请求不计入配额
  - 不暴露密钥到响应

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-high`
    - Reason: 测试 API 实现，需要健壮的错误处理
  - **Skills**: `[]` (no specific skills needed)
    - Reason: 纯 TypeScript，依赖之前的模块

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Tasks 7, 8 (UI test button depends on API)
  - **Blocked By**: Tasks 1, 2, 3 (crypto, cache, ai.ts refactor)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `server/src/ai.ts:82-109` - OpenAI 请求模式
  - `server/src/ai.ts:111-143` - Gemini 请求模式
  - `server/src/ai.ts:102-106` - 错误处理模式

  **External References** (libraries and frameworks):
  - OpenAI API Testing Best Practices: `https://github.com/openai/openai-node#testing-connections`
  - HTTP Timeout Pattern: `https://developer.mozilla.org/en-US/docs/Web/API/AbortController`

  **WHY Each Reference Matters**:
  - ai.ts 展示了如何构建不同 Provider 的请求，test API 应复用这些模式
  - OpenAI 文档推荐最小测试请求以节省配额

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Agent runs:
  # Test with invalid key (should fail gracefully)
  curl -s -X POST http://localhost:8787/api/admin/ai-config/test \
    -H "Cookie: sid=$SID" \
    -H "Content-Type: application/json" \
    -d '{"provider":"openai","model":"gpt-4o-mini","baseUrl":"https://api.openai.com/v1","apiKey":"sk-invalid"}' \
    | jq '.ok, .code, .message'
  # Assert: Returns ok=false with error code (e.g., ai_auth_failed)
  ```

  **Evidence to Capture**:
  - [ ] Terminal output from test request
  - [ ] Error response structure

  **Commit**: YES
  - Message: `feat(api): add POST /api/admin/ai-config/test endpoint for connectivity testing`
  - Files: `server/src/index.ts`
  - Pre-commit: None

---

- [ ] 6. 添加配置缓存初始化到 Worker 启动流程

  **What to do**:
  - 在 `server/src/index.ts` 的 Worker 启动流程中添加配置预加载
  - 创建全局变量 `let aiConfigCache: AiConfig | null = null`
  - 在 app.get('/') 或启动时调用 `loadAiConfigFromKV(env)` 初始化缓存
  - 在 `/api/config` 和 `/api/system/status` 端点中使用缓存
  - 在配置更新时调用 `invalidateAiConfigCache()` 失效缓存

  **Must NOT do**:
  - 不在缓存中存储敏感信息
  - 不阻塞 Worker 启动（如果 KV 读取失败，使用默认值）

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-high`
    - Reason: 启动流程修改，影响所有请求
  - **Skills**: `[]` (no specific skills needed)
    - Reason: 纯 TypeScript，依赖 Task 2

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: None (independent optimization)
  - **Blocked By**: Task 2 (config-cache module)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `server/src/index.ts:25-41` - Worker 初始化模式
  - `server/src/index.ts:46-58` - /api/config 端点

  **WHY Each Reference Matters**:
  - 展示了如何在 Worker 启动时初始化状态
  - /api/config 是主要使用配置的端点，需要使用缓存

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Agent runs:
  curl -s http://localhost:8787/api/config | jq '.ai_enabled, .ai_provider'
  # Assert: Returns valid AI config from cache
  # Assert: Response time < 100ms (cache hit)
  ```

  **Evidence to Capture**:
  - [ ] Terminal output from /api/config
  - [ ] Response time (should be fast)

  **Commit**: YES
  - Message: `feat(cache): initialize AI config cache on Worker startup`
  - Files: `server/src/index.ts`
  - Pre-commit: None

---

- [ ] 7. 扩展 UI 添加 AI 配置页面 (ui.ts)

  **What to do**:
  - 在 `server/src/ui.ts` 添加新的页面视图 `#aiConfigView`
  - 添加导航链接到 AI 配置页面（仅管理员可见）
  - 在 HTML 中添加表单元素：
    - Provider 选择器 (select 元素，选项: workers/openai/openai_compatible/gemini)
    - OpenAI API Key 输入框 (password 类型)
    - OpenAI Model 输入框 (text 类型)
    - OpenAI Base URL 输入框 (text 类型，默认值 https://api.openai.com/v1)
    - Gemini API Key 输入框 (password 类型)
    - Gemini Model 输入框 (text 类型)
    - 连通性测试按钮
    - 保存按钮
    - 清除密钥按钮
    - 内联错误提示区域（每个字段下方）
    - 全局提示区域（保存成功/失败）
  - 根据选择的 Provider 动态显示/隐藏相关字段
  - 应用玻璃拟态样式（.glass class）

  **Must NOT do**:
  - 不在 HTML 中硬编码密钥值
  - 不暴露敏感信息到前端代码

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `frontend-ui-ux`
    - Reason: UI/UX 设计和实现，需要玻璃拟态专业知识
  - **Skills**: `['frontend-ui-ux']`
    - Reason: 该技能专门用于创建美观的 UI，包括玻璃拟态设计

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: Task 8 (UI JS depends on HTML structure)
  - **Blocked By**: Tasks 4, 5 (API endpoints must exist)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `server/src/ui.ts:71-88` - Settings 页面结构
  - `server/src/ui.ts:220-234` - 玻璃拟态样式
  - `server/src/ui.ts:338-346` - 模态框样式
  - `server/src/ui.ts:798-808` - 页面切换逻辑

  **Documentation References** (specs and requirements):
  - `requirements.md:50-67` - UI 字段规范
  - `requirements/requirements-issues.csv:REQ-012` - UI 需求

  **WHY Each Reference Matters**:
  - Settings 页面展示了正确的表单结构和布局
  - 现有玻璃拟态样式应该复用于新页面

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Agent runs:
  curl -s http://localhost:8787/app/settings-ai | grep -o 'aiConfigView\|provider-select\|test-button'
  # Assert: Returns matches for all key elements
  # Assert: HTML structure is valid
  ```

  **Evidence to Capture**:
  - [ ] Terminal output showing HTML elements
  - [ ] Screenshot of AI config page (after Task 8)

  **Commit**: YES
  - Message: `feat(ui): add AI configuration page with glassmorphism design`
  - Files: `server/src/ui.ts`
  - Pre-commit: None

---

- [ ] 8. 扩展 UI JS 添加配置交互逻辑 (ui_js.ts)

  **What to do**:
  - 在 `server/src/ui_js.ts` 添加 AI 配置页面的交互逻辑
  - 实现表单初始化：加载当前配置到表单字段
  - 实现 Provider 选择器变化事件：动态显示/隐藏相关字段
  - 实现"测试连通性"按钮点击事件：
    - 收集表单数据
    - 调用 POST /api/admin/ai-config/test
    - 显示测试结果（成功/失败 + 延迟时间）
    - 显示内联错误（如果失败）
  - 实现"保存"按钮点击事件：
    - 收集表单数据
    - 验证必填字段
    - 调用 POST /api/admin/ai-config
    - 显示保存成功/失败提示
    - 失效本地配置缓存
  - 实现"清除密钥"按钮点击事件：
    - 将 apiKey 字段设为空字符串
    - 提示用户确认清除操作
  - 实现内联错误提示显示逻辑
  - 实现全局提示显示逻辑（toast/notification）

  **Must NOT do**:
  - 不在客户端验证密钥格式（仅服务端验证）
  - 不将密钥存储在 localStorage

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-high`
    - Reason: 复杂的交互逻辑，需要处理异步请求和错误
  - **Skills**: `[]` (no specific skills needed)
    - Reason: 纯 JavaScript，依赖原生 fetch API

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 9)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 4, 5, 7 (API and HTML must exist)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `server/src/ui_js.ts:1-56` - JS 补丁模式
  - `server/src/ui_js.ts:16-30` - fetch API 模式
  - `server/src/ui_ts:825+` - 基础 JS 逻辑（在 ui.ts 中）

  **WHY Each Reference Matters**:
  - ui_js.ts 展示了如何通过字符串替换扩展基础 JS
  - 现有 fetch 模式应该复用于 API 调用

  **Acceptance Criteria**:

  **Automated Verification** (using Playwright):
  ```bash
  # Agent executes via Playwright browser automation:
  1. Navigate to: http://localhost:8787/app/settings-ai
  2. Wait for: selector "#provider-select" to be visible
  3. Select: option "openai" in #provider-select
  4. Fill: #openai-api-key with "sk-test-123"
  5. Click: button#test-button
  6. Wait for: selector ".test-result" to be visible
  7. Assert: text "测试失败" or "测试成功" appears
  8. Screenshot: .sisyphus/evidence/task-8-test-button.png
  ```

  **Evidence to Capture**:
  - [ ] Screenshot of test button interaction
  - [ ] Browser console logs (should be no errors)

  **Commit**: YES
  - Message: `feat(ui): add AI configuration interaction logic (test/save/clear)`
  - Files: `server/src/ui_js.ts`
  - Pre-commit: None

---

- [ ] 9. 添加玻璃拟态 CSS 样式 (ui.ts)

  **What to do**:
  - 在 `server/src/ui.ts` 的 CSS 部分添加玻璃拟态样式
  - 定义 CSS 变量：
    - `--glass-bg: rgba(255,255,255,0.78)`
    - `--glass-border: rgba(15,23,42,0.10)`
    - `--glass-shadow: 0 18px 40px rgba(15,23,42,0.12)`
    - `--glass-blur: 18px`
  - 创建 `.glass` class：
    - `background: var(--glass-bg)`
    - `border: 1px solid var(--glass-border)`
    - `box-shadow: var(--glass-shadow)`
    - `backdrop-filter: blur(var(--glass-blur))`
    - `-webkit-backdrop-filter: blur(var(--glass-blur))`
  - 添加降级支持（@supports not backdrop-filter）：
    - 提高背景不透明度到 0.92
    - 添加纹理/阴影维持层级
  - 确保对比度符合 WCAG AA 标准（4.5:1）
  - 应用 `.glass` class 到 AI 配置页面容器
  - 添加响应式断点（640px, 1024px, 1280px）

  **Must NOT do**:
  - 不使用不支持的 CSS 属性（必须有降级方案）
  - 不破坏现有页面的样式

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `frontend-ui-ux`
    - Reason: CSS 设计，需要玻璃拟态专业知识
  - **Skills**: `['frontend-ui-ux']`
    - Reason: 该技能专门用于创建美观的 UI，包括玻璃拟态设计

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8)
  - **Blocks**: None (independent enhancement)
  - **Blocked By**: None (can start anytime)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `server/src/ui.ts:191-207` - CSS 变量定义
  - `server/src/ui.ts:220-234` - 现有玻璃拟态样式
  - `server/src/ui.ts:812-822` - 响应式断点

  **External References** (libraries and frameworks):
  - Glassmorphism CSS Guide: `https://css-tricks.com/glassmorphism-css/`
  - WCAG Contrast Checker: `https://webaim.org/resources/contrastchecker/`

  **WHY Each Reference Matters**:
  - 现有 CSS 变量和样式应该扩展，而非重复定义
  - CSS-Tricks 提供了玻璃拟态的最佳实践

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Agent runs:
  curl -s http://localhost:8787/static/app.css | grep -o 'glass-bg\|glass-blur\|backdrop-filter'
  # Assert: Returns matches for all glass-related CSS
  # Assert: Contains @supports fallback
  ```

  **Evidence to Capture**:
  - [ ] Terminal output showing CSS variables
  - [ ] Screenshot of glassmorphism effect (after Task 8)

  **Commit**: YES
  - Message: `feat(css): add glassmorphism styles with fallback support`
  - Files: `server/src/ui.ts`
  - Pre-commit: None

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(security): add AES-GCM encryption utility for AI config secrets` | `server/src/crypto.ts` | node -e test |
| 2 | `feat(config): add AI config cache module with KV support` | `server/src/config-cache.ts` | node -e test |
| 3 | `refactor(ai): add KV config priority support (fallback to env vars)` | `server/src/ai.ts` | curl /api/config |
| 4 | `feat(api): add GET/POST /api/admin/ai-config endpoints with encryption` | `server/src/index.ts` | curl /api/admin/ai-config |
| 5 | `feat(api): add POST /api/admin/ai-config/test endpoint for connectivity testing` | `server/src/index.ts` | curl /api/admin/ai-config/test |
| 6 | `feat(cache): initialize AI config cache on Worker startup` | `server/src/index.ts` | curl /api/config |
| 7 | `feat(ui): add AI configuration page with glassmorphism design` | `server/src/ui.ts` | curl /app/settings-ai |
| 8 | `feat(ui): add AI configuration interaction logic (test/save/clear)` | `server/src/ui_js.ts` | Playwright test |
| 9 | `feat(css): add glassmorphism styles with fallback support` | `server/src/ui.ts` | curl /static/app.css |

---

## Success Criteria

### Verification Commands
```bash
# 1. 登录管理员账号
SID=$(curl -s -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test123"}' \
  -c - | grep sid | awk '{print $7}')

# 2. 获取当前配置（应该返回空或默认值）
curl -s http://localhost:8787/api/admin/ai-config \
  -H "Cookie: sid=$SID" | jq '.'

# 3. 保存配置
curl -s -X POST http://localhost:8787/api/admin/ai-config \
  -H "Cookie: sid=$SID" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","model":"gpt-4o-mini","baseUrl":"https://api.openai.com/v1","apiKey":"sk-test"}' \
  | jq '.'

# 4. 验证配置已保存（hasSecret 应该为 true）
curl -s http://localhost:8787/api/admin/ai-config \
  -H "Cookie: sid=$SID" | jq '.config.hasSecret'

# 5. 测试连通性（使用无效密钥，应该返回错误）
curl -s -X POST http://localhost:8787/api/admin/ai-config/test \
  -H "Cookie: sid=$SID" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","model":"gpt-4o-mini","baseUrl":"https://api.openai.com/v1","apiKey":"sk-invalid"}' \
  | jq '.'

# 6. 验证全局配置已更新
curl -s http://localhost:8787/api/config | jq '.ai_provider, .ai_model'

# 7. 验证 UI 可访问
curl -s http://localhost:8787/app/settings-ai | grep -o 'aiConfigView'

# 8. 验证 CSS 包含玻璃拟态样式
curl -s http://localhost:8787/static/app.css | grep -o 'glass-bg\|backdrop-filter'
```

### Final Checklist
- [ ] 所有 API 端点返回正确的 HTTP 状态码
- [ ] 管理员可以保存和读取 AI 配置
- [ ] 密钥加密存储，GET API 不返回密钥
- [ ] 连通性测试成功/失败有明确提示
- [ ] UI 采用玻璃拟态设计，响应式布局
- [ ] 非管理员无法访问配置 API
- [ ] 配置优先级正确（KV > 环境变量）
- [ ] 向后兼容（环境变量作为默认值）
- [ ] 所有验证命令通过

---

## Deployment Configuration (CRITICAL)

### Required Worker Secret

在部署后，必须在 Cloudflare Dashboard 中配置以下 Secret：

```bash
# 在 Cloudflare Dashboard 或通过 wrangler CLI 配置
npx wrangler secret put AI_CONFIG_MASTER_KEY
# 输入一个强随机密钥（例如：openssl rand -base64 32）
```

**重要**: 此密钥用于加密/解密 AI API Keys，丢失后无法恢复已存储的密钥。

### KV Namespace

确保 `wrangler.toml` 中已配置 KV 命名空间绑定（已存在）：

```toml
[[kv_namespaces]]
binding = "KV"
id = "5dfedb3aa0744af78e309670405c4015"
```

### 环境变量（可选）

如果希望使用环境变量作为默认值，可在 `wrangler.toml` 中配置：

```toml
[vars]
AI_PROVIDER = "openai"
OPENAI_MODEL = "gpt-4o-mini"
OPENAI_BASE_URL = "https://api.openai.com/v1"
# 注意：API Key 应该通过 Secret 配置，而非环境变量
```