# Remove Cloudflare Workers AI As Default

## TL;DR

> Goal: stop using Cloudflare Workers AI (`workers`) as the *default* provider.
>
> Two interpretations:
> - **Option A**: remove Workers AI support entirely (breaking change).
> - **Option B**: keep Workers AI support, but it is never selected by default (minimal change).

Recommended: **Option B + fail-closed default (`none`)**, keep existing explicit `provider=workers` working.

Estimated effort: **Short** (B) / **Medium** (A)

---

## Context (repo facts)

Key decision points and evidence:

- `wrangler.toml` currently sets Workers AI as default:
  - `[ai] binding = "AI"` (creates `env.AI`)
  - `[vars] AI_PROVIDER = "workers"`

- Provider selection precedence is in `server/src/ai.ts`:
  1) KV `system:ai_config.provider` (if not `none`)
  2) `env.AI_PROVIDER`
  3) If unset: currently falls back to `env.AI` (Workers AI) → `env.OPENAI_API_KEY` → `env.GEMINI_API_KEY` → `none`

- UI settings dropdown includes Workers AI and currently defaults to it:
  - `server/src/ui.ts` includes `<option value="workers">Cloudflare Workers AI</option>`
  - `server/src/ui_js.ts` uses `config.provider || 'workers'`

- Admin API validation includes `workers`:
  - `server/src/index.ts` has `validProviders: ['workers','openai','openai_compatible','gemini']`

- Docs declare Workers AI as default:
  - `README.md` and `requirements.md`

Cloudflare docs safety note (cost risk): Workers AI calls run remotely even during `wrangler dev` and can incur usage charges if used. Keeping Workers AI as an implicit default increases accidental-cost risk.

---

## Option A: Remove Workers AI Support Entirely

### Intended Behavior

- `workers` provider no longer exists.
- No `env.AI` usage and no `[ai]` binding in config.
- UI cannot select Workers AI.

### Exact Code/Config Changes

1) **Remove Workers AI binding and default provider**
- `wrangler.toml`
  - Remove the entire `[ai]` section.
  - Change or remove `[vars] AI_PROVIDER = "workers"`.
  - (If keeping AI at all) set `AI_PROVIDER = "none"` or leave unset.

2) **Remove provider from types and selection**
- `server/src/ai.ts`
  - Remove `'workers'` from `AiProvider` union.
  - In `getAiProvider()`:
    - Remove parsing of `AI_PROVIDER` values mapping to workers (`raw === 'workers'|...`).
    - Remove the implicit fallback `if (env?.AI) return 'workers'`.
  - Remove Workers branches from:
    - `isAiAvailable()`
    - `getAiPublicConfig()`
    - `runAiChat()` (remove `env.AI.run(...)` path)
    - `testAiConnection()`

3) **Remove binding type and provider validation**
- `server/src/index.ts`
  - Remove `AI: any` from the `Bindings` type.
  - Update admin provider validation list to remove `'workers'`.

4) **Remove UI option**
- `server/src/ui.ts`
  - Remove the `<option value="workers">...` entry.
- `server/src/ui_js.ts`
  - Ensure default selection no longer assumes `'workers'`.

5) **Update docs/specs**
- `README.md`
  - Remove “默认使用 Cloudflare Workers AI ...” statement.
  - Document new default and how to configure providers.
- `requirements.md`
  - Remove statements that assume Workers AI is the default or core constraint.
  - Update provider list to exclude `workers`.

### Dependencies / Migration

- **Breaking change**: any existing deployment relying on Workers AI will stop working unless migrated.
- Decide how to handle existing KV `system:ai_config.provider="workers"`:
  - Recommended for Option A: treat as `none` and show actionable message in admin UI/API.

### Verification Steps (agent-executable)

Local:

1) `cd server && npm run dev`
2) `curl -s http://localhost:8787/api/config`
   - Expect `ai_provider` is not `workers` (should be `none` unless keys configured).
3) Visit `/app` → Settings
   - Provider dropdown does not contain Workers AI.
4) Try admin AI test endpoint without keys:
   - `curl -s -X POST http://localhost:8787/api/admin/ai-config/test` (requires admin session)
   - Expect a controlled error: `No AI provider configured` or `API key not configured`.

Deploy:

1) `npx wrangler deploy`
2) Confirm no Workers AI binding is required and Worker runs.

---

## Option B: Keep Workers AI Support, But Never Default

### Intended Behavior

- Workers AI remains supported as provider `workers`.
- **Default selection never resolves to `workers` unless explicitly selected** via:
  - KV `system:ai_config.provider = 'workers'`, OR
  - `AI_PROVIDER=workers` explicitly set.
- When nothing is configured, default is either:
  - **Fail-closed**: provider=`none` (recommended), OR
  - Auto-detect third-party keys (OpenAI/Gemini) (optional).

### Exact Code/Config Changes

1) **Stop declaring Workers AI as the default in config**
- `wrangler.toml`
  - Change `[vars] AI_PROVIDER = "workers"` → `AI_PROVIDER = "none"` (or remove line).
  - Decide whether to keep `[ai] binding = "AI"`:
    - Keep if you want workers available when explicitly selected.
    - Remove if you want “CF AI off by default” at the binding level too (users can add it back).

2) **Remove implicit fallback to `env.AI`**
- `server/src/ai.ts`
  - In `getAiProvider()` when `AI_PROVIDER` is empty:
    - Remove or move `if (env?.AI) return 'workers'`.
    - Replace with one of:
      - Fail-closed: return `none` if no explicit provider.
      - Auto-detect (no workers): if `OPENAI_API_KEY` return `openai`; else if `GEMINI_API_KEY` return `gemini`; else `none`.

3) **UI: avoid defaulting dropdown to workers**
- `server/src/ui.ts`
  - Optional but recommended: add a “None/Disabled” option or placeholder.
  - Keep Workers AI option but do not show it as the first/default selection.
- `server/src/ui_js.ts`
  - Change `providerEl.value = config.provider || 'workers'` to `config.provider || 'none'` (or empty placeholder).

4) **Admin API: decide if `none` is a valid saved provider**
- `server/src/index.ts`
  - Today `POST /api/admin/ai-config` rejects `provider === 'none'`.
  - If you want admins to be able to disable AI explicitly, allow saving `none` (either by storing `provider:'none'` or deleting `system:ai_config`).

5) **Docs/spec updates**
- `README.md`
  - Update to reflect “AI is off by default; pick provider in Settings or set env vars”.
- `requirements.md`
  - Update “默认配置” section so `workers` is no longer default.

### Dependencies / Migration

- Backward compatible if you keep: “KV explicitly says workers” and “AI_PROVIDER explicitly says workers”.
- Decide how to treat existing KV `provider=workers`:
  - Keep working (recommended for minimal breakage).
  - Auto-migrate to `none` (more aggressive; changes behavior).

### Verification Steps (agent-executable)

Goal: prove that *absence of config* no longer selects Workers AI.

Local (with `[ai]` binding present, but no provider set):

1) Start dev server: `cd server && npm run dev`
2) Ensure no `AI_PROVIDER` is provided and no KV provider is set.
3) `curl -s http://localhost:8787/api/config`
   - Expect `ai_provider` is `none` (fail-closed) OR `openai/gemini` only if auto-detect keys exist.
   - Must NOT be `workers`.
4) Visit `/app` → Settings
   - Dropdown should not default to Workers AI.

Explicit selection tests:

1) Set `AI_PROVIDER=workers` (or set KV provider to workers via admin UI).
2) Call `POST /api/admin/ai-config/test` and confirm it tests Workers AI only when selected.

---

## Recommended Default Behavior (and why)

Recommendation: **Option B + fail-closed default (`none`)**.

Rationale:
- **Safety/cost**: Workers AI calls can run remotely even in local dev; removing implicit fallback reduces accidental usage/cost.
- **UX clarity**: explicit provider selection avoids “why did it call Cloudflare?” surprises.
- **Compatibility**: keeping workers as an explicit option avoids breaking existing deployments.

---

## Ambiguity Questions (must answer before implementation)

1) Choose interpretation:
- A) Remove Workers AI entirely, OR
- B) Keep Workers AI but never default.

2) When nothing is configured (KV provider missing/none and AI_PROVIDER missing), should default be:
- Fail-closed: `none` (recommended), OR
- Auto-detect keys (OpenAI/Gemini), and what precedence?

3) Existing deployments: if KV `system:ai_config.provider` is `workers` already, should it:
- Keep working (recommended for B), OR
- Be auto-migrated to `none` (breaking).

4) UI: should the Settings dropdown still expose Workers AI as a selectable option?

---

## Notes / Related Risks (out of scope unless requested)

While mapping this change, two issues surfaced that affect AI config correctness:

- `server/src/ai.ts` stores secrets into KV (`system:ai_secret`) but AI calls/checks appear to read only public config (`system:ai_config`), so KV-stored API keys may not be used.
- `server/src/index.ts` calls `getAiPublicConfig()` / `isAiAvailable()` without `await` in some routes (risk: wrong config responses / gating).

These are not strictly required to “remove Workers AI default”, but if you want the admin UI-based provider switching to work reliably, they likely need fixing in the same implementation batch.
