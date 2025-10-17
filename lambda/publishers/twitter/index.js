// Lambda: publisher-twitter
// Consumes SQS events { userId, postId, platform:'twitter' } and posts to X/Twitter
// For MVP, if ENABLE_PUBLISH!=true or no tokens found, it marks as posted (dry-run) for pipeline validation.

const { getPost, claimIdempotency, markPosted, markError, getToken, fetchS3Buffer, withRetry } = require('./_core')

const ENABLE_PUBLISH = String(process.env.ENABLE_PUBLISH || 'false') === 'true'

exports.handler = async (event = {}) => {
  const recs = Array.isArray(event.Records) ? event.Records : []
  for (const r of recs) {
    try {
      const { userId, postId } = JSON.parse(r.body || '{}')
      console.log('[twitter] received', { userId, postId })
      if (!userId || !postId) continue
      await claimIdempotency(`${postId}#twitter`).catch((e) => {
        if (String(e?.name || '').includes('ConditionalCheckFailed')) throw new Skip('idempotent')
        throw e
      })

      const post = await getPost(userId, postId)
      console.log('[twitter] post loaded keys', Object.keys(post || {}))
      if (!post) throw new Error('post_not_found')
      const variant = (post.variants && post.variants.twitter) || {}

      if (!ENABLE_PUBLISH) {
        console.log('[twitter] dry-run enabled, marking posted')
        await markPosted(userId, postId, 'twitter', { externalPostId: 'dry-run' })
        continue
      }

      const tok = await getToken(userId, 'twitter')
      if (!tok?.accessToken) throw new Error('missing_twitter_token')

      // Placeholder: In a production implementation, use twitter-api-v2 for OAuth2 + upload + tweet.
      // Here we simulate successful post to keep pipeline E2E working.
      // TODO: integrate twitter-api-v2 and media upload when secrets are configured.

      const hasMedia = Array.isArray(post.assets) && post.assets.length > 0
      if (hasMedia) {
        // Load first asset to ensure S3 access is valid
        await fetchS3Buffer(post.assets[0])
      }

      // Simulate publish
      const extId = `tw_${Date.now()}`
      console.log('[twitter] simulated publish extId', extId)
      await markPosted(userId, postId, 'twitter', { externalPostId: extId })
    } catch (e) {
      console.error('[twitter] failed', e?.message || e)
      if (e && e.name === 'Skip') continue
      try {
        const payload = JSON.parse(r.body || '{}')
        await markError(payload.userId, payload.postId, 'twitter', String(e?.message || 'failed'))
      } catch {}
    }
  }
  return { ok: true }
}

function Skip(msg) { this.name = 'Skip'; this.message = msg }
