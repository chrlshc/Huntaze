// Ensure SSR, skip caches
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { randomUUID } from 'crypto'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'

const sqs = new SQSClient({})
const SQS_URL = process.env.SQS_URL || ''

function pick<T extends Record<string, any>>(o: T, k: string) {
  return o && typeof o === 'object' ? (o as any)[k] : undefined
}

async function parseParams(req: Request) {
  const url = new URL(req.url)
  const qs = Object.fromEntries(url.searchParams as any)
  let body: any = {}
  try { body = await req.json() } catch {}

  const account_id = pick(body, 'account_id') ?? (qs as any)['account_id']
  const period     = pick(body, 'period')     ?? (qs as any)['period']     ?? '7d'
  const platform   = pick(body, 'platform')   ?? (qs as any)['platform']   ?? 'instagram'
  return { account_id, period, platform }
}

function respond202(payload: any) {
  return new Response(JSON.stringify({ ok: true, accepted: true, ...payload }), {
    status: 202,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

async function postHandler(req: Request) {
  const p = await parseParams(req)
  const requestId = randomUUID()
  const msg = { requestId, ts: Date.now(), payload: p }

  if (SQS_URL) {
    try {
      await sqs.send(new SendMessageCommand({ QueueUrl: SQS_URL, MessageBody: JSON.stringify(msg) }))
      try { console.log(JSON.stringify({ lvl: 'info', evt: 'summary.enqueue.ok', requestId, payload: p })) } catch {}
      return respond202({ requestId, ...p, enqueued: true })
    } catch (err: any) {
      try { console.log(JSON.stringify({ lvl: 'error', evt: 'summary.enqueue.fail', requestId, err: String(err) })) } catch {}
      return respond202({ requestId, ...p, enqueued: false, error: 'enqueue_failed' })
    }
  } else {
    try { console.log(JSON.stringify({ lvl: 'warn', evt: 'summary.enqueue.skipped', reason: 'SQS_URL_missing', payload: p })) } catch {}
    return respond202({ requestId, ...p, enqueued: false })
  }
}

export const POST = postHandler as any
export const GET = POST
