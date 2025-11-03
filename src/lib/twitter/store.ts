import { getRedis } from '@/src/lib/redis'

const SNAPSHOT_TTL = 30 * 24 * 60 * 60 // 30d

export async function listTrackedTweetIds(): Promise<string[]> {
  const set = getRedis()
  const ids = await set.smembers('twitter:insights:track')
  if (ids?.length) return ids
  const env = (process.env.TWITTER_TRACK_TWEET_IDS || '').split(',').map((s) => s.trim()).filter(Boolean)
  return env
}

export async function trackTweetId(id: string) {
  const r = getRedis()
  await r.sadd('twitter:insights:track', id)
}

export async function untrackTweetId(id: string) {
  const r = getRedis()
  await r.srem('twitter:insights:track', id)
}

export async function saveTweetMetricsSnapshot(id: string, snapshot: Record<string, unknown>, tsMs = Date.now()) {
  const r = getRedis()
  const hashKey = `twitter:insights:tweet:${id}`
  const zsetKey = `twitter:insights:tweet:${id}:hist`
  await r.hset(hashKey, { ...Object.fromEntries(Object.entries(snapshot).map(([k, v]) => [k, String(v)])), updatedAt: String(tsMs) })
  await r.expire(hashKey, SNAPSHOT_TTL)
  await r.zadd(zsetKey, String(tsMs), JSON.stringify({ tsMs, id, snapshot }))
  await r.expire(zsetKey, SNAPSHOT_TTL)
}

