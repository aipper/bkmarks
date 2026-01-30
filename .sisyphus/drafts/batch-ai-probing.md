# Draft: Batch AI Connectivity Probing (\"\u6279\u91cf ai \u63a2\u6d4b\")

## Objective
- Add a batch connectivity probing feature for AI providers now that Workers AI is removed.

## Repo Context (confirmed)
- Stack: Cloudflare Workers + Hono server.
- Existing admin endpoints:
  - `GET /api/admin/ai-config`
  - `POST /api/admin/ai-config`
  - `POST /api/admin/ai-config/test`
- Supported providers: `none | openai | openai_compatible | gemini`.
- Default provider is `none` (fail-closed).
- Single test endpoint behavior: when provider is `none`, returns HTTP 400 with `{ ok:false, error:"not_configured" }`.
- UI: `/app/settings` has AI config form, uses fetch to call admin endpoints; shows status + migration notice.
- KV keys:
  - `system:ai_config`
  - `system:ai_secret`
- Migration: converts provider `workers` -> `none`.

## Requirements (confirmed)
1) Add new admin API endpoint to test multiple providers and return per-provider results.
2) Settings UI changes: add a \"\u6279\u91cf\u63a2\u6d4b\" button and a list/table with per-provider status, latency, error.
3) Must not leak secrets (no API key in responses or logs).
4) Should not require saving config to test; OK if it only tests currently saved KV/env config unless a better approach is proposed.
5) Fit existing code style (string-templated `server/src/ui.ts` + `server/src/ui_js.ts`); no new deps.
6) Provide a test plan with exact curl commands + expected JSON.

## Code Locations (verified)
- Routes:
  - `server/src/index.ts` defines `/api/admin/ai-config*` endpoints.
- AI config and single test logic:
  - `server/src/ai.ts` has `testAiConnection(env)` (single provider) and KV/env resolution helpers.
- Settings UI template:
  - `server/src/ui.ts` contains `#settingsView` and the AI config form.
  - `server/src/ui_js.ts` injects `aiConfigSnippet` for load/save/test.

## Proposed Endpoint Shape (draft)
- Path: `POST /api/admin/ai-config/test/batch`
- Request JSON (defaults apply if omitted):
  - `providers?: ("openai"|"openai_compatible"|"gemini"|"none")[]`
  - `overrides?: { ... }` (optional per-provider overrides; never echoed back)
    - For OpenAI/openai_compatible: `openaiModel?`, `openaiBaseUrl?`, `openaiApiKey?`
    - For Gemini: `geminiModel?`, `geminiApiKey?`
  - If no overrides provided: test effective (KV/env) config.
- Response JSON:
  - `ok: true`
  - `results: Array<{ provider, ok, latencyMs, error? }>`
  - Never include API keys.

## Security Notes (draft)
- Do not log request body.
- Do not include secrets in response.
- If we accept unsaved overrides (including API keys), treat them as in-memory only (no KV writes).

## Open Questions
- Should batch probing test unsaved form inputs (including typed API keys) via request overrides, or only saved KV/env config?
- Should `provider:"none"` appear in the batch result list (as `{ ok:false, error:"not_configured" }`) or be omitted by default?
- Any preference on per-provider timeout and whether batch is sequential vs parallel?
