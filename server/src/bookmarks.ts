import type { R2Bucket } from '@cloudflare/workers-types'

export type BookmarkItem = {
  url: string
  title?: string
  tags?: string[]
  aiTags?: string[]
  aiCheckedAt?: number
  createdAt: number
  updatedAt: number
}

export type BookmarkIndex = {
  items: Record<string, BookmarkItem>
  deleted?: Record<string, number>
  updatedAt: number
}

const UTM_PARAMS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id','utm_name','utm_creative_format','utm_marketing_tactic','gclid','fbclid']

export function normalizeUrl(input: string) {
  let u: URL
  try {
    u = new URL(input)
  } catch {
    return input.trim()
  }
  u.hostname = u.hostname.toLowerCase()
  UTM_PARAMS.forEach(p => u.searchParams.delete(p))
  const search = u.searchParams.toString()
  u.search = search ? `?${search}` : ''
  let s = u.toString()
  if (s.endsWith('/') && u.pathname === '/' && !search) s = s.slice(0, -1)
  return s
}

function ruleTagsFor(url: string, title?: string): string[] {
  let host = ''
  try { host = new URL(url).hostname.toLowerCase() } catch {}
  const tags = new Set<string>()
  if (host.includes('github.com')) tags.add('开发')
  if (host.includes('gitlab.com')) tags.add('开发')
  if (host.includes('npmjs.com') || host.includes('deno.land')) tags.add('包管理')
  if (host.includes('stack') || host.includes('stackoverflow.com')) tags.add('问答')
  if (host.includes('youtube.com') || host.includes('bilibili.com')) tags.add('视频')
  if (host.includes('docs') || host.startsWith('doc') || host.includes('developer')) tags.add('文档')
  if (host.includes('medium.com')) tags.add('阅读')
  if (host.includes('google.com') || host.endsWith('.google.com')) tags.add('搜索')
  if (host.includes('cloudflare.com')) tags.add('云服务')
  if (host.includes('openai.com')) tags.add('AI')
  if (host.includes('apple.com')) tags.add('苹果')
  if (title) {
    const t = title.toLowerCase()
    if (t.includes('api') || t.includes('sdk')) tags.add('接口')
    if (t.includes('guide') || t.includes('指南') || t.includes('手册')) tags.add('指南')
  }
  return Array.from(tags)
}

async function readJson(bucket: R2Bucket, key: string) {
  const obj: any = await bucket.get(key)
  if (!obj) return null
  try {
    return await obj.json()
  } catch {
    const ab = await obj.arrayBuffer()
    const txt = new TextDecoder().decode(ab)
    return JSON.parse(txt)
  }
}

async function writeJson(bucket: R2Bucket, key: string, data: any) {
  await bucket.put(key, JSON.stringify(data))
}

export async function loadIndex(bucket: R2Bucket, userId: string) {
  const key = `user/${userId}/bookmarks_index.json`
  const data = await readJson(bucket, key)
  if (!data) return { items: {}, deleted: {}, updatedAt: Date.now() } as BookmarkIndex
  const idx = data as BookmarkIndex
  if (!idx.deleted) idx.deleted = {}
  return idx
}

export async function saveIndex(bucket: R2Bucket, userId: string, idx: BookmarkIndex) {
  const key = `user/${userId}/bookmarks_index.json`
  idx.updatedAt = Date.now()
  await writeJson(bucket, key, idx)
}

export async function upsertBookmark(bucket: R2Bucket, userId: string, url: string, title?: string, tags?: string[]) {
  const idx = await loadIndex(bucket, userId)
  const key = normalizeUrl(url)
  const now = Date.now()
  if (idx.deleted && idx.deleted[key]) delete idx.deleted[key]
  const existing = idx.items[key]
  if (existing) {
    const mergedTags = Array.from(new Set([...(existing.tags || []), ...(tags || []), ...ruleTagsFor(key, title || existing.title)]))
    idx.items[key] = { ...existing, title: title || existing.title, tags: mergedTags, updatedAt: now }
  } else {
    const rt = ruleTagsFor(key, title)
    idx.items[key] = { url: key, title, tags: Array.from(new Set([...(tags || []), ...rt])), createdAt: now, updatedAt: now }
  }
  await saveIndex(bucket, userId, idx)
  return idx.items[key]
}

function pruneDeletedMap(deleted: Record<string, number>, maxEntries = 5000) {
  const entries = Object.entries(deleted)
  if (entries.length <= maxEntries) return deleted
  entries.sort((a, b) => (b[1] || 0) - (a[1] || 0))
  const out: Record<string, number> = {}
  for (const [url, at] of entries.slice(0, maxEntries)) out[url] = at
  return out
}

export async function removeBookmark(bucket: R2Bucket, userId: string, url: string) {
  const idx = await loadIndex(bucket, userId)
  const key = normalizeUrl(url)
  if (idx.items[key]) delete idx.items[key]
  idx.deleted = idx.deleted || {}
  idx.deleted[key] = Date.now()
  idx.deleted = pruneDeletedMap(idx.deleted)
  await saveIndex(bucket, userId, idx)
}

export async function listBookmarks(bucket: R2Bucket, userId: string) {
  const idx = await loadIndex(bucket, userId)
  const arr = Object.values(idx.items).map((it) => {
    const mergedTags = Array.from(new Set([...(it.tags || []), ...(it.aiTags || [])]))
    return { ...it, tags: mergedTags, manualTags: it.tags || [] }
  })
  arr.sort((a, b) => b.updatedAt - a.updatedAt)
  return arr
}

export async function getDeletedMap(bucket: R2Bucket, userId: string) {
  const idx = await loadIndex(bucket, userId)
  return idx.deleted || {}
}

export async function listDeletedBookmarks(bucket: R2Bucket, userId: string) {
  const idx = await loadIndex(bucket, userId)
  const deleted = idx.deleted || {}
  const arr = Object.entries(deleted).map(([url, deletedAt]) => ({ url, deletedAt }))
  arr.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))
  return arr
}

export async function setAiTags(bucket: R2Bucket, userId: string, url: string, aiTags: string[]) {
  const idx = await loadIndex(bucket, userId)
  const key = normalizeUrl(url)
  const item = idx.items[key]
  if (!item) return null
  const mergedTags = Array.from(new Set([...(item.tags || []), ...(aiTags || [])]))
  idx.items[key] = { ...item, tags: mergedTags, aiTags: aiTags || [], aiCheckedAt: Date.now(), updatedAt: Date.now() }
  await saveIndex(bucket, userId, idx)
  return idx.items[key]
}

export async function getAiTagCandidates(bucket: R2Bucket, userId: string) {
  const idx = await loadIndex(bucket, userId)
  const set = new Set<string>()
  Object.values(idx.items).forEach((it) => {
    ;(it.aiTags || []).forEach((t) => set.add(t))
  })
  return Array.from(set)
}

export async function setManualTags(bucket: R2Bucket, userId: string, url: string, tags: string[]) {
  const idx = await loadIndex(bucket, userId)
  const key = normalizeUrl(url)
  const item = idx.items[key]
  if (!item) return null
  idx.items[key] = { ...item, tags, updatedAt: Date.now() }
  await saveIndex(bucket, userId, idx)
  return idx.items[key]
}

export async function getBookmarkStats(bucket: R2Bucket, userId: string) {
  const idx = await loadIndex(bucket, userId)
  const items = Object.values(idx.items)
  const total = items.length
  const aiTagged = items.filter((it) => it.aiCheckedAt).length
  const lastAiAt = items.reduce((max, it) => {
    const t = it.aiCheckedAt || 0
    return t > max ? t : max
  }, 0)
  return {
    total,
    aiTagged,
    lastAiAt: lastAiAt || null,
    updatedAt: idx.updatedAt
  }
}
