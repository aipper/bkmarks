# Draft: Move AI Limits From Env Vars To System Settings

## Goal
- Make AI limits configurable via System Settings (admin UI at `/app/settings`) instead of only env vars.
- Persist overrides in Workers KV; runtime reads KV first, falls back to env defaults.
- Add admin-only GET/POST endpoints to read/update limits.
- Update all limit call sites: daily global, daily per-user, global RPM.
- Migration: if KV not set -> keep env behavior; once saved -> KV takes over.

## Current Codebase Findings (confirmed)

### Existing Env Vars
- `wrangler.toml` defines defaults:
  - `AI_DAILY_CALL_LIMIT_GLOBAL = 1000`
  - `AI_DAILY_CALL_LIMIT_PER_USER = 100`
  - `AI_RPM_LIMIT_GLOBAL = 10`

### Existing Runtime Usage (server/src/index.ts)
- `/api/config` returns:
  - `limits.global = c.env.AI_DAILY_CALL_LIMIT_GLOBAL`
  - `limits.user = c.env.AI_DAILY_CALL_LIMIT_PER_USER`
- `/api/system/status` returns same daily limits under `ai.limits`.
- `canUseAI(KV, userId, globalLimit, userLimit)` checks daily counts:
  - `ai_usage:global:YYYY-MM-DD`
  - `ai_usage:user:<userId>:YYYY-MM-DD`
  - Limit <= 0 means unlimited.
- `tryConsumeAiRpmGlobal(KV, rpmLimit)` uses fixed window minute bucket:
  - key: `ai_rpm:global:<minuteBucket>`
  - ttl: 120s
  - Not atomic (KV get + put), acceptable as soft limiter.
- Call sites currently pass env directly:
  - `maybeRunAI` (bookmark sync path)
  - `POST /api/ai/classify`
  - `POST /api/admin/ai-config/test`
  - `POST /api/admin/ai-config/test/batch`

### Existing KV-Backed Settings Pattern (server/src/ai.ts)
- AI provider config already supports: KV > env fallback.
- Keys:
  - `system:ai_config` (public config)
  - `system:ai_secret` (secrets)
- Admin endpoints:
  - `GET/POST /api/admin/ai-config` (admin-only)
- UI:
  - `/app/settings` has AI provider form in `server/src/ui.ts`.
  - UI JS flow is injected in `server/src/ui_js.ts` and uses fetch + status message patterns.

## Proposed KV Storage

### Decision (confirmed)
- KV key: `system:settings`
- Limits stored under: `ai.limits`

Example shape (v1):
- `{ "ai": { "limits": { "dailyGlobal": number, "dailyPerUser": number, "rpmGlobal": number } } }`

Metadata (optional but recommended):
- `ai.limitsMeta.updatedAt` (number, epoch ms)
- `ai.limitsMeta.updatedBy` (string, username)

## Runtime Resolution Rules (target behavior)
- Compute defaults from env:
  - dailyGlobal: `Number(env.AI_DAILY_CALL_LIMIT_GLOBAL) || 0`
  - dailyPerUser: `Number(env.AI_DAILY_CALL_LIMIT_PER_USER) || 0`
  - rpmGlobal: `Number(env.AI_RPM_LIMIT_GLOBAL) || 0`
- Overlay KV overrides when present and valid.
- Missing KV (`null`) => no overrides.
- Invalid KV JSON / schema mismatch => ignore overrides and fall back to env.
- Perf (confirmed): best-effort in-memory cache with TTL 30s to reduce KV reads.

Semantic decision (confirmed):
- Reject <= 0 values on admin update (must be positive integers).
- Runtime still needs to handle env defaults of 0 or missing safely; treat invalid/<=0 KV overrides as “ignore overrides”.

## Planned API Surface (admin-only)

### GET /api/admin/ai-limits
- Returns both effective values + raw KV values (if present) so UI can show “effective/source”.

### POST /api/admin/ai-limits
- Validates and writes KV overrides.

### (Optional) DELETE /api/admin/ai-limits
- Removes `ai.limits` from `system:settings` to revert to env defaults.

Decision (confirmed):
- Provide reset to fall back to env defaults.

## UI Requirements (app/settings)
- Add a new card or section near “AI 配置”:
  - inputs: daily global, daily per-user, rpm global
  - show effective values and source (kv/env)
  - client-side validation + server-side validation
  - save button + status messages

## Open Questions
- Validation bounds (max) for each value?
- Cross-field validation: enforce `dailyPerUser <= dailyGlobal`?
- Include RPM in `/api/config` and `/api/system/status` responses (effective values only) or keep RPM admin-only?
