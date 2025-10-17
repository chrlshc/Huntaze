// Lambda: publisher-reddit
// Dry-run by default; integrates /api/submit for self/link when ENABLE_PUBLISH=true
const { getPost, claimIdempotency, markPosted, markError, getToken, withRetry } = require('./_core')

const ENABLE_PUBLISH = String(process.env.ENABLE_PUBLISH || 'false') === 'true'

exports.handler = async (event = {}) => {
  const recs = Array.isArray(event.Records) ? event.Records : []
  for (const r of recs) {
    const payload = JSON.parse(r.body || '{}')
    const { userId, postId } = payload
    try {
      if (!userId || !postId) continue
      await claimIdempotency(`${postId}#reddit`).catch((e) => {
        if (String(e?.name || '').includes('ConditionalCheckFailed')) throw new Skip('idempotent')
        throw e
      })
      const post = await getPost(userId, postId)
      if (!post) throw new Error('post_not_found')

      if (!ENABLE_PUBLISH) {
        await markPosted(userId, postId, 'reddit', { externalPostId: `dryrun:${Date.now()}` })
        continue
      }
      const tok = await getToken(userId, 'reddit')
      if (!tok?.accessToken) throw new Error('missing_reddit_token')

      const variant = post.variants?.reddit || {}
      const subreddit = variant.subreddit || process.env.REDDIT_DEFAULT_SR || ''
      const title = (variant.title || post.variants?.instagram?.text || 'Huntaze post').slice(0, 300)
      const isLink = !!variant.url
      if (!subreddit) throw new Error('missing_subreddit')

      const form = new URLSearchParams({ api_type: 'json', sr: subreddit, kind: isLink ? 'link' : 'self', title })
      if (isLink) form.append('url', variant.url)
      else form.append('text', variant.text || title)

      const res = await withRetry(() => fetch('https://oauth.reddit.com/api/submit', {
        method: 'POST',
        headers: { 'Authorization': `bearer ${tok.accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Huntaze/1.0' },
        body: form
      }))
      const json = await res.json()
      if (!res.ok || (json?.json?.errors && json.json.errors.length)) throw new Error(`reddit_submit_failed:${res.status}:${JSON.stringify(json)}`)
      const name = json?.json?.data?.name || `rd_${Date.now()}`
      await markPosted(userId, postId, 'reddit', { externalPostId: name })
    } catch (e) {
      if (e && e.name === 'Skip') continue
      try { await markError(userId, postId, 'reddit', String(e?.message || 'failed')) } catch {}
    }
  }
  return { ok: true }
}

function Skip(msg) { this.name = 'Skip'; this.message = msg }
