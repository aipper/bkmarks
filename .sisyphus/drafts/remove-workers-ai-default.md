# Draft: Remove Workers AI As Default

## Requirements (confirmed)
- Change project default so it no longer uses Cloudflare Workers AI by default ("现在默认把cloudflare的ai去掉吧").
- Provide two alternative interpretations:
  - A) Remove Workers AI support entirely.
  - B) Keep Workers AI support, but never default; only used when explicitly selected.
- For each option: list exact code/config changes (files), dependencies, and verification steps.
- List ambiguity questions to ask before implementation.
- Provide recommended default behavior and rationale (safety/UX/compat).

## Research Findings (repo evidence)
- `wrangler.toml` defines Workers AI binding and sets default provider:
  - `[ai] binding = "AI"`
  - `[vars] AI_PROVIDER = "workers"`
- Provider selection code (KV first, then env, then implicit fallback):
  - `server/src/ai.ts`:
    - KV `system:ai_config.provider` (if not `none`) overrides everything.
    - `env.AI_PROVIDER` values map to providers.
    - If `AI_PROVIDER` missing, currently falls back to `env.AI` (Workers AI binding present) -> OpenAI -> Gemini -> none.
- UI provider dropdown includes Workers AI:
  - `server/src/ui.ts` has `<option value="workers">Cloudflare Workers AI</option>`
  - `server/src/ui_js.ts` defaults dropdown to `config.provider || 'workers'`.
- Server validates provider list includes `workers`:
  - `server/src/index.ts` `validProviders` includes `'workers'`.
- Docs claim Workers AI is default:
  - `README.md` and `requirements.md`.

## Risks / Bugs Discovered (may affect feasibility)
- KV secrets are stored but are not actually used by `runAiChat`/`isAiAvailable`/`testAiConnection`:
  - Those functions read only `system:ai_config` (public) not `system:ai_secret`.
  - This means configuring OpenAI/Gemini in the admin UI may not work unless env secrets exist.
- `getAiPublicConfig()` / `isAiAvailable()` are async but are used without `await` in `server/src/index.ts` in at least `/api/config` (risk: wrong runtime behavior / wrong JSON output).

## Open Questions
- Should we remove Workers AI support completely (A) or just stop defaulting to it (B)?
- If B: what should the new default behavior be when nothing is configured?
  - Fail-closed: `none` until admin selects provider.
  - Auto-detect based on keys: OpenAI if `OPENAI_API_KEY`, else Gemini if `GEMINI_API_KEY`, else none.
- Backward compatibility: what should happen to existing KV config `provider: "workers"`?
  - Keep working (only if explicitly set), auto-migrate to none, or error.

## Scope Boundaries
- INCLUDE: wrangler config, provider selection logic, UI dropdown options, docs.
- POTENTIALLY REQUIRED: fix KV-secret usage and missing awaits if they block the new default from being usable.
- EXCLUDE (unless requested): adding full test harness/CI.
