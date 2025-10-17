#!/usr/bin/env node
/*
  Huntaze AI SQS Consumer (long-polling + per-platform orchestration)
  - Reads messages from SQS (queue name from env)
  - For type=publish_content: iterates platforms and invokes Python orchestrator
  - Visibility/backoff handling; batch deletes on success

  Env:
    AWS_REGION=us-east-1
    SQS_AI_QUEUE=huntaze-ai-processing
    HUNTAZE_PYTHON_BIN=python3 (optional)
*/

const { SQSClient, GetQueueUrlCommand, ReceiveMessageCommand, DeleteMessageBatchCommand, ChangeMessageVisibilityCommand } = require('@aws-sdk/client-sqs')
const { createClient } = require('redis')
const { spawn } = require('child_process')

const REGION = process.env.AWS_REGION || 'us-east-1'
const QUEUE_NAME = process.env.SQS_AI_QUEUE || 'huntaze-ai-processing'
const VISIBILITY_TIMEOUT = Number(process.env.AI_QUEUE_VISIBILITY || 120)
const WAIT_TIME_SECONDS = Number(process.env.AI_QUEUE_WAIT || 20)
const BATCH_SIZE = Number(process.env.AI_QUEUE_BATCH || 5)
const PYTHON_BIN = process.env.HUNTAZE_PYTHON_BIN || 'python3'
let postHistory = null

const sqs = new SQSClient({ region: REGION })
let redis = null

async function initRedis() {
  const url = process.env.REDIS_URL
  if (!url) return null
  const client = createClient({ url })
  client.on('error', (e) => console.error('[ai-sqs-consumer] redis error', e?.message))
  await client.connect()
  return client
}

async function getQueueUrl(name) {
  const resp = await sqs.send(new GetQueueUrlCommand({ QueueName: name }))
  return resp.QueueUrl
}

function runPythonJob(perPlatformJob) {
  return new Promise((resolve, reject) => {
    const payloadB64 = Buffer.from(JSON.stringify(perPlatformJob), 'utf8').toString('base64')
    const child = spawn(PYTHON_BIN, ['automation/multi_platform_traffic.py', '--job-b64', payloadB64], {
      env: { ...process.env, HUNTAZE_AUTOMATION_SILENT: '1' },
    })
    const out = []
    const err = []
    child.stdout.on('data', (d) => out.push(d))
    child.stderr.on('data', (d) => err.push(d))
    child.on('error', reject)
    child.on('close', (code) => {
      const stdout = Buffer.concat(out).toString('utf8').trim()
      const stderr = Buffer.concat(err).toString('utf8').trim()
      if (code !== 0) return reject(new Error(`py_exit_${code}: ${stderr}`))
      try {
        const lines = stdout.split('\n').filter(Boolean)
        const last = lines.length ? lines[lines.length - 1] : '{}'
        const parsed = JSON.parse(last)
        if (parsed && parsed.ok) return resolve(parsed)
        return reject(new Error(`py_not_ok: ${last}`))
      } catch (e) {
        return reject(new Error(`py_parse_error: ${e.message}: ${stdout}\n${stderr}`))
      }
    })
  })
}

function expandToPlatformJobs(message) {
  // Accepts both single-platform job and multi-platform schema
  if (message?.payload?.platform) {
    // Existing single-platform schema coming from app
    return [message]
  }

  if (message?.type === 'publish_content' && Array.isArray(message.platforms)) {
    const base = message
    return message.platforms.map((platform) => ({
      type: 'publish_content',
      userId: base.userId || 'unknown',
      payload: {
        platform,
        contentId: base.campaign_id || `cmp-${Date.now()}`,
        content: {
          title: base.copy?.title,
          description: base.copy?.base_caption,
          mediaUrls: (base.assets || []).map((a) => a.path),
          tags: base.copy?.hashtags || [],
          contentType: platform === 'reddit' ? 'photos' : (platform === 'tiktok' ? 'video' : 'photos'),
          isNsfw: base.reddit?.nsfw || false,
        },
        subreddit: base.reddit?.subreddits?.[0],
        options: base.options || {},
      },
    }))
  }

  return []
}

function computeIdempotencyKey(jobLike) {
  const t = jobLike?.type || 'unknown'
  const cid = jobLike?.campaign_id || jobLike?.payload?.contentId || jobLike?.payload?.content?.title || 'auto'
  const platform = jobLike?.payload?.platform || 'multi'
  return `idem:${t}:${cid}:${platform}`
}

async function alreadyProcessed(key) {
  if (!redis) return false
  const v = await redis.get(key)
  return !!v
}

async function markProcessed(key, ttlSeconds = 7 * 24 * 3600) {
  if (!redis) return
  await redis.setEx(key, ttlSeconds, '1')
}

async function processSqsMessage(m) {
  const body = JSON.parse(m.Body || '{}')
  if (!body || !body.type) return
  if (body.type !== 'publish_content') return

  const perPlatformJobs = expandToPlatformJobs(body)
  if (!perPlatformJobs.length) perPlatformJobs.push(body)

  // Run sequentially to respect platform rate limits
  for (const job of perPlatformJobs) {
    const idemKey = computeIdempotencyKey(job)
    if (await alreadyProcessed(idemKey)) {
      console.log('[ai-sqs-consumer] skip duplicate', idemKey)
      continue
    }
    const res = await runPythonJob(job)
    await markProcessed(idemKey)
    try {
      if (postHistory && res && res.platform) {
        await postHistory.recordPost({
          idempotencyKey: idemKey,
          platform: String(res.platform),
          campaignId: job.campaign_id || null,
          contentId: (job.payload && job.payload.contentId) || null,
          postId: res.postId || null,
          permalink: res.permalink || null,
        })
      }
    } catch (e) {
      console.error('[ai-sqs-consumer] post history persist failed', e?.message)
    }
  }
}

async function main() {
  try { postHistory = require('./lib-post-history.js') } catch (e) { postHistory = null }
  redis = await initRedis().catch(() => null)
  const queueUrl = await getQueueUrl(QUEUE_NAME)
  console.log(`[ai-sqs-consumer] Listening on ${queueUrl} | region=${REGION}`)

  for (;;) {
    try {
      const resp = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: BATCH_SIZE,
        WaitTimeSeconds: WAIT_TIME_SECONDS,
        VisibilityTimeout: VISIBILITY_TIMEOUT,
      }))
      const msgs = resp.Messages || []
      if (!msgs.length) continue

      const succeeded = []
      for (const m of msgs) {
        try {
          await processSqsMessage(m)
          succeeded.push(m)
        } catch (err) {
          console.error('[ai-sqs-consumer] message failed', err?.message)
          // Increase visibility timeout for retry/backoff
          try {
            await sqs.send(new ChangeMessageVisibilityCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: m.ReceiptHandle,
              VisibilityTimeout: VISIBILITY_TIMEOUT * 2,
            }))
          } catch (e) {
            console.error('[ai-sqs-consumer] change visibility failed', e?.message)
          }
        }
      }

      if (succeeded.length) {
        await sqs.send(new DeleteMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: succeeded.map((m, i) => ({ Id: String(i), ReceiptHandle: m.ReceiptHandle })),
        }))
      }
    } catch (e) {
      console.error('[ai-sqs-consumer] loop error', e?.message)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

main().catch((e) => {
  console.error('[ai-sqs-consumer] fatal', e?.message)
  process.exit(1)
})
