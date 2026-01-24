export type AiProvider = 'none' | 'workers' | 'openai' | 'openai_compatible' | 'gemini'

function asString(v: any) {
  if (v === null || v === undefined) return ''
  return String(v)
}

export function getAiProvider(env: any): AiProvider {
  const raw = asString(env?.AI_PROVIDER).trim().toLowerCase()
  if (raw) {
    if (raw === 'workers' || raw === 'cf' || raw === 'cloudflare' || raw === 'workers_ai' || raw === 'workers-ai') return 'workers'
    if (raw === 'openai') return 'openai'
    if (raw === 'openai_compatible' || raw === 'openai-compatible' || raw === 'compatible' || raw === 'newapi') return 'openai_compatible'
    if (raw === 'gemini' || raw === 'google') return 'gemini'
    return 'none'
  }
  if (env?.AI) return 'workers'
  if (env?.OPENAI_API_KEY) return 'openai'
  if (env?.GEMINI_API_KEY) return 'gemini'
  return 'none'
}

export function isAiAvailable(env: any) {
  const p = getAiProvider(env)
  if (p === 'workers') return Boolean(env?.AI)
  if (p === 'openai' || p === 'openai_compatible') return Boolean(env?.OPENAI_API_KEY)
  if (p === 'gemini') return Boolean(env?.GEMINI_API_KEY)
  return false
}

export function getAiPublicConfig(env: any) {
  const provider = getAiProvider(env)
  if (provider === 'workers') {
    return { provider, model: '@cf/meta/llama-3-8b-instruct' }
  }
  if (provider === 'openai' || provider === 'openai_compatible') {
    const model = asString(env?.OPENAI_MODEL).trim() || 'gpt-4o-mini'
    const base = normalizeOpenAiBaseUrl(asString(env?.OPENAI_BASE_URL).trim() || 'https://api.openai.com/v1')
    return { provider, model, baseUrl: base }
  }
  if (provider === 'gemini') {
    const model = asString(env?.GEMINI_MODEL).trim() || 'gemini-1.5-flash'
    return { provider, model, baseUrl: 'https://generativelanguage.googleapis.com' }
  }
  return { provider: 'none' as const }
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
  const provider = getAiProvider(env)

  if (provider === 'workers') {
    if (!env?.AI) throw new Error('ai_unavailable')
    const result = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages,
      max_tokens: maxTokens
    })
    return asString(result?.response || result?.result || '')
  }

  if (provider === 'openai' || provider === 'openai_compatible') {
    const apiKey = asString(env?.OPENAI_API_KEY).trim()
    if (!apiKey) throw new Error('ai_unavailable')
    const model = asString(env?.OPENAI_MODEL).trim() || 'gpt-4o-mini'
    const baseUrl = asString(env?.OPENAI_BASE_URL).trim() || 'https://api.openai.com/v1'
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
    const apiKey = asString(env?.GEMINI_API_KEY).trim()
    if (!apiKey) throw new Error('ai_unavailable')
    const model = asString(env?.GEMINI_MODEL).trim() || 'gemini-1.5-flash'
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

