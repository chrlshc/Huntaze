// Lambda: publisher-instagram
// Consumes SQS events { userId, postId, platform:'instagram' } and publishes via IG Graph API container->publish.
// MVP: if ENABLE_PUBLISH!=true or tokens missing, mark posted (dry-run) to validate pipeline.

const { getPost, claimIdempotency, markPosted, markError, getToken, withRetry } = require('./_core')

const ENABLE_PUBLISH = String(process.env.ENABLE_PUBLISH || 'false') === 'true'
const { presignGetUrl } = require('./helpers.s3')

async function fetchJson(url, init) {
  const resp = await fetch(url, init)
  if (!resp.ok) throw new Error(`http_${resp.status}`)
  return resp.json()
}

async function waitUntil(fn, { timeoutMs = 180000, intervalMs = 2000 } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return true
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('timeout')
}

exports.handler = async (event = {}) => {
  const recs = Array.isArray(event.Records) ? event.Records : []
  for (const r of recs) {
    try {
      const { userId, postId } = JSON.parse(r.body || '{}')
      console.log('[instagram] received', { userId, postId })
      if (!userId || !postId) continue
      await claimIdempotency(`${postId}#instagram`).catch((e) => {
        if (String(e?.name || '').includes('ConditionalCheckFailed')) throw new Skip('idempotent')
        throw e
      })

      const post = await getPost(userId, postId)
      console.log('[instagram] post loaded keys', Object.keys(post || {}))
      if (!post) throw new Error('post_not_found')
      const variant = (post.variants && post.variants.instagram) || {}

      if (!ENABLE_PUBLISH) {
        console.log('[instagram] dry-run enabled, marking posted')
        await markPosted(userId, postId, 'instagram', { externalPostId: 'dry-run' })
        continue
      }

      const tok = await getToken(userId, 'instagram')
      if (!tok?.accessToken) throw new Error('missing_ig_token')
      const igUserId = tok.providerUserId || (tok.extra && safeParse(tok.extra)?.igUserId)
      if (!igUserId) throw new Error('missing_ig_user_id')

      if (!Array.isArray(post.assets) || post.assets.length === 0) throw new Error('no_media')
      const asset = post.assets[0]
      const uploadBucket = process.env.UPLOAD_BUCKET || ''
      let key = null; let contentType = null; let url = null
      if (typeof asset === 'string') { key = asset }
      else if (asset && typeof asset === 'object') { key = asset.s3Key || asset.key || null; url = asset.url || null; contentType = asset.contentType || null }
      if (!url) {
        if (!uploadBucket || !key) throw new Error('asset_url_or_s3Key_required')
        url = await presignGetUrl({ bucket: uploadBucket, key, expiresInSec: 5400, responseContentType: contentType || undefined })
      }
      const mediaUrl = url

      // 1) create container
      const createUrl = new URL(`https://graph.facebook.com/v19.0/${igUserId}/media`)
      const form = new URLSearchParams()
      form.set('caption', variant?.text || '')
      if (looksLikeVideo(String(mediaUrl))) {
        form.set('video_url', String(mediaUrl))
        form.set('media_type', 'REELS')
      } else {
        form.set('image_url', String(mediaUrl))
      }
      const createRes = await withRetry(() => fetchJson(createUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok.accessToken}` },
        body: form,
      }))
      const creationId = createRes.id

      // 2) poll container until FINISHED
      await waitUntil(async () => {
        const s = await fetchJson(`https://graph.facebook.com/v19.0/${creationId}?fields=status_code,status`, {
          headers: { Authorization: `Bearer ${tok.accessToken}` },
        })
        return s?.status_code === 'FINISHED'
      }, { timeoutMs: 180000, intervalMs: 3000 })

      // 3) publish
      const publishRes = await withRetry(() => fetchJson(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok.accessToken}` },
        body: new URLSearchParams({ creation_id: creationId })
      }))

      const extId = publishRes.id || `ig_${Date.now()}`
      await markPosted(userId, postId, 'instagram', { externalPostId: extId })
    } catch (e) {
      console.error('[instagram] failed', e?.message || e)
      if (e && e.name === 'Skip') continue
      try {
        const payload = JSON.parse(r.body || '{}')
        await markError(payload.userId, payload.postId, 'instagram', String(e?.message || 'failed'))
      } catch {}
    }
  }
  return { ok: true }
}

function looksLikeVideo(v) { return /\.(mp4|mov|m4v)(\?|$)/i.test(v) }
function Skip(msg) { this.name = 'Skip'; this.message = msg }
function safeParse(s) { try { return JSON.parse(s) } catch { return null } }
// no-op
