import { observeMs, incCounter, emitMetric } from '../../../lib/metrics'
import { externalFetch } from '@/lib/services/external/http'
import { isExternalServiceError } from '@/lib/services/external/errors'

const FB = 'https://graph.facebook.com'
const VERSION = 'v21.0'

export type IgMediaInsights = { id: string; views?: number; reach?: number; saved?: number; engagement?: number }

export async function fetchIgMediaInsights(mediaId: string, pageAccessToken: string): Promise<IgMediaInsights | null> {
  const started = Date.now()
  const url = `${FB}/${VERSION}/${mediaId}/insights?metric=engagement,reach,saved,views&access_token=${encodeURIComponent(pageAccessToken)}`
  let res: Response | null = null
  let json: any = {}
  try {
    res = await externalFetch(url, {
      service: 'instagram',
      operation: 'insights.media',
      method: 'GET',
      cache: 'no-store',
      timeoutMs: 10_000,
      retry: { maxRetries: 1, retryMethods: ['GET'] },
    })
    json = await res.json().catch(() => ({} as any))
  } catch (error) {
    const elapsed = Date.now() - started
    observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'instagram', kind: 'media' })
    incCounter('social_insights_fetch_total', { platform: 'instagram', kind: 'media', status: 'exception' })
    if (isExternalServiceError(error) && error.code === 'RATE_LIMIT') {
      emitMetric('Hunt/Social', [{ name: 'social_insights_quota_hits_total', unit: 'Count', value: 1 }], { platform: 'instagram' })
    }
    return null
  }
  const elapsed = Date.now() - started
  observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'instagram', kind: 'media' })
  incCounter('social_insights_fetch_total', { platform: 'instagram', kind: 'media', status: res.ok ? 'ok' : 'error' })
  if (res.status === 429) emitMetric('Hunt/Social', [{ name: 'social_insights_quota_hits_total', unit: 'Count', value: 1 }], { platform: 'instagram' })
  const data: Array<{ name: string; values: Array<{ value: number }> }> = json?.data || []
  if (!Array.isArray(data)) return null
  const out: IgMediaInsights = { id: mediaId }
  for (const m of data) {
    const v = m?.values?.[0]?.value ?? 0
    if (m.name === 'views') out.views = v
    if (m.name === 'reach') out.reach = v
    if (m.name === 'saved') out.saved = v
    if (m.name === 'engagement') out.engagement = v
  }
  return out
}

export async function fetchIgUserInsights(igUserId: string, pageAccessToken: string) {
  const started = Date.now()
  const url = `${FB}/${VERSION}/${igUserId}/insights?metric=reach,profile_views,followers_count&period=day&access_token=${encodeURIComponent(pageAccessToken)}`
  let res: Response | null = null
  let json: any = {}
  try {
    res = await externalFetch(url, {
      service: 'instagram',
      operation: 'insights.user',
      method: 'GET',
      cache: 'no-store',
      timeoutMs: 10_000,
      retry: { maxRetries: 1, retryMethods: ['GET'] },
    })
    json = await res.json().catch(() => ({} as any))
  } catch (error) {
    const elapsed = Date.now() - started
    observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'instagram', kind: 'user' })
    incCounter('social_insights_fetch_total', { platform: 'instagram', kind: 'user', status: 'exception' })
    if (isExternalServiceError(error) && error.code === 'RATE_LIMIT') {
      emitMetric('Hunt/Social', [{ name: 'social_insights_quota_hits_total', unit: 'Count', value: 1 }], { platform: 'instagram' })
    }
    return null
  }
  const elapsed = Date.now() - started
  observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'instagram', kind: 'user' })
  incCounter('social_insights_fetch_total', { platform: 'instagram', kind: 'user', status: res.ok ? 'ok' : 'error' })
  if (res.status === 429) emitMetric('Hunt/Social', [{ name: 'social_insights_quota_hits_total', unit: 'Count', value: 1 }], { platform: 'instagram' })
  return json
}
