import { observeMs, incCounter, emitMetric } from '../../../lib/metrics'

const FB = 'https://graph.facebook.com'
const VERSION = 'v21.0'

export type IgMediaInsights = { id: string; views?: number; reach?: number; saved?: number; engagement?: number }

export async function fetchIgMediaInsights(mediaId: string, pageAccessToken: string): Promise<IgMediaInsights | null> {
  const started = Date.now()
  const url = `${FB}/${VERSION}/${mediaId}/insights?metric=engagement,reach,saved,views&access_token=${encodeURIComponent(pageAccessToken)}`
  const res = await fetch(url)
  const json = await res.json().catch(() => ({} as any))
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
  const res = await fetch(url)
  const json = await res.json().catch(() => ({} as any))
  const elapsed = Date.now() - started
  observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'instagram', kind: 'user' })
  incCounter('social_insights_fetch_total', { platform: 'instagram', kind: 'user', status: res.ok ? 'ok' : 'error' })
  if (res.status === 429) emitMetric('Hunt/Social', [{ name: 'social_insights_quota_hits_total', unit: 'Count', value: 1 }], { platform: 'instagram' })
  return json
}

