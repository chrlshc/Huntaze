import Redis, { type Redis as RedisClient } from 'ioredis'

let _client: RedisClient | null = null

export function getRedis(): RedisClient {
  if (_client) return _client
  const url = process.env.REDIS_URL
  if (!url) throw new Error('REDIS_URL missing')
  _client = new Redis(url, {
    // Avoid connecting during Next build; connection occurs lazily when commands are issued at runtime.
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
  })
  _client.on('error', (e) => {
    try { console.error('Redis error', e?.message || e) } catch {}
  })
  return _client
}
