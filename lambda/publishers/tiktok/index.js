// Lambda: publisher-tiktok
// Dry-run by default; integrates TikTok Content Posting API when ENABLE_PUBLISH=true
const { getPost, claimIdempotency, markPosted, markError, getToken, withRetry, fetchS3Buffer } = require('./_core')

const ENABLE_PUBLISH = String(process.env.ENABLE_PUBLISH || 'false') === 'true'
const TIKTOK_BASE = process.env.TIKTOK_BASE || 'https://open.tiktokapis.com'
const TIKTOK_MODE = (process.env.TIKTOK_MODE || 'FILE_UPLOAD').toUpperCase()

async function initInbox(accessToken, body) {
  const res = await withRetry(() => fetch(`${TIKTOK_BASE}/v2/post/publish/inbox/video/init/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }))
  const json = await res.json()
  if (!res.ok) throw new Error(`tiktok_init_failed:${res.status}:${JSON.stringify(json)}`)
  return json
}

exports.handler = async (event = {}) => {
  const recs = Array.isArray(event.Records) ? event.Records : []
  for (const r of recs) {
    const payload = JSON.parse(r.body || '{}')
    const { userId, postId } = payload
    try {
      if (!userId || !postId) continue
      await claimIdempotency(`${postId}#tiktok`).catch((e) => {
        if (String(e?.name || '').includes('ConditionalCheckFailed')) throw new Skip('idempotent')
        throw e
      })
      const post = await getPost(userId, postId)
      if (!post) throw new Error('post_not_found')

      if (!ENABLE_PUBLISH) {
        await markPosted(userId, postId, 'tiktok', { externalPostId: `dryrun:${Date.now()}` })
        continue
      }
      const tok = await getToken(userId, 'tiktok')
      if (!tok?.accessToken) throw new Error('missing_tiktok_token')

      if (!Array.isArray(post.assets) || post.assets.length === 0) throw new Error('no_media')
      const asset = post.assets[0]
      const caption = (post.variants?.tiktok?.text || post.variants?.instagram?.text || '').slice(0, 2200)

      if (TIKTOK_MODE === 'PULL_FROM_URL' && process.env.UPLOAD_BUCKET && (asset?.s3Key || typeof asset === 'string')) {
        const { presignGetUrl } = require('../../helpers/s3')
        const key = typeof asset === 'string' ? asset : (asset.s3Key || asset.key)
        const url = await presignGetUrl({ bucket: process.env.UPLOAD_BUCKET, key, expiresInSec: 5400, responseContentType: asset?.contentType || 'video/mp4' })
        const init = await initInbox(tok.accessToken, { source_info: { source: 'PULL_FROM_URL', video_url: url }, post_info: { caption } })
        const publishId = init?.data?.publish_id || init?.publish_id || `tt_${Date.now()}`
        await markPosted(userId, postId, 'tiktok', { externalPostId: publishId })
        continue
      }

      // Default: FILE_UPLOAD to avoid domain verification constraints
      const init = await initInbox(tok.accessToken, { source_info: { source: 'FILE_UPLOAD' }, post_info: { caption } })
      const uploadUrl = init?.data?.upload_url || init?.upload_url
      const publishId = init?.data?.publish_id || init?.publish_id
      if (!uploadUrl || !publishId) throw new Error(`tiktok_init_missing_fields:${JSON.stringify(init)}`)

      // Load media from S3 and upload in a single PUT
      const spec = typeof asset === 'string' ? { key: asset } : asset
      const obj = await fetchS3Buffer(spec)
      const put = await withRetry(() => fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': obj.contentType || 'video/mp4', 'Content-Length': obj.buffer.length }, body: obj.buffer }))
      if (!put.ok) throw new Error(`tiktok_upload_failed:${put.status}`)

      await markPosted(userId, postId, 'tiktok', { externalPostId: publishId })
    } catch (e) {
      if (e && e.name === 'Skip') continue
      try { await markError(userId, postId, 'tiktok', String(e?.message || 'failed')) } catch {}
    }
  }
  return { ok: true }
}

function Skip(msg) { this.name = 'Skip'; this.message = msg }
