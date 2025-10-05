import { toFriendlyError } from '@/lib/ui/friendlyError'

export async function fetchJson(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {})
  if (!headers.has('x-request-id') && 'crypto' in globalThis) {
    // @ts-expect-error runtime guard for older environments
    const rid = (globalThis.crypto as any)?.randomUUID?.() ?? String(Date.now())
    headers.set('x-request-id', rid)
  }

  const res = await fetch(input, { ...init, headers })
  let data: any = null
  try {
    data = await res.clone().json()
  } catch {
    // ignore
  }

  if (!res.ok) {
    const fe = toFriendlyError(res, data)
    const err = new Error(fe.title)
    ;(err as any).friendly = fe
    throw err
  }
  return data
}

