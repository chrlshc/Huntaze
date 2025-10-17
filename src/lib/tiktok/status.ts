import { observeMs, incCounter } from '../../../lib/metrics'

export type TikTokStatus = 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED'

export type TikTokStatusResponse = {
  data?: {
    status?: string
    error_code?: number
    error_msg?: string
    video_id?: string
    publish_id?: string
  }
}

export async function fetchTikTokStatus(opts: { video_id: string; userAccessToken: string }) {
  const started = Date.now()
  const url = `https://open.tiktokapis.com/v2/post/publish/status/fetch?video_id=${encodeURIComponent(opts.video_id)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${opts.userAccessToken}` } })
  const json = (await res.json().catch(() => ({}))) as TikTokStatusResponse
  const elapsed = Date.now() - started
  observeMs('social_status_poll_latency_ms', elapsed, { platform: 'tiktok' })
  incCounter('social_tiktok_status_fetch_total', { status: res.status })

  // Map API response to simplified status
  const apistatus = json?.data?.status?.toUpperCase?.() || ''
  let status: TikTokStatus = 'PENDING'
  if (apistatus.includes('FAILED')) status = 'FAILED'
  else if (apistatus.includes('PUBLISH') || apistatus.includes('SUCCESS')) status = 'PUBLISHED'
  else if (apistatus.includes('PROCESS')) status = 'PROCESSING'
  else status = 'PENDING'

  return { status, raw: json }
}

