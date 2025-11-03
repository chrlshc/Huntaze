import { getRedis } from '@/src/lib/redis'

const TTL = 30 * 24 * 60 * 60 // 30d

export async function saveTikTokVideoSnapshot(v: { id: string } & Record<string, unknown>, ts = Date.now()) {
  const r = getRedis()
  const hk = `tiktok:insights:video:${v.id}`
  const zk = `tiktok:insights:video:${v.id}:ts`
  await r.hset(hk, { ...Object.fromEntries(Object.entries(v).map(([k, val]) => [k, String(val)])), updatedAt: String(ts) })
  await r.expire(hk, TTL)
  await r.zadd(zk, String(Math.floor(ts / 1000)), JSON.stringify({ ts, ...v }))
  await r.expire(zk, TTL)
}

export async function getTikTokInsightsCursor() {
  const r = getRedis()
  return (await r.get('tiktok:insights:cursor')) || null
}

export async function setTikTokInsightsCursor(cursor: string) {
  const r = getRedis()
  await r.set('tiktok:insights:cursor', cursor)
}

