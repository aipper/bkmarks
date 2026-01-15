import type { R2Bucket } from '@cloudflare/workers-types'

export type BookmarkItem = {
  url: string
  title?: string
  tags?: string[]
  createdAt: number
  updatedAt: number
}

export type BookmarkIndex = {
  items: Record<string, BookmarkItem>
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
  if (!data) return { items: {}, updatedAt: Date.now() } as BookmarkIndex
  return data as BookmarkIndex
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
  const existing = idx.items[key]
  if (existing) {
    const mergedTags = Array.from(new Set([...(existing.tags || []), ...(tags || []), ...ruleTagsFor(key, title || existing.title)]))
    idx.items[key] = { ...existing, title: title || existing.title, tags: mergedTags, updatedAt: now }
  } else {
    const rt = ruleTagsFor(key, title)
    idx.items[key] = { url: key, title, tags: Array.from(new Set([...(tags || []), ...rt])), createdAt: now, updatedAt: now }
  }
  await saveIndex(bucket, userId, idx)
}

export async function removeBookmark(bucket: R2Bucket, userId: string, url: string) {
  const idx = await loadIndex(bucket, userId)
  const key = normalizeUrl(url)
  if (idx.items[key]) {
    delete idx.items[key]
    await saveIndex(bucket, userId, idx)
  }
}

export async function listBookmarks(bucket: R2Bucket, userId: string) {
  const idx = await loadIndex(bucket, userId)
  const arr = Object.values(idx.items)
  arr.sort((a, b) => b.updatedAt - a.updatedAt)
  return arr
}
