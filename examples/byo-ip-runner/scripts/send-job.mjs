#!/usr/bin/env node
import AWS from 'aws-sdk'

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
AWS.config.update({ region })

const sqs = new AWS.SQS()

async function main() {
  const queueUrl = process.env.JOBS_QUEUE_URL
  if (!queueUrl) {
    console.error('JOBS_QUEUE_URL env var required')
    process.exit(1)
  }
  const agentId = process.env.AGENT_ID || 'DEV-AGENT-123'

  const type = process.env.JOB_TYPE || 'send_dm'
  const payload = (() => {
    if (type === 'send_dm') {
      return { recipient_id: process.env.RECIPIENT_ID || 'demo-fan', text: process.env.TEXT || 'Hello from BYO-IP' }
    }
    if (type === 'broadcast_dm') {
      return { recipients: (process.env.RECIPIENTS || 'u1,u2').split(','), text: process.env.TEXT || 'Promo ✨', tempo: { min_ms: 3000, jitter_ms: 1500 }, idem_key: process.env.IDEM_KEY || 'camp-test' }
    }
    if (type === 'schedule_post') {
      return { text: process.env.TEXT || 'Scheduled post', media: [], scheduled_at: process.env.SCHEDULED_AT || new Date(Date.now()+10*60*1000).toISOString(), tz: process.env.TZ || 'UTC' }
    }
    if (type === 'scrape_messages') {
      return { since_ts: Number(process.env.SINCE_TS || 0), limit_threads: Number(process.env.LIMIT_THREADS || 10), limit_msgs: Number(process.env.LIMIT_MSGS || 20) }
    }
    if (type === 'check_notifications') {
      return { since_id: process.env.SINCE_ID || '' }
    }
    return {}
  })()

  const job = {
    jobId: process.env.JOB_ID || `job-${Date.now()}`,
    agentId,
    creatorId: process.env.CREATOR_ID || 'creator-xyz',
    type,
    payload,
  }

  const res = await sqs.sendMessage({ QueueUrl: queueUrl, MessageBody: JSON.stringify(job) }).promise()
  console.log('Enqueued', { job, messageId: res.MessageId })
}

main().catch((e) => { console.error(e); process.exit(1) })
