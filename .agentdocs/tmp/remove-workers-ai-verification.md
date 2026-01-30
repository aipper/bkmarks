# Remove Workers AI Verification

Date: 2026-01-30

## Goal
Remove Cloudflare Workers AI support entirely, default AI provider to `none`, and force-migrate any KV config with `provider="workers"` to `provider="none"`.

## Evidence

### Wrangler dry-run bundle check

Command:

```bash
cd /Users/ab/work/ai/bkmarks/server
npx wrangler deploy --config ../wrangler.toml --dry-run
```

Observed:
- Dry-run completed successfully.
- Vars include `AI_PROVIDER: "none"`.
- No Workers AI binding is listed.

## Manual test suggestions

1) Start dev server:

```bash
cd /Users/ab/work/ai/bkmarks/server
npm run dev
```

2) As admin, verify config endpoints:

```bash
curl -H "Cookie: sid=..." http://localhost:8787/api/admin/ai-config
curl -X POST -H "Cookie: sid=..." -H "Content-Type: application/json" \
  -d '{"provider":"none"}' \
  http://localhost:8787/api/admin/ai-config
curl -X POST -H "Cookie: sid=..." http://localhost:8787/api/admin/ai-config/test
```

Expected:
- When provider is `none`, `/api/admin/ai-config/test` returns 400 with `{ ok:false, error:"not_configured" }`.
- After setting provider to `openai`/`gemini`, test returns `{ ok:true }` when keys are valid.
