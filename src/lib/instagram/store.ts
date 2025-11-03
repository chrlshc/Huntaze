import { getRedis } from '@/src/lib/redis'

const TTL = 30 * 24 * 60 * 60

export async function saveIgMediaSnapshot(id: string, snapshot: Record<string, unknown>, ts = Date.now()) {
  const r = getRedis()
  const hk = `ig:insights:media:${id}`
  const zk = `ig:insights:media:${id}:ts`
  await r.hset(hk, { ...Object.fromEntries(Object.entries(snapshot).map(([k, v]) => [k, String(v)])), updatedAt: String(ts) })
  await r.expire(hk, TTL)
  await r.zadd(zk, String(Math.floor(ts / 1000)), JSON.stringify({ ts, id, snapshot }))
  await r.expire(zk, TTL)
}

export async function saveIgUserDaily(igUserId: string, snapshot: Record<string, unknown>, ts = Date.now()) {
  const r = getRedis()
  const zk = `ig:insights:user:${igUserId}:ts`
  await r.zadd(zk, String(Math.floor(ts / 1000)), JSON.stringify({ ts, id: igUserId, snapshot }))
  await r.expire(zk, TTL)
}

