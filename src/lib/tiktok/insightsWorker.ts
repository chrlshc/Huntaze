import { tiktokUserInfo, tiktokVideoList, tiktokVideoQuery, normalizeTikTokVideo } from '@/src/lib/tiktok/insights'
import { getTikTokInsightsCursor, setTikTokInsightsCursor, saveTikTokVideoSnapshot } from '@/src/lib/tiktok/insightsStore'
import { incCounter } from '@/lib/metrics'

export async function processTiktokInsights() {
  const token = process.env.TT_USER_TOKEN || ''
  if (!token) return { processed: 0, nextCursor: null }

  // Fetch user info (optional)
  await tiktokUserInfo({ userAccessToken: token })

  // List recent videos (page size <=20)
  const prevCursor = await getTikTokInsightsCursor()
  const { items, cursor, hasMore } = await tiktokVideoList({ userAccessToken: token, cursor: prevCursor || undefined, maxCount: 20 })
  const ids = items.map((v) => v.id)
  if (ids.length) {
    const q = await tiktokVideoQuery({ userAccessToken: token, ids })
    for (const v of q.items) {
      const n = normalizeTikTokVideo(v)
      await saveTikTokVideoSnapshot(n)
    }
  }
  if (cursor) await setTikTokInsightsCursor(cursor)
  incCounter('social_insights_items_fetched_total', { platform: 'tiktok', kind: 'media' })
  return { processed: ids.length, nextCursor: cursor, hasMore }
}

