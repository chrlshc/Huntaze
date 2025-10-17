import { fetchIgMediaInsights, fetchIgUserInsights } from '@/src/lib/instagram/insights'
import { saveIgMediaSnapshot, saveIgUserDaily } from '@/src/lib/instagram/store'
import { incCounter } from '@/lib/metrics'

export async function processInstagramInsights() {
  const token = process.env.IG_PAGE_TOKEN || ''
  const igUserId = process.env.IG_USER_ID || ''
  if (!token) return { processed: 0 }

  // Media: from tracked env (comma-separated)
  const mediaIds = (process.env.IG_TRACK_MEDIA_IDS || '').split(',').map((s) => s.trim()).filter(Boolean)
  let processed = 0
  for (const id of mediaIds) {
    const m = await fetchIgMediaInsights(id, token)
    if (m) {
      await saveIgMediaSnapshot(id, m)
      processed++
    }
  }
  if (igUserId) {
    const u = await fetchIgUserInsights(igUserId, token)
    if (u) await saveIgUserDaily(igUserId, u)
  }
  incCounter('social_insights_items_fetched_total', { platform: 'instagram', kind: 'media' })
  return { processed }
}

