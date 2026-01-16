import { Hono } from 'hono'
import type { KVNamespace, R2Bucket } from '@cloudflare/workers-types'
import { hashPassword, verifyPassword, randomId, getUser, putUser, getSession, putSession, delSession, parseCookies, makeCookie } from './auth'
import { upsertBookmark, removeBookmark, listBookmarks } from './bookmarks'
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
    ai_enabled: true,
    limits: {
      global: c.env.AI_DAILY_CALL_LIMIT_GLOBAL,
      user: c.env.AI_DAILY_CALL_LIMIT_PER_USER
    }
  })
})

app.get('/app', (c) => {
  return c.newResponse(html(), 200, { 'content-type': 'text/html; charset=utf-8' })
})

app.get('/static/app.css', (c) => {
  return c.newResponse(css(), 200, { 'content-type': 'text/css; charset=utf-8' })
})

app.get('/static/app.js', (c) => {
  return c.newResponse(js(), 200, { 'content-type': 'application/javascript; charset=utf-8' })
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

app.post('/api/bookmarks/sync', async (c) => {
  try {
    const user = await getAuthUserFromRequest(c)
    if (!user) return c.json({ ok: false }, 401)
    const payload = await c.req.json()
    const t = payload?.type
    if (t === 'created') {
      const url = payload?.bookmark?.url
      const title = payload?.bookmark?.title
      if (url) await upsertBookmark(c.env.R2, user.id, url, title)
    } else if (t === 'changed') {
      const url = payload?.changeInfo?.url
      const title = payload?.changeInfo?.title
      if (url) await upsertBookmark(c.env.R2, user.id, url, title)
    } else if (t === 'removed') {
      const url = payload?.url || payload?.bookmark?.url
      if (url) await removeBookmark(c.env.R2, user.id, url)
    } else if (t === 'moved') {
    } else if (t === 'full') {
      const items = Array.isArray(payload?.items) ? payload.items : []
      for (const it of items) {
        const url = it?.url
        const title = it?.title
        if (url) await upsertBookmark(c.env.R2, user.id, url, title)
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

export default app
