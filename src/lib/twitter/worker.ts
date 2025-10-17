import { fetchTweetPublicMetrics, fetchUserPublicMetrics } from '@/src/lib/integration/twitter'
import { listTrackedTweetIds, saveTweetMetricsSnapshot } from '@/src/lib/twitter/store'
import { incCounter } from '@/lib/metrics'

export async function processTwitterInsights() {
  const bearer = process.env.TWITTER_BEARER_TOKEN || ''
  if (!bearer) return { processed: 0, tweets: 0, user: false }

  const ids = await listTrackedTweetIds()
  const tweetMap = await fetchTweetPublicMetrics(ids, bearer)
  for (const id of Object.keys(tweetMap)) {
    await saveTweetMetricsSnapshot(id, tweetMap[id])
  }

  let user = false
  if (process.env.TWITTER_USER_ID) {
    const m = await fetchUserPublicMetrics(process.env.TWITTER_USER_ID, bearer)
    if (m) {
      user = true
      incCounter('social_twitter_insights_fetch_total', { kind: 'user' })
    }
  }

  return { processed: Object.keys(tweetMap).length + (user ? 1 : 0), tweets: Object.keys(tweetMap).length, user }
}

