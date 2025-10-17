import Redis, { type Redis as RedisClient } from 'ioredis'

let _client: RedisClient | null = null

export function getRedis(): RedisClient {
  if (_client) return _client
  const url = process.env.REDIS_URL
  if (!url) throw new Error('REDIS_URL missing')
  _client = new Redis(url)
  _client.on('error', (e) => {
    try { console.error('Redis error', e?.message || e) } catch {}
  })
  return _client
}

