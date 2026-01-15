import type { KVNamespace } from '@cloudflare/workers-types'

function b64(arr: Uint8Array) {
  let s = ''
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
  return btoa(s)
}

function u8(s: string) {
  const arr = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i)
  return arr
}

function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u.length)
  new Uint8Array(ab).set(u)
  return ab
}

export async function hashPassword(password: string, salt?: Uint8Array, iterations = 100_000) {
  const enc = new TextEncoder()
  const pwKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const s = salt || crypto.getRandomValues(new Uint8Array(16))
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: toArrayBuffer(s), iterations }, pwKey, 256)
  const hash = new Uint8Array(bits)
  return `pbkdf2$sha256$${iterations}$${b64(s)}$${b64(hash)}`
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split('$')
  if (parts.length !== 5) return false
  const iterations = parseInt(parts[2], 10)
  const salt = Uint8Array.from(atob(parts[3]), c => c.charCodeAt(0))
  const expected = parts[4]
  const enc = new TextEncoder()
  const pwKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: toArrayBuffer(salt), iterations }, pwKey, 256)
  const hash = b64(new Uint8Array(bits))
  return hash === expected
}

export function randomId(bytes = 16) {
  const arr = crypto.getRandomValues(new Uint8Array(bytes))
  return b64(arr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function getUser(KV: KVNamespace, username: string) {
  const v = await KV.get(`users:${username}`)
  if (!v) return null
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

export async function putUser(KV: KVNamespace, username: string, data: any) {
  await KV.put(`users:${username}`, JSON.stringify(data))
}

export async function getSession(KV: KVNamespace, sid: string) {
  const v = await KV.get(`sessions:${sid}`)
  if (!v) return null
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

export async function putSession(KV: KVNamespace, sid: string, data: any, ttl: number) {
  await KV.put(`sessions:${sid}`, JSON.stringify(data), { expirationTtl: ttl })
}

export async function delSession(KV: KVNamespace, sid: string) {
  await KV.delete(`sessions:${sid}`)
}

export function parseCookies(header: string | null | undefined) {
  const out: Record<string, string> = {}
  if (!header) return out
  const parts = header.split(';')
  for (const p of parts) {
    const i = p.indexOf('=')
    if (i === -1) continue
    const k = p.slice(0, i).trim()
    const v = p.slice(i + 1).trim()
    out[k] = v
  }
  return out
}

export function makeCookie(name: string, value: string, maxAge: number) {
  const attrs = [`${name}=${value}`, `Path=/`, `HttpOnly`, `SameSite=Lax`]
  if (maxAge > 0) attrs.push(`Max-Age=${maxAge}`)
  return attrs.join('; ')
}
