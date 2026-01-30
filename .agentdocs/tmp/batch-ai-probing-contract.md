# Batch AI Probing Contract

Date: 2026-01-30

## Endpoint

`POST /api/admin/ai-config/test/batch`

Admin-only. Used to probe multiple providers in one call. This endpoint **never persists** request overrides to KV.

## Security

- Request may carry API keys (overrides). Keys are used only in-memory for the probe.
- Response never includes API keys.
- Errors are truncated to avoid dumping large upstream payloads.

## Request JSON

```json
{
  "includeNone": true,
  "candidates": [
    {
      "provider": "openai",
      "openaiApiKey": "sk-...",
      "openaiModel": "gpt-4o-mini",
      "openaiBaseUrl": "https://api.openai.com/v1"
    },
    {
      "provider": "openai_compatible",
      "openaiApiKey": "sk-...",
      "openaiModel": "gpt-4o-mini",
      "openaiBaseUrl": "https://your-compatible-endpoint/v1"
    },
    {
      "provider": "gemini",
      "geminiApiKey": "AIza...",
      "geminiModel": "gemini-1.5-flash"
    },
    { "provider": "none" }
  ]
}
```

Notes:
- `candidates` is optional. If omitted, server probes `openai`, `openai_compatible`, `gemini`, and (optionally) `none` using KV/env fallbacks.
- `includeNone` defaults to `true`.

## Response JSON

```json
{
  "ok": true,
  "results": [
    { "provider": "openai", "ok": true,  "latencyMs": 123 },
    { "provider": "openai_compatible", "ok": false, "latencyMs": 98, "error": "http_401" },
    { "provider": "gemini", "ok": false, "latencyMs": 0, "error": "api_key_missing" },
    { "provider": "none", "ok": false, "latencyMs": 0, "error": "not_configured" }
  ],
  "summary": { "ok": 1, "failed": 3 },
  "at": "2026-01-30T00:00:00.000Z"
}
```

## curl examples

```bash
curl -X POST http://localhost:8787/api/admin/ai-config/test/batch \
  -H "Cookie: sid=..." \
  -H "Content-Type: application/json" \
  -d '{"includeNone":true,"candidates":[{"provider":"openai","openaiApiKey":"sk-xxx","openaiModel":"gpt-4o-mini","openaiBaseUrl":"https://api.openai.com/v1"},{"provider":"gemini","geminiApiKey":"AIza-xxx","geminiModel":"gemini-1.5-flash"},{"provider":"none"}]}'
```
