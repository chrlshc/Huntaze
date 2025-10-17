import { getRedis } from '@/src/lib/redis'

const ZSET = 'insights:schedule:zset'

function randBetween(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min))
}

export function computeNextSeconds(ageHours: number) {
  if (ageHours < 72) return randBetween(600, 900) // 10–15 min
  if (ageHours < 24 * 14) return 3600 + randBetween(0, 900) // ~1h +/- 15m
  return 21600 + randBetween(0, 64800) // 6–24h
}

export async function scheduleMember(member: string, inSec: number) {
  const r = getRedis()
  const ts = Math.floor(Date.now() / 1000) + Math.max(0, inSec)
  await r.zadd(ZSET, String(ts), member)
}

export async function popDue(limit = 200): Promise<Array<{ member: string; score: number }>> {
  const r = getRedis()
  const now = Math.floor(Date.now() / 1000)
  const raw = (await r.zrangebyscore(ZSET, '-inf', String(now), 'WITHSCORES', 'LIMIT', 0, limit)) as unknown as string[]
  const pairs: Array<{ member: string; score: number }> = []
  for (let i = 0; i < raw.length; i += 2) {
    const member = raw[i]
    const score = Number(raw[i + 1])
    if (!member) continue
    // Try to claim by removing first
    const rem = await r.zrem(ZSET, member)
    if (rem) pairs.push({ member, score })
  }
  return pairs
}

export async function seedFromTrackedSets() {
  const r = getRedis()
  const ig = await r.smembers('ig:insights:track')
  const tt = await r.smembers('tiktok:insights:track')
  const now = Math.floor(Date.now() / 1000)
  const ops: Array<[string, number]> = []
  for (const id of ig || []) ops.push([`instagram:media:${id}`, now + randBetween(0, 300)])
  for (const id of tt || []) ops.push([`tiktok:video:${id}`, now + randBetween(0, 300)])
  if (ops.length) {
    const args: Array<string> = []
    for (const [member, score] of ops) args.push(String(score), member)
    await r.zadd(ZSET, ...args)
  }
  return { seeded: ops.length }
}
