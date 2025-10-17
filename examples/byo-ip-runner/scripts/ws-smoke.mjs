#!/usr/bin/env node
import WebSocket from 'ws'

const url = process.env.BYO_BACKEND_URL
if (!url) {
  console.error('Set BYO_BACKEND_URL to the WebSocket URL (wss://...)')
  process.exit(1)
}
const token = encodeURIComponent(process.env.AGENT_JWT || process.env.BYO_AGENT_TOKEN || 'DEV-AGENT-123')
const agentId = process.env.BYO_AGENT_ID || 'DEV-AGENT-123'
const wsUrl = url + (url.includes('?') ? '&' : '?') + `token=${token}`

console.log('[ws] connecting', wsUrl.replace(/token=[^&]+/, 'token=***'))
const ws = new WebSocket(wsUrl)

ws.on('open', () => {
  console.log('[ws] opened')
  ws.send(JSON.stringify({ t: 'hb', v: 'ws-smoke', ts: Date.now(), agentId }))
})

ws.on('message', (buf) => {
  const raw = buf.toString()
  console.log('[ws] recv', raw)
  try {
    const msg = JSON.parse(raw)
    if (msg.t === 'hb_ack') {
      console.log('[ws] hb_ack received, OK')
      ws.close(1000, 'done')
    } else if (msg.t === 'job_assign') {
      console.log('[ws] assigned job (no agent running), closing')
      ws.close(1000, 'noop')
    }
  } catch {}
})

ws.on('error', (e) => {
  console.error('[ws] error', e.message)
  process.exit(2)
})

ws.on('close', (code) => {
  console.log('[ws] closed', code)
  process.exit(0)
})

