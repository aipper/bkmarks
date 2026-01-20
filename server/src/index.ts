import { Hono } from 'hono'
import type { KVNamespace, R2Bucket } from '@cloudflare/workers-types'
import { hashPassword, verifyPassword, randomId, getUser, putUser, getSession, putSession, delSession, parseCookies, makeCookie } from './auth'
import { upsertBookmark, removeBookmark, listBookmarks, setAiTags, getBookmarkStats, getAiTagCandidates, setManualTags } from './bookmarks'
import { loadStatus, saveStatus, checkUrl } from './status'
import { html, css, js } from './ui'

type Bindings = {
  KV: KVNamespace
  R2: R2Bucket
  AI: any
  AI_DAILY_CALL_LIMIT_GLOBAL: number
  AI_DAILY_CALL_LIMIT_PER_USER: number
  ADMIN_RESET_TOKEN: string
}

const app = new Hono<{ Bindings: Bindings }>()

const SESSION_COOKIE = 'sid'
const SESSION_TTL = 7 * 24 * 3600

async function isRegistrationOpen(KV: KVNamespace) {
  const flag = await KV.get('system:adminCreated')
  return !flag
}

async function closeRegistration(KV: KVNamespace) {
  await KV.put('system:adminCreated', 'true')
}

async function openRegistration(KV: KVNamespace) {
  await KV.delete('system:adminCreated')
}
app.get('/', (c) => {
  return c.text('Bkmarks Server is running!')
})

app.get('/api/config', (c) => {
  return c.json({
    ai_enabled: Boolean(c.env.AI),
    limits: {
      global: c.env.AI_DAILY_CALL_LIMIT_GLOBAL,
      user: c.env.AI_DAILY_CALL_LIMIT_PER_USER
    }
  })
})

app.get('/app', (c) => {
  return c.newResponse(html(), 200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  })
})

app.get('/app/:page', (c) => {
  return c.newResponse(html(), 200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  })
})

app.get('/static/app.css', (c) => {
  return c.newResponse(css(), 200, {
    'content-type': 'text/css; charset=utf-8',
    'cache-control': 'no-store'
  })
})

app.get('/static/app.js', (c) => {
  return c.newResponse(js(), 200, {
    'content-type': 'application/javascript; charset=utf-8',
    'cache-control': 'no-store'
  })
})

app.post('/api/system/reset-registration', async (c) => {
  const token = c.req.header('X-Admin-Reset-Token') || ''
  if (!token || token !== c.env.ADMIN_RESET_TOKEN) return c.json({ ok: false }, 403)
  await openRegistration(c.env.KV)
  return c.json({ ok: true })
})

app.post('/api/system/set-password', async (c) => {
  const token = c.req.header('X-Admin-Reset-Token') || ''
  if (!token || token !== c.env.ADMIN_RESET_TOKEN) return c.json({ ok: false }, 403)
  const body = await c.req.json()
  const username = (body?.username || '').trim()
  const password = body?.password || ''
  if (!username || !password) return c.json({ ok: false }, 400)
  const user = await getUser(c.env.KV, username)
  if (!user) return c.json({ ok: false }, 404)
  const passwordHash = await hashPassword(password)
  await putUser(c.env.KV, username, { ...user, passwordHash })
  return c.json({ ok: true })
})

app.post('/api/auth/register', async (c) => {
  const body = await c.req.json()
  const username = (body?.username || '').trim()
  const password = body?.password || ''
  if (!username || !password) return c.json({ ok: false, error: 'bad_request' }, 400)
  const open = await isRegistrationOpen(c.env.KV)
  if (!open) return c.json({ ok: false, error: 'registration_closed' }, 403)
  const exists = await getUser(c.env.KV, username)
  if (exists) return c.json({ ok: false, error: 'conflict' }, 409)
  const userId = randomId(16)
  const passwordHash = await hashPassword(password)
  await putUser(c.env.KV, username, { id: userId, username, passwordHash, role: 'admin', createdAt: Date.now() })
  await closeRegistration(c.env.KV)
  return c.json({ ok: true, role: 'admin' })
})

app.get('/api/auth/registration', async (c) => {
  const open = await isRegistrationOpen(c.env.KV)
  return c.json({ open })
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json()
  const username = (body?.username || '').trim()
  const password = body?.password || ''
  if (!username || !password) return c.json({ ok: false, error: 'bad_request' }, 400)
  const user = await getUser(c.env.KV, username)
  if (!user) return c.json({ ok: false, error: 'unauthorized' }, 401)
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return c.json({ ok: false, error: 'unauthorized' }, 401)
  const sid = randomId(24)
  await putSession(c.env.KV, sid, { userId: user.id, username: user.username, role: user.role || 'user', createdAt: Date.now() }, SESSION_TTL)
  c.header('Set-Cookie', makeCookie(SESSION_COOKIE, sid, SESSION_TTL))
  return c.json({ ok: true })
})

app.post('/api/auth/logout', async (c) => {
  const cookies = parseCookies(c.req.header('Cookie'))
  const sid = cookies[SESSION_COOKIE]
  if (sid) await delSession(c.env.KV, sid)
  c.header('Set-Cookie', makeCookie(SESSION_COOKIE, '', 0))
  return c.json({ ok: true })
})

app.get('/api/auth/me', async (c) => {
  const cookies = parseCookies(c.req.header('Cookie'))
  const sid = cookies[SESSION_COOKIE]
  if (!sid) return c.json({ ok: false }, 401)
  const sess = await getSession(c.env.KV, sid)
  if (!sess) return c.json({ ok: false }, 401)
  return c.json({ ok: true, user: { id: sess.userId, username: sess.username, role: sess.role || 'user' } })
})

async function getAuthUserFromRequest(c: any) {
  const auth = c.req.header('Authorization')
  if (auth && auth.startsWith('Basic ')) {
    const raw = atob(auth.slice(6))
    const i = raw.indexOf(':')
    if (i > 0) {
      const username = raw.slice(0, i)
      const password = raw.slice(i + 1)
      const user = await getUser(c.env.KV, username)
      if (!user) return null
      const ok = await verifyPassword(password, user.passwordHash)
      if (!ok) return null
      return user
    }
  }
  const cookies = parseCookies(c.req.header('Cookie'))
  const sid = cookies[SESSION_COOKIE]
  if (!sid) return null
  const sess = await getSession(c.env.KV, sid)
  if (!sess) return null
  return { id: sess.userId, username: sess.username, role: sess.role || 'user' }
}

function requireAdmin(user: any) {
  return user && user.role === 'admin'
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

async function getUsageCount(KV: KVNamespace, key: string) {
  const v = await KV.get(key)
  return v ? Number(v) : 0
}

async function incrementUsage(KV: KVNamespace, key: string) {
  const current = await getUsageCount(KV, key)
  const next = current + 1
  await KV.put(key, String(next))
  return next
}

async function canUseAI(KV: KVNamespace, userId: string, globalLimit: number, userLimit: number) {
  const date = todayKey()
  const gLimit = Number(globalLimit) || 0
  const uLimit = Number(userLimit) || 0
  if (gLimit > 0) {
    const g = await getUsageCount(KV, `ai_usage:global:${date}`)
    if (g >= gLimit) return false
  }
  if (uLimit > 0) {
    const u = await getUsageCount(KV, `ai_usage:user:${userId}:${date}`)
    if (u >= uLimit) return false
  }
  return true
}

async function markAIUsage(KV: KVNamespace, userId: string) {
  const date = todayKey()
  await incrementUsage(KV, `ai_usage:global:${date}`)
  await incrementUsage(KV, `ai_usage:user:${userId}:${date}`)
}

async function appendAiLog(KV: KVNamespace, userId: string, entry: any) {
  const key = `ai_log:user:${userId}`
  const raw = await KV.get(key)
  let items: any[] = []
  if (raw) {
    try { items = JSON.parse(raw) } catch { items = [] }
  }
  items.unshift(entry)
  items = items.slice(0, 20)
  await KV.put(key, JSON.stringify(items))
  return items
}

async function getAiLogs(KV: KVNamespace, userId: string) {
  const key = `ai_log:user:${userId}`
  const raw = await KV.get(key)
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

async function getUsageSummary(KV: KVNamespace, userId: string) {
  const date = todayKey()
  const globalUsed = await getUsageCount(KV, `ai_usage:global:${date}`)
  const userUsed = await getUsageCount(KV, `ai_usage:user:${userId}:${date}`)
  return { globalUsed, userUsed, date }
}

async function getUserTags(KV: KVNamespace, userId: string) {
  const key = `tags:user:${userId}`
  const raw = await KV.get(key)
  if (raw) {
    try {
      const tags = JSON.parse(raw)
      if (Array.isArray(tags)) return tags
    } catch {
      // ignore
    }
  }
  const defaults = DEFAULT_TAGS.map((name, i) => ({ name, enabled: false, order: i }))
  await KV.put(key, JSON.stringify(defaults))
  return defaults
}

async function saveUserTags(KV: KVNamespace, userId: string, tags: any[]) {
  const key = `tags:user:${userId}`
  await KV.put(key, JSON.stringify(tags))
}

function extractJsonArray(text: string) {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return null
  try {
    const arr = JSON.parse(match[0])
    return Array.isArray(arr) ? arr : null
  } catch {
    return null
  }
}

const AI_TAG_WHITELIST = [
  '工具',
  '文档',
  '教程',
  '视频',
  '开发',
  '资源',
  '社区',
  '效率',
  '设计',
  '新闻',
  '娱乐',
  '金融',
  '购物',
  '教育',
  'AI',
  'AI中转'
]

const DEFAULT_TAGS = AI_TAG_WHITELIST

const AI_TAG_SYNONYMS: Record<string, string> = {
  '指南': '教程',
  '手册': '教程',
  '课程': '教程',
  '学习': '教育',
  '问答': '社区',
  '论坛': '社区',
  '生产力': '效率',
  '效率工具': '效率',
  'ai工具': 'AI',
  '人工智能': 'AI',
  'ai中转站': 'AI中转',
  '中转': 'AI中转',
  '代理': 'AI中转',
  '转发': 'AI中转',
  '网关': 'AI中转'
}

function normalizeAiTag(tag: string) {
  const t = tag.trim()
  if (!t) return null
  const lower = t.toLowerCase()
  const mapped = AI_TAG_SYNONYMS[lower] || AI_TAG_SYNONYMS[t] || t
  return AI_TAG_WHITELIST.includes(mapped) ? mapped : null
}

function detectAiRelay(url: string, title?: string) {
  const s = `${url} ${title || ''}`.toLowerCase()
  if (s.includes('newapi')) return true
  if (s.includes('中转') || s.includes('转发') || s.includes('relay') || s.includes('proxy') || s.includes('gateway')) {
    if (s.includes('ai') || s.includes('openai') || s.includes('gpt') || s.includes('llm') || s.includes('api')) {
      return true
    }
  }
  return false
}

async function classifyWithAI(c: any, url: string, title?: string) {
  if (!c.env.AI) return []
  const prompt = `你是书签分类助手，请从固定白名单中选择2-3个中文标签，必须是主题/用途类标签，不要包含域名、路径、版本号。只返回JSON数组。白名单：${AI_TAG_WHITELIST.join('、')}。`
  const input = `标题: ${title || ''}\nURL: ${url}`
  const result = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: input }
    ],
    max_tokens: 120
  })
  const raw = result?.response || result?.result || ''
  const parsed = extractJsonArray(String(raw))
  const cleaned = (parsed || [])
    .filter((t: any) => typeof t === 'string')
    .map((t: string) => normalizeAiTag(t))
    .filter(Boolean) as string[]
  if (detectAiRelay(url, title)) cleaned.push('AI中转')
  return Array.from(new Set(cleaned)).slice(0, 3)
}

async function maybeRunAI(c: any, userId: string, url: string, title: string | undefined, item?: any) {
  if (!c.env.AI) return null
  const current = item || await upsertBookmark(c.env.R2, userId, url, title)
  if (current?.aiCheckedAt) return { skipped: true, tags: current.aiTags || [] }
  const allowed = await canUseAI(c.env.KV, userId, c.env.AI_DAILY_CALL_LIMIT_GLOBAL, c.env.AI_DAILY_CALL_LIMIT_PER_USER)
  if (!allowed) return { skipped: true, reason: 'limit' }
  const aiTags = await classifyWithAI(c, url, title)
  await markAIUsage(c.env.KV, userId)
  const updated = await setAiTags(c.env.R2, userId, url, aiTags)
  await appendAiLog(c.env.KV, userId, { url, title: title || updated?.title || '', tags: updated?.aiTags || aiTags, at: Date.now() })
  return { tags: updated?.aiTags || aiTags }
}

app.post('/api/bookmarks/sync', async (c) => {
  try {
    const user = await getAuthUserFromRequest(c)
    if (!user) return c.json({ ok: false }, 401)
    const payload = await c.req.json()
    const t = payload?.type
    if (t === 'created') {
      const url = payload?.bookmark?.url
      const title = payload?.bookmark?.title
      if (url) {
        const item = await upsertBookmark(c.env.R2, user.id, url, title)
        await maybeRunAI(c, user.id, url, title, item)
      }
    } else if (t === 'changed') {
      const url = payload?.changeInfo?.url
      const title = payload?.changeInfo?.title
      if (url) {
        const item = await upsertBookmark(c.env.R2, user.id, url, title)
        await maybeRunAI(c, user.id, url, title, item)
      }
    } else if (t === 'removed') {
      const url = payload?.url || payload?.bookmark?.url
      if (url) await removeBookmark(c.env.R2, user.id, url)
    } else if (t === 'moved') {
    } else if (t === 'full') {
      const items = Array.isArray(payload?.items) ? payload.items : []
      for (const it of items) {
        const url = it?.url
        const title = it?.title
        if (url) {
          const item = await upsertBookmark(c.env.R2, user.id, url, title)
          await maybeRunAI(c, user.id, url, title, item)
        }
      }
    }
    return c.json({ ok: true })
  } catch {
    return c.json({ ok: false }, 400)
  }
})

app.get('/api/bookmarks/list', async (c) => {
  const user = await getAuthUserFromRequest(c)
  if (!user) return c.json({ ok: false }, 401)
  const items = await listBookmarks(c.env.R2, user.id)
  const statusMap = await loadStatus(c.env.R2, user.id)
  const itemsWithStatus = items.map(it => ({ ...it, status: statusMap[it.url]?.status || 'unknown', code: statusMap[it.url]?.code }))
  return c.json({ ok: true, items: itemsWithStatus })
})

app.post('/api/admin/create-user', async (c) => {
  const actor = await getAuthUserFromRequest(c)
  if (!requireAdmin(actor)) return c.json({ ok: false }, 403)
  const body = await c.req.json()
  const username = (body?.username || '').trim()
  const password = body?.password || ''
  const role = (body?.role || 'user').trim()
  if (!username || !password) return c.json({ ok: false, error: 'bad_request' }, 400)
  const exists = await getUser(c.env.KV, username)
  if (exists) return c.json({ ok: false, error: 'conflict' }, 409)
  const userId = randomId(16)
  const passwordHash = await hashPassword(password)
  await putUser(c.env.KV, username, { id: userId, username, passwordHash, role, createdAt: Date.now(), createdBy: actor.username })
  return c.json({ ok: true })
})

app.post('/api/links/check', async (c) => {
  const user = await getAuthUserFromRequest(c)
  if (!user) return c.json({ ok: false }, 401)
  const limit = Math.max(1, Math.min(50, Number(new URL(c.req.url).searchParams.get('limit') || 20)))
  const items = await listBookmarks(c.env.R2, user.id)
  let statusMap = await loadStatus(c.env.R2, user.id)
  const now = Date.now()
  const stale = items.filter(it => {
    const s = statusMap[it.url]
    return !s || (now - s.lastCheckedAt) > 24 * 3600 * 1000
  }).slice(0, limit)
  for (const it of stale) {
    const s = await checkUrl(it.url)
    statusMap[it.url] = s
  }
  await saveStatus(c.env.R2, user.id, statusMap)
  return c.json({ ok: true, checked: stale.length })
})

app.post('/api/ai/classify', async (c) => {
  const user = await getAuthUserFromRequest(c)
  if (!user) return c.json({ ok: false }, 401)
  const body = await c.req.json()
  const url = (body?.url || '').trim()
  const title = (body?.title || '').trim()
  if (!url) return c.json({ ok: false, error: 'bad_request' }, 400)
  const item = await upsertBookmark(c.env.R2, user.id, url, title || undefined)
  if (item?.aiCheckedAt) return c.json({ ok: true, skipped: true, tags: item.aiTags || [] })
  if (!c.env.AI) return c.json({ ok: false, error: 'ai_unavailable' }, 503)
  const allowed = await canUseAI(c.env.KV, user.id, c.env.AI_DAILY_CALL_LIMIT_GLOBAL, c.env.AI_DAILY_CALL_LIMIT_PER_USER)
  if (!allowed) return c.json({ ok: false, error: 'ai_limit' }, 429)
  const aiTags = await classifyWithAI(c, url, title || undefined)
  await markAIUsage(c.env.KV, user.id)
  const updated = await setAiTags(c.env.R2, user.id, url, aiTags)
  await appendAiLog(c.env.KV, user.id, { url, title: title || updated?.title || '', tags: updated?.aiTags || aiTags, at: Date.now() })
  return c.json({ ok: true, tags: updated?.aiTags || aiTags })
})

app.post('/api/bookmarks/tags', async (c) => {
  const user = await getAuthUserFromRequest(c)
  if (!user) return c.json({ ok: false }, 401)
  const body = await c.req.json()
  const url = (body?.url || '').trim()
  const tags = Array.isArray(body?.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : []
  if (!url) return c.json({ ok: false }, 400)
  const updated = await setManualTags(c.env.R2, user.id, url, tags)
  if (!updated) return c.json({ ok: false }, 404)
  return c.json({ ok: true })
})

app.get('/api/tags', async (c) => {
  const user = await getAuthUserFromRequest(c)
  if (!user) return c.json({ ok: false }, 401)
  const tags = await getUserTags(c.env.KV, user.id)
  return c.json({ ok: true, tags })
})

app.post('/api/tags', async (c) => {
  const user = await getAuthUserFromRequest(c)
  if (!user) return c.json({ ok: false }, 401)
  const body = await c.req.json()
  const incoming = Array.isArray(body?.tags) ? body.tags : []
  const seen = new Set<string>()
  const cleaned = incoming
    .map((t: any, idx: number) => {
      const name = String(t?.name || '').trim()
      const enabled = Boolean(t?.enabled)
      if (!name || seen.has(name)) return null
      seen.add(name)
      return { name, enabled, order: idx }
    })
    .filter(Boolean)
  await saveUserTags(c.env.KV, user.id, cleaned)
  return c.json({ ok: true })
})

app.get('/api/tags/candidates', async (c) => {
  const user = await getAuthUserFromRequest(c)
  if (!user) return c.json({ ok: false }, 401)
  const tags = await getUserTags(c.env.KV, user.id)
  const enabled = new Set(tags.filter((t: any) => t.enabled).map((t: any) => t.name))
  const candidates = (await getAiTagCandidates(c.env.R2, user.id)).filter((t) => !enabled.has(t))
  return c.json({ ok: true, tags: candidates })
})

app.get('/api/system/status', async (c) => {
  const user = await getAuthUserFromRequest(c)
  if (!user) return c.json({ ok: false }, 401)
  const stats = await getBookmarkStats(c.env.R2, user.id)
  const usage = await getUsageSummary(c.env.KV, user.id)
  const logs = await getAiLogs(c.env.KV, user.id)
  return c.json({
    ok: true,
    bookmarks: stats,
    ai: {
      enabled: Boolean(c.env.AI),
      limits: {
        global: c.env.AI_DAILY_CALL_LIMIT_GLOBAL,
        user: c.env.AI_DAILY_CALL_LIMIT_PER_USER
      },
      usage,
      logs
    }
  })
})

export default app
