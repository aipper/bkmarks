# Draft: Remove Cloudflare Workers AI

## Requirements (confirmed)
- Remove Cloudflare Workers AI entirely (provider `workers` removed from codebase and UI).
- Default provider becomes `none` (no AI provider configured).
- Force-migrate KV: if `system:ai_config.provider == 'workers'`, rewrite to `'none'` and prompt admin to reselect a provider.
- Update server/admin API: `/api/admin/ai-config`, `/api/admin/ai-config` (POST), `/api/admin/ai-config/test` must no longer accept `workers` as a valid provider.
- Update UI settings page: remove `workers` option and stop defaulting to `workers`.
- Update Cloudflare config: remove `[ai]` binding and any default `AI_PROVIDER="workers"`.
- Update docs: `REQUIREMENTS.md` and `requirements/CHANGELOG.md` must no longer mention Workers AI.

## Current Codebase Notes (user-reported)
- `server/src/ai.ts`: providers include `workers|openai|openai_compatible|gemini`; references `env.AI` and `@cf/meta/llama-3-8b-instruct`.
- `server/src/index.ts`: admin AI config routes; validation includes `workers`.
- `server/src/ui.ts` + `server/src/ui_js.ts`: settings UI includes `workers`; JS defaults `provider||'workers'`.
- `wrangler.toml`: `[ai] binding="AI"` and `AI_PROVIDER="workers"`.

## Scope Boundaries
- INCLUDE: server logic, API validation, UI settings, wrangler config, docs, KV migration.
- EXCLUDE (unless you confirm otherwise): adding new providers, changing non-AI admin settings, changing unrelated infrastructure.

## Open Questions
- For `/api/admin/ai-config/test` when provider is `none`: should it return 400 (not configured) or 200 with `{ ok:false, reason:"not_configured" }`?
- After migration from `workers` -> `none`: where should the admin prompt appear (settings page banner, toast, or inline warning)?
- Should we delete any Workers-specific env vars/bindings beyond `[ai]` and `AI_PROVIDER` if they exist (e.g. `AI_MODEL`)?
