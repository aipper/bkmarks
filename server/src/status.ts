import type { R2Bucket } from '@cloudflare/workers-types'
import { normalizeUrl } from './bookmarks'

export type LinkStatus = {
  status: 'ok' | 'redirect' | 'client_error' | 'server_error' | 'timeout' | 'unknown'
  code?: number
  lastCheckedAt: number
}

export type LinkStatusMap = Record<string, LinkStatus>

async function readJson(bucket: R2Bucket, key: string) {
  const obj: any = await bucket.get(key)
  if (!obj) return null
  try { return await obj.json() } catch {
    const ab = await obj.arrayBuffer()
    const txt = new TextDecoder().decode(ab)
    return JSON.parse(txt)
  }
}

async function writeJson(bucket: R2Bucket, key: string, data: any) {
  await bucket.put(key, JSON.stringify(data))
}

export async function loadStatus(bucket: R2Bucket, userId: string): Promise<LinkStatusMap> {
  const key = `user/${userId}/bookmarks_status.json`
  return (await readJson(bucket, key)) || {}
}

export async function saveStatus(bucket: R2Bucket, userId: string, map: LinkStatusMap) {
  const key = `user/${userId}/bookmarks_status.json`
  await writeJson(bucket, key, map)
}

function classify(code: number): LinkStatus['status'] {
  if (code >= 200 && code < 300) return 'ok'
  if (code >= 300 && code < 400) return 'redirect'
  if (code >= 400 && code < 500) return 'client_error'
  if (code >= 500 && code < 600) return 'server_error'
  return 'unknown'
}

export async function checkUrl(url: string): Promise<LinkStatus> {
  const norm = normalizeUrl(url)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const r = await fetch(norm, { method: 'HEAD', redirect: 'follow', signal: controller.signal })
    clearTimeout(timer)
    const code = r.status
    return { status: classify(code), code, lastCheckedAt: Date.now() }
  } catch {
    try {
      const r2 = await fetch(norm, { method: 'GET', redirect: 'follow' })
      const code = r2.status
      return { status: classify(code), code, lastCheckedAt: Date.now() }
    } catch {
      return { status: 'timeout', lastCheckedAt: Date.now() }
    }
  }
}
