import { observeMs, incCounter, emitMetric } from '../../../lib/metrics'
import { externalFetch } from '@/lib/services/external/http'
import { isExternalServiceError } from '@/lib/services/external/errors'

type TikTokVideo = {
  id: string
  create_time?: number
  like_count?: number
  comment_count?: number
  share_count?: number
  view_count?: number
}

type ListResponse = { data?: { videos?: TikTokVideo[]; cursor?: string; has_more?: boolean } }
type QueryResponse = { data?: { videos?: TikTokVideo[] } }
type UserInfoResponse = { data?: { open_id?: string; follower_count?: number; likes_count?: number; video_count?: number } }

const BASE = 'https://open.tiktokapis.com'

export async function tiktokVideoList(opts: { userAccessToken: string; cursor?: string; maxCount?: number; fields?: string[] }) {
  const started = Date.now()
  const url = `${BASE}/v2/video/list/` // POST
  const body: any = {
    fields: opts.fields ?? ['id', 'create_time', 'like_count', 'comment_count', 'share_count', 'view_count'],
    max_count: Math.min(Math.max(opts.maxCount ?? 20, 1), 20),
  }
  if (opts.cursor) body.cursor = opts.cursor
  let res: Response | null = null
  let json: ListResponse = {}
  try {
    res = await externalFetch(url, {
      service: 'tiktok',
      operation: 'video.list',
      method: 'POST',
      headers: { Authorization: `Bearer ${opts.userAccessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      timeoutMs: 12_000,
      retry: { maxRetries: 1, retryMethods: ['POST'] },
    })
    json = (await res.json().catch(() => ({}))) as ListResponse
  } catch (error) {
    const elapsed = Date.now() - started
    observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'tiktok', kind: 'media' })
    incCounter('social_insights_fetch_total', { platform: 'tiktok', kind: 'media', status: 'exception' })
    if (isExternalServiceError(error) && error.code === 'RATE_LIMIT') {
      emitMetric('Hunt/Social', [{ name: 'social_insights_quota_hits_total', unit: 'Count', value: 1 }], { platform: 'tiktok' })
    }
    return { items: [] as TikTokVideo[], cursor: undefined, hasMore: false }
  }
  const elapsed = Date.now() - started
  observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'tiktok', kind: 'media' })
  incCounter('social_insights_fetch_total', { platform: 'tiktok', kind: 'media', status: res.ok ? 'ok' : 'error' })
  if (res.status === 429) emitMetric('Hunt/Social', [{ name: 'social_insights_quota_hits_total', unit: 'Count', value: 1 }], { platform: 'tiktok' })
  const items = json?.data?.videos ?? []
  incCounter('social_insights_items_fetched_total', { platform: 'tiktok', kind: 'media' })
  return { items, cursor: json?.data?.cursor, hasMore: Boolean(json?.data?.has_more) }
}

export async function tiktokVideoQuery(opts: { userAccessToken: string; ids: string[]; fields?: string[] }) {
  const started = Date.now()
  if (!opts.ids.length) return { items: [] as TikTokVideo[] }
  const url = `${BASE}/v2/video/query/` // POST
  const body: any = {
    fields: opts.fields ?? ['id', 'create_time', 'like_count', 'comment_count', 'share_count', 'view_count'],
    filters: { video_ids: opts.ids.slice(0, 20) },
  }
  let res: Response | null = null
  let json: QueryResponse = {}
  try {
    res = await externalFetch(url, {
      service: 'tiktok',
      operation: 'video.query',
      method: 'POST',
      headers: { Authorization: `Bearer ${opts.userAccessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      timeoutMs: 12_000,
      retry: { maxRetries: 1, retryMethods: ['POST'] },
    })
    json = (await res.json().catch(() => ({}))) as QueryResponse
  } catch (error) {
    const elapsed = Date.now() - started
    observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'tiktok', kind: 'media' })
    incCounter('social_insights_fetch_total', { platform: 'tiktok', kind: 'media', status: 'exception' })
    if (isExternalServiceError(error) && error.code === 'RATE_LIMIT') {
      emitMetric('Hunt/Social', [{ name: 'social_insights_quota_hits_total', unit: 'Count', value: 1 }], { platform: 'tiktok' })
    }
    return { items: [] as TikTokVideo[] }
  }
  const elapsed = Date.now() - started
  observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'tiktok', kind: 'media' })
  incCounter('social_insights_fetch_total', { platform: 'tiktok', kind: 'media', status: res.ok ? 'ok' : 'error' })
  if (res.status === 429) emitMetric('Hunt/Social', [{ name: 'social_insights_quota_hits_total', unit: 'Count', value: 1 }], { platform: 'tiktok' })
  const items = json?.data?.videos ?? []
  incCounter('social_insights_items_fetched_total', { platform: 'tiktok', kind: 'media' })
  return { items }
}

export async function tiktokUserInfo(opts: { userAccessToken: string; fields?: string[] }) {
  const started = Date.now()
  const url = `${BASE}/v2/user/info/`
  const params = { fields: opts.fields ?? ['open_id', 'username', 'follower_count', 'likes_count', 'video_count'] }
  let res: Response | null = null
  let json: UserInfoResponse = {}
  try {
    res = await externalFetch(url + '?' + new URLSearchParams(params as any).toString(), {
      service: 'tiktok',
      operation: 'user.info',
      method: 'GET',
      headers: { Authorization: `Bearer ${opts.userAccessToken}` },
      cache: 'no-store',
      timeoutMs: 10_000,
      retry: { maxRetries: 1, retryMethods: ['GET'] },
    })
    json = (await res.json().catch(() => ({}))) as UserInfoResponse
  } catch (error) {
    const elapsed = Date.now() - started
    observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'tiktok', kind: 'user' })
    incCounter('social_insights_fetch_total', { platform: 'tiktok', kind: 'user', status: 'exception' })
    if (isExternalServiceError(error) && error.code === 'RATE_LIMIT') {
      emitMetric('Hunt/Social', [{ name: 'social_insights_quota_hits_total', unit: 'Count', value: 1 }], { platform: 'tiktok' })
    }
    return null
  }
  const elapsed = Date.now() - started
  observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'tiktok', kind: 'user' })
  incCounter('social_insights_fetch_total', { platform: 'tiktok', kind: 'user', status: res.ok ? 'ok' : 'error' })
  if (res.status === 429) emitMetric('Hunt/Social', [{ name: 'social_insights_quota_hits_total', unit: 'Count', value: 1 }], { platform: 'tiktok' })
  return json?.data || null
}

export type NormalizedVideoMetrics = {
  id: string
  views: number
  likes: number
  comments: number
  shares: number
  sampled_at: number
}

export function normalizeTikTokVideo(v: TikTokVideo): NormalizedVideoMetrics {
  return {
    id: v.id,
    views: v.view_count ?? 0,
    likes: v.like_count ?? 0,
    comments: v.comment_count ?? 0,
    shares: v.share_count ?? 0,
    sampled_at: Date.now(),
  }
}
