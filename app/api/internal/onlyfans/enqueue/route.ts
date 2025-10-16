import { NextResponse } from 'next/server'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'

function regionFromQueueUrl(url?: string): string | undefined {
  if (!url) return undefined
  try {
    const host = new URL(url).host // e.g., sqs.us-east-1.amazonaws.com
    const parts = host.split('.')
    if (parts.length >= 4 && parts[0] === 'sqs') return parts[1]
  } catch {}
  return undefined
}

const QUEUE_URL = process.env.OF_SQS_URL as string
const RESOLVED_REGION = regionFromQueueUrl(QUEUE_URL) || process.env.AWS_REGION || 'us-east-1'
const sqs = new SQSClient({ region: RESOLVED_REGION })

export async function POST(req: Request) {
  if (!QUEUE_URL) return NextResponse.json({ error: 'OF_SQS_URL not set' }, { status: 500 })
  const payload = await req.json()
  const isFifo = QUEUE_URL.endsWith('.fifo')
  const body = JSON.stringify(payload)
  const params: any = { QueueUrl: QUEUE_URL, MessageBody: body }
  if (isFifo) {
    const groupId = payload.fan_id || payload.session_id || 'default'
    const dedupId = payload.dedup_id || (payload.session_id ? `${payload.session_id}:send:v1` : `${groupId}:send:v1`)
    params.MessageGroupId = groupId
    params.MessageDeduplicationId = dedupId
  }
  const cmd = new SendMessageCommand(params)
  await sqs.send(cmd)
  return NextResponse.json({ ok: true })
}
export const runtime = 'nodejs'
