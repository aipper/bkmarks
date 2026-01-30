export type AiProvider = 'none' | 'openai' | 'openai_compatible' | 'gemini'

export interface AiConfig {
  provider: AiProvider
  openaiModel?: string
  openaiBaseUrl?: string
  geminiModel?: string
}

// Secrets are stored separately in KV. Use null to explicitly clear.
export interface AiSecretUpdate {
  openaiApiKey?: string | null
  geminiApiKey?: string | null
}

export interface AiConfigPublic {
  provider: AiProvider
  model?: string
  baseUrl?: string
  hasSecret: boolean
}

function asString(v: any) {
  if (v === null || v === undefined) return ''
  return String(v)
}

type StoredAiConfig = {
  provider?: string
  openaiModel?: string
  openaiBaseUrl?: string
  geminiModel?: string
}

type StoredAiSecret = {
  openaiApiKey?: string
  geminiApiKey?: string
}

export type AiConfigWithMeta = {
  config: (AiConfig & { openaiApiKey?: string; geminiApiKey?: string }) | null
  needsReselect: boolean
}

function normalizeProvider(raw: string): AiProvider {
  const v = (raw || '').trim().toLowerCase()
  if (v === 'openai') return 'openai'
  if (v === 'openai_compatible' || v === 'openai-compatible' || v === 'compatible' || v === 'newapi') return 'openai_compatible'
  if (v === 'gemini' || v === 'google') return 'gemini'
  if (v === 'none' || v === '') return 'none'
  // Workers AI is explicitly removed; treat as none.
  if (v === 'workers' || v === 'cf' || v === 'cloudflare' || v === 'workers_ai' || v === 'workers-ai') return 'none'
  return 'none'
}

async function getAiConfigFromKvWithMeta(KV: any): Promise<AiConfigWithMeta> {
  let needsReselect = false
  try {
    const [configRaw, secretRaw] = await Promise.all([KV.get('system:ai_config'), KV.get('system:ai_secret')])
    if (!configRaw) {
      return { config: null, needsReselect: false }
    }

    const parsed: StoredAiConfig = JSON.parse(configRaw)
    const providerRaw = asString(parsed?.provider)

    // Force-migrate any historical workers config to none.
    const provider = normalizeProvider(providerRaw)
    if ((providerRaw || '').trim().toLowerCase() === 'workers') {
      needsReselect = true
    }
    if (provider === 'none' && providerRaw && normalizeProvider(providerRaw) === 'none') {
      // If the stored provider was workers/cf/etc, normalizeProvider already returns none.
      const v = providerRaw.trim().toLowerCase()
      if (v === 'workers' || v === 'cf' || v === 'cloudflare' || v === 'workers_ai' || v === 'workers-ai') needsReselect = true
    }

    if (needsReselect) {
      // Write back a normalized config so the migration is idempotent.
      await KV.put('system:ai_config', JSON.stringify({ provider: 'none' }))
    }

    const secret: StoredAiSecret = secretRaw ? JSON.parse(secretRaw) : {}
    return {
      config: {
        provider,
        openaiModel: asString(parsed?.openaiModel).trim() || undefined,
        openaiBaseUrl: asString(parsed?.openaiBaseUrl).trim() || undefined,
        geminiModel: asString(parsed?.geminiModel).trim() || undefined,
        openaiApiKey: asString(secret?.openaiApiKey).trim() || undefined,
        geminiApiKey: asString(secret?.geminiApiKey).trim() || undefined
      },
      needsReselect
    }
  } catch {
    return { config: null, needsReselect: false }
  }
}

export async function getAiConfigWithMeta(KV: any): Promise<AiConfigWithMeta> {
  return getAiConfigFromKvWithMeta(KV)
}

export async function getAiProvider(env: any): Promise<AiProvider> {
  const kvMeta = env?.KV ? await getAiConfigFromKvWithMeta(env.KV) : { config: null, needsReselect: false }
  const kvProvider = kvMeta.config?.provider || 'none'
  if (kvProvider !== 'none') return kvProvider

  // Fail-closed default: only enable AI if explicitly configured.
  const raw = asString(env?.AI_PROVIDER)
  return normalizeProvider(raw)
}

export async function isAiAvailable(env: any): Promise<boolean> {
  const p = await getAiProvider(env)
  if (p === 'openai' || p === 'openai_compatible') {
    const kvConfig = env?.KV ? (await getAiConfigFromKvWithMeta(env.KV)).config : null
    if (kvConfig?.openaiApiKey) return true
    return Boolean(env?.OPENAI_API_KEY)
  }
  if (p === 'gemini') {
    const kvConfig = env?.KV ? (await getAiConfigFromKvWithMeta(env.KV)).config : null
    if (kvConfig?.geminiApiKey) return true
    return Boolean(env?.GEMINI_API_KEY)
  }
  return false
}

export async function getAiPublicConfig(env: any): Promise<AiConfigPublic> {
  const provider = await getAiProvider(env)
  const kvConfig = env?.KV ? (await getAiConfigFromKvWithMeta(env.KV)).config : null

  if (provider === 'openai' || provider === 'openai_compatible') {
    const model = kvConfig?.openaiModel || asString(env?.OPENAI_MODEL).trim() || 'gpt-4o-mini'
    const base = normalizeOpenAiBaseUrl(kvConfig?.openaiBaseUrl || asString(env?.OPENAI_BASE_URL).trim() || 'https://api.openai.com/v1')
    const hasSecret = Boolean(kvConfig?.openaiApiKey || env?.OPENAI_API_KEY)
    return { provider, model, baseUrl: base, hasSecret }
  }
  if (provider === 'gemini') {
    const model = kvConfig?.geminiModel || asString(env?.GEMINI_MODEL).trim() || 'gemini-1.5-flash'
    const hasSecret = Boolean(kvConfig?.geminiApiKey || env?.GEMINI_API_KEY)
    return { provider, model, baseUrl: 'https://generativelanguage.googleapis.com', hasSecret }
  }
  return { provider: 'none', hasSecret: false }
}

type AiChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

function normalizeOpenAiBaseUrl(input: string) {
  const raw = (input || '').trim()
  if (!raw) return 'https://api.openai.com/v1'
  return raw.replace(/\/+$/, '')
}

function openAiChatEndpoint(baseUrl: string) {
  const base = normalizeOpenAiBaseUrl(baseUrl)
  if (base.endsWith('/v1')) return `${base}/chat/completions`
  return `${base}/v1/chat/completions`
}

async function safeJson(resp: Response) {
  try {
    return await resp.json()
  } catch {
    return null
  }
}

export async function runAiChat(env: any, messages: AiChatMessage[], maxTokens = 120): Promise<string> {
  const provider = await getAiProvider(env)
  const kvConfig = env?.KV ? (await getAiConfigFromKvWithMeta(env.KV)).config : null

  if (provider === 'openai' || provider === 'openai_compatible') {
    const apiKey = kvConfig?.openaiApiKey || asString(env?.OPENAI_API_KEY).trim()
    if (!apiKey) throw new Error('ai_unavailable')
    const model = kvConfig?.openaiModel || asString(env?.OPENAI_MODEL).trim() || 'gpt-4o-mini'
    const baseUrl = kvConfig?.openaiBaseUrl || asString(env?.OPENAI_BASE_URL).trim() || 'https://api.openai.com/v1'
    const endpoint = openAiChatEndpoint(baseUrl)

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.2
      })
    })
    if (!resp.ok) {
      const data = await safeJson(resp)
      const msg = asString(data?.error?.message || data?.message || '')
      throw new Error(`ai_http_${resp.status}${msg ? `:${msg}` : ''}`)
    }
    const data: any = await safeJson(resp)
    return asString(data?.choices?.[0]?.message?.content || '')
  }

  if (provider === 'gemini') {
    const apiKey = kvConfig?.geminiApiKey || asString(env?.GEMINI_API_KEY).trim()
    if (!apiKey) throw new Error('ai_unavailable')
    const model = kvConfig?.geminiModel || asString(env?.GEMINI_MODEL).trim() || 'gemini-1.5-flash'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`

    const system = messages.find((m) => m.role === 'system')?.content || ''
    const userText = messages
      .filter((m) => m.role !== 'system')
      .map((m) => m.content)
      .join('\n\n')

    const body: any = {
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 }
    }
    if (system) body.systemInstruction = { parts: [{ text: system }] }

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!resp.ok) {
      const data = await safeJson(resp)
      const msg = asString(data?.error?.message || data?.message || '')
      throw new Error(`ai_http_${resp.status}${msg ? `:${msg}` : ''}`)
    }
    const data: any = await safeJson(resp)
    const parts = data?.candidates?.[0]?.content?.parts
    if (Array.isArray(parts)) return parts.map((p: any) => asString(p?.text)).join('')
    return ''
  }

  throw new Error('ai_unavailable')
}

export async function saveAiConfig(KV: any, config: AiConfig, secrets?: AiSecretUpdate): Promise<void> {
  const publicConfig: any = {
    provider: config.provider
  }
  if (config.provider === 'openai' || config.provider === 'openai_compatible') {
    publicConfig.openaiModel = config.openaiModel
    publicConfig.openaiBaseUrl = config.openaiBaseUrl
  }
  if (config.provider === 'gemini') {
    publicConfig.geminiModel = config.geminiModel
  }
  await KV.put('system:ai_config', JSON.stringify(publicConfig))

  // Keep secrets unless explicitly updated.
  if (!secrets) return
  let existing: StoredAiSecret = {}
  try {
    const raw = await KV.get('system:ai_secret')
    if (raw) existing = JSON.parse(raw)
  } catch {
    existing = {}
  }

  if (Object.prototype.hasOwnProperty.call(secrets, 'openaiApiKey')) {
    const v = secrets.openaiApiKey
    if (v) existing.openaiApiKey = v
    else delete existing.openaiApiKey
  }
  if (Object.prototype.hasOwnProperty.call(secrets, 'geminiApiKey')) {
    const v = secrets.geminiApiKey
    if (v) existing.geminiApiKey = v
    else delete existing.geminiApiKey
  }

  if (Object.keys(existing).length > 0) await KV.put('system:ai_secret', JSON.stringify(existing))
  else await KV.delete('system:ai_secret')
}

export async function getAiConfigFull(KV: any): Promise<(AiConfig & { openaiApiKey?: string; geminiApiKey?: string }) | null> {
  return (await getAiConfigFromKvWithMeta(KV)).config
}

export async function testAiConnection(env: any): Promise<{ ok: boolean; error?: string }> {
  const provider = await getAiProvider(env)
  const kvConfig = env?.KV ? (await getAiConfigFromKvWithMeta(env.KV)).config : null

  try {
    if (provider === 'openai' || provider === 'openai_compatible') {
      const apiKey = kvConfig?.openaiApiKey || asString(env?.OPENAI_API_KEY).trim()
      if (!apiKey) return { ok: false, error: 'API key not configured' }
      const model = kvConfig?.openaiModel || asString(env?.OPENAI_MODEL).trim() || 'gpt-4o-mini'
      const baseUrl = kvConfig?.openaiBaseUrl || asString(env?.OPENAI_BASE_URL).trim() || 'https://api.openai.com/v1'
      const endpoint = openAiChatEndpoint(baseUrl)

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        })
      })
      if (!resp.ok) {
        const data = await safeJson(resp)
        const msg = asString(data?.error?.message || data?.message || `HTTP ${resp.status}`)
        return { ok: false, error: msg }
      }
      return { ok: true }
    }

    if (provider === 'gemini') {
      const apiKey = kvConfig?.geminiApiKey || asString(env?.GEMINI_API_KEY).trim()
      if (!apiKey) return { ok: false, error: 'API key not configured' }
      const model = kvConfig?.geminiModel || asString(env?.GEMINI_MODEL).trim() || 'gemini-1.5-flash'
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'test' }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      })
      if (!resp.ok) {
        const data = await safeJson(resp)
        const msg = asString(data?.error?.message || data?.message || `HTTP ${resp.status}`)
        return { ok: false, error: msg }
      }
      return { ok: true }
    }

    return { ok: false, error: 'not_configured' }
  } catch (e: any) {
    return { ok: false, error: asString(e?.message || e) }
  }
}

export type AiProbeCandidate = {
  provider: AiProvider
  // Optional overrides. If omitted, caller should have already applied fallbacks.
  openaiApiKey?: string
  openaiModel?: string
  openaiBaseUrl?: string
  geminiApiKey?: string
  geminiModel?: string
}

export type AiProbeResult = {
  provider: AiProvider
  ok: boolean
  latencyMs: number
  error?: string
}

function normalizeErrorText(v: any) {
  const s = asString(v).trim()
  if (!s) return ''
  // Keep responses bounded; avoid dumping upstream payloads.
  if (s.length > 240) return `${s.slice(0, 240)}…`
  return s
}

export async function probeAiCandidate(candidate: AiProbeCandidate): Promise<AiProbeResult> {
  const t0 = Date.now()
  const provider = candidate.provider

  try {
    if (!provider || provider === 'none') {
      return { provider: 'none', ok: false, latencyMs: 0, error: 'not_configured' }
    }

    if (provider === 'openai' || provider === 'openai_compatible') {
      const apiKey = asString(candidate.openaiApiKey).trim()
      if (!apiKey) {
        return { provider, ok: false, latencyMs: 0, error: 'api_key_missing' }
      }
      const model = asString(candidate.openaiModel).trim() || 'gpt-4o-mini'
      const baseUrl = asString(candidate.openaiBaseUrl).trim() || 'https://api.openai.com/v1'
      const endpoint = openAiChatEndpoint(baseUrl)

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        })
      })

      const latencyMs = Date.now() - t0
      if (!resp.ok) {
        const data = await safeJson(resp)
        const msg = normalizeErrorText(data?.error?.message || data?.message || `HTTP ${resp.status}`)
        return { provider, ok: false, latencyMs, error: msg || `http_${resp.status}` }
      }
      return { provider, ok: true, latencyMs }
    }

    if (provider === 'gemini') {
      const apiKey = asString(candidate.geminiApiKey).trim()
      if (!apiKey) {
        return { provider, ok: false, latencyMs: 0, error: 'api_key_missing' }
      }
      const model = asString(candidate.geminiModel).trim() || 'gemini-1.5-flash'
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'test' }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      })

      const latencyMs = Date.now() - t0
      if (!resp.ok) {
        const data = await safeJson(resp)
        const msg = normalizeErrorText(data?.error?.message || data?.message || `HTTP ${resp.status}`)
        return { provider, ok: false, latencyMs, error: msg || `http_${resp.status}` }
      }
      return { provider, ok: true, latencyMs }
    }

    return { provider, ok: false, latencyMs: Date.now() - t0, error: 'not_supported' }
  } catch (e: any) {
    return { provider, ok: false, latencyMs: Date.now() - t0, error: normalizeErrorText(e?.message || e) || 'unknown_error' }
  }
}
