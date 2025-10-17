import { observeMs, incCounter } from '../../../lib/metrics'

type TweetPublicMetrics = {
  retweet_count: number
  reply_count: number
  like_count: number
  quote_count: number
}

type Tweet = { id: string; text?: string; public_metrics?: TweetPublicMetrics; created_at?: string }

export async function fetchTweetPublicMetrics(ids: string[], bearerToken: string) {
  if (!ids.length) return {}
  const started = Date.now()
  const url = `https://api.twitter.com/2/tweets?ids=${encodeURIComponent(ids.join(','))}&tweet.fields=public_metrics,created_at`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${bearerToken}` } })
  const json = await res.json().catch(() => ({} as any))
  const elapsed = Date.now() - started
  observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'twitter', kind: 'tweet' })
  incCounter('social_twitter_insights_fetch_total', { kind: 'tweet' })
  const items = (json?.data || []) as Tweet[]
  const out: Record<string, TweetPublicMetrics & { created_at?: string }> = {}
  if (Array.isArray(items) && items.length) {
    for (const t of items) {
      if (!t?.id) continue
      out[t.id] = { ...(t.public_metrics || { retweet_count: 0, reply_count: 0, like_count: 0, quote_count: 0 }), created_at: t.created_at }
    }
  } else {
    // Fallback: return zeros for requested ids (useful in fully mocked envs)
    for (const id of ids) {
      out[id] = { retweet_count: 0, reply_count: 0, like_count: 0, quote_count: 0 }
    }
  }
  return out
}

type UserPublicMetrics = {
  followers_count: number
  following_count: number
  tweet_count: number
  listed_count: number
}

export async function fetchUserPublicMetrics(userId: string, bearerToken: string) {
  const started = Date.now()
  const url = `https://api.twitter.com/2/users/${encodeURIComponent(userId)}?user.fields=public_metrics,created_at`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${bearerToken}` } })
  const json = await res.json().catch(() => ({} as any))
  const elapsed = Date.now() - started
  observeMs('social_insights_fetch_latency_ms', elapsed, { platform: 'twitter', kind: 'user' })
  incCounter('social_twitter_insights_fetch_total', { kind: 'user' })
  const m = json?.data?.public_metrics as UserPublicMetrics | undefined
  return m || { followers_count: 0, following_count: 0, tweet_count: 0, listed_count: 0 }
}
