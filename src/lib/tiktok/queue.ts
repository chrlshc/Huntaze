import Redis from 'ioredis'
import { incCounter } from '../../../lib/metrics'

// Redis keys
const ZSET_DUE = 'tiktok:poll:zset' // score: next_poll_at (ms), member: video_id
const JOB_PREFIX = 'tiktok:job:' // hash per video_id

export type JobState = 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED'

export type TikTokJob = {
  videoId: string
  userAccessToken: string
  state: JobState
  attempts: number
  lastPollAt?: number
  nextPollAt?: number
  errorCode?: number
  errorMsg?: string
  publishedAt?: number
  accountId?: string
  postId?: string
  createdAt: number
  updatedAt: number
}

function client(): Redis {
  const url = process.env.REDIS_URL!
  return new Redis(url)
}

function jobKey(videoId: string) {
  return JOB_PREFIX + videoId
}

export async function enqueueTikTokStatusPoll(params: {
  videoId: string
  userAccessToken: string
  delaySec?: number
  accountId?: string
  postId?: string
}) {
  const redis = client()
  try {
    const now = Date.now()
    const next = now + Math.max(0, Math.floor((params.delaySec ?? 30) * 1000))
    const key = jobKey(params.videoId)
    const exists = await redis.exists(key)
    if (!exists) {
      await redis.hset(key, {
        videoId: params.videoId,
        userAccessToken: params.userAccessToken,
        state: 'PENDING',
        attempts: '0',
        createdAt: String(now),
        updatedAt: String(now),
        accountId: params.accountId ?? '',
        postId: params.postId ?? '',
      })
    }
    await redis.hset(key, { nextPollAt: String(next) })
    await redis.zadd(ZSET_DUE, String(next), params.videoId)
    incCounter('social_publish_inflight', { platform: 'tiktok' })
  } finally {
    redis.disconnect()
  }
}

export async function getTikTokJob(videoId: string): Promise<TikTokJob | null> {
  const redis = client()
  try {
    const key = jobKey(videoId)
    const obj = await redis.hgetall(key)
    if (!obj || Object.keys(obj).length === 0) return null
    return {
      videoId: obj.videoId,
      userAccessToken: obj.userAccessToken,
      state: (obj.state as JobState) || 'PENDING',
      attempts: Number(obj.attempts || '0'),
      lastPollAt: obj.lastPollAt ? Number(obj.lastPollAt) : undefined,
      nextPollAt: obj.nextPollAt ? Number(obj.nextPollAt) : undefined,
      errorCode: obj.errorCode ? Number(obj.errorCode) : undefined,
      errorMsg: obj.errorMsg,
      publishedAt: obj.publishedAt ? Number(obj.publishedAt) : undefined,
      accountId: obj.accountId,
      postId: obj.postId,
      createdAt: Number(obj.createdAt || Date.now()),
      updatedAt: Number(obj.updatedAt || Date.now()),
    }
  } finally {
    redis.disconnect()
  }
}

export async function updateTikTokJob(videoId: string, patch: Partial<TikTokJob>) {
  const redis = client()
  try {
    const key = jobKey(videoId)
    const now = Date.now()
    const map: Record<string, string> = { updatedAt: String(now) }
    for (const [k, v] of Object.entries(patch)) {
      if (typeof v === 'undefined') continue
      map[k] = String(v)
    }
    await redis.hset(key, map)
  } finally {
    redis.disconnect()
  }
}

export async function popDueTikTokJobs(limit = 50): Promise<string[]> {
  const redis = client()
  try {
    const now = Date.now()
    const ids = await redis.zrangebyscore(ZSET_DUE, 0, now, 'LIMIT', 0, limit)
    if (ids.length) {
      await redis.zrem(ZSET_DUE, ...ids)
    }
    return ids
  } finally {
    redis.disconnect()
  }
}
