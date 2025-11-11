import Redis from 'ioredis'
import { JobState } from './queue'

const EVENTS_TTL_SECONDS = 30 * 24 * 60 * 60 // 30d
const JOB_TTL_AFTER_TERMINAL_SECONDS = 7 * 24 * 60 * 60 // 7d

function client(): Redis {
  const url = process.env.REDIS_URL!
  return new Redis(url)
}

export type TikTokTerminal = 'PUBLISHED' | 'FAILED'

export async function addEvent(videoId: string, type: string, tsMs: number, payload?: unknown) {
  const redis = client()
  try {
    const entryObj = { videoId, type, tsMs, payload }
    const entry = JSON.stringify(entryObj)
    const timelineKey = `tiktok:events:${videoId}`
    await redis.zadd(timelineKey, String(tsMs), entry)
    await redis.expire(timelineKey, EVENTS_TTL_SECONDS)
    // Optional global by-type timeline for coarse dashboards
    const coarseKey = `tiktok:events:by-type:${type}`
    await redis.zadd(coarseKey, String(tsMs), videoId)
    await redis.expire(coarseKey, EVENTS_TTL_SECONDS)
    // Global by-time timeline for quick queries
    const globalKey = 'tiktok:events:by-time'
    await redis.zadd(globalKey, String(tsMs), JSON.stringify(entryObj))
    await redis.expire(globalKey, EVENTS_TTL_SECONDS)
  } finally {
    redis.disconnect()
  }
}

export async function getEvents(videoId: string, fromMs: number, toMs: number) {
  const redis = client()
  try {
    const timelineKey = `tiktok:events:${videoId}`
    const raw = await redis.zrangebyscore(timelineKey, fromMs, toMs)
    return raw.map((r) => {
      try { return JSON.parse(r) } catch { return { type: 'unknown', tsMs: 0 } }
    }) as Array<{ type: string; tsMs: number; payload?: unknown }>
  } finally {
    redis.disconnect()
  }
}

export async function setTerminal(videoId: string, state: TikTokTerminal, tsMs: number) {
  const redis = client()
  try {
    const key = `tiktok:job:${videoId}`
    // Read current
    const h = await redis.hgetall(key)
    const prevState = (h?.state as JobState) || 'PENDING'
    // Only advance if new state is terminal and higher priority
    const order: Record<JobState, number> = { PENDING: 0, PROCESSING: 1, PUBLISHED: 2, FAILED: 2 }
    if (order[state] >= order[prevState]) {
      const patch: Record<string, string> = { state }
      if (state === 'PUBLISHED') patch['publishedAt'] = String(tsMs)
      if (state === 'FAILED') patch['failedAt'] = String(tsMs)
      patch['updatedAt'] = String(Date.now())
      await redis.hset(key, patch)
      await redis.expire(key, JOB_TTL_AFTER_TERMINAL_SECONDS)
    }
  } finally {
    redis.disconnect()
  }
}
