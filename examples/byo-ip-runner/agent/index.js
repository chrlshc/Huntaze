import WebSocket from 'ws'
import * as ckpt from './lib/ckpt.js'
import { startNotificationsPoller } from './daemon/notifications.js'
import { randomUUID } from 'crypto'
import { executeJob, shouldRetry } from './lib/jobRunner.js'
import { AGENT_VERSION } from './lib/config.js'
import { invalidateContext } from './lib/session.js'

const RAW_BACKEND_URL = process.env.BYO_BACKEND_URL || 'ws://localhost:8081'
const AGENT_TOKEN = process.env.BYO_AGENT_TOKEN || process.env.BYO_AGENT_JWT || process.env.AGENT_JWT || 'development-token'
const AGENT_ID = process.env.BYO_AGENT_ID || `local-agent-${randomUUID().slice(0, 8)}`
const HEARTBEAT_INTERVAL = Number(process.env.BYO_AGENT_HEARTBEAT_MS || 10000)
const DEBUG_WS = /^true$/i.test(process.env.BYO_AGENT_DEBUG_WS || '')

// Track suppression window for the notifications poller
let suppressUntilTs = 0

let socket
const jobQueue = []
let processing = false
let activeJob = null

function log(event, payload = {}) {
  const timestamp = new Date().toISOString()
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ timestamp, event, ...payload }))
}

function queueJob(job) {
  job.id = job.id || job.jobId
  const existing = jobQueue.find((entry) => entry.job.id === job.id)
  if (existing) return
  jobQueue.push({ job, attempt: 0 })
  processQueue()
}

function scheduleRetry(entry, delayMs) {
  log('job_retry_scheduled', { jobId: entry.job.id, delayMs })
  setTimeout(() => {
    jobQueue.push({ job: entry.job, attempt: entry.attempt })
    processQueue()
  }, delayMs)
}

async function processQueue() {
  if (processing || jobQueue.length === 0 || !socket || socket.readyState !== WebSocket.OPEN) return
  processing = true

  while (jobQueue.length > 0) {
    const entry = jobQueue.shift()
    entry.attempt += 1
    const { job } = entry
    activeJob = job

    wsSend({ t: 'job_ack', id: job.id, attempt: entry.attempt })

    const result = await executeJob(job)
    const payload = {
      t: 'job_result',
      id: job.id,
      status: result.status,
      attempt: entry.attempt,
      durationMs: result.durationMs
    }

    if (result.status === 'success') {
      payload.payload = result.payload || null
    } else {
      payload.error = result.error
      payload.retryable = result.retryable
    }

    wsSend(payload)

    if (result.status === 'error' && shouldRetry(result, entry.attempt)) {
      const delay = Math.min(2 ** entry.attempt * 1000, 60000)
      entry.job = job
      scheduleRetry(entry, delay)
    }
  }

  processing = false
  activeJob = null
}

function handleMessage(raw) {
  let message
  try {
    message = JSON.parse(raw.toString())
  } catch (err) {
    log('message_parse_error', { error: err.message })
    return
  }

  const t = message.t || message.type

  if (t === 'job_assign' && message.job) {
    message.job.id = message.job.id || message.job.jobId
    log('job_received', { jobId: message.job.id, jobType: message.job.type })
    // Suppress notifications poller when an explicit check_notifications job is assigned
    if (message.job.type === 'check_notifications') {
      const supMs = Number(process.env.BYO_AGENT_NOTIFS_SUPPRESS_MS || 5 * 60 * 1000)
      suppressUntilTs = Date.now() + supMs
      log('notifs_poll_suppress_set', { ms: supMs })
    }
    queueJob(message.job)
    return
  }

  if (t === 'auth_ok') {
    log('auth_confirmed', { agentId: message.agentId })
    return
  }

  if (t === 'job_cancel') {
    const index = jobQueue.findIndex((entry) => entry.job.id === message.jobId)
    if (index >= 0) {
      jobQueue.splice(index, 1)
      log('job_cancelled', { jobId: message.jobId })
    }
    return
  }

  if (t === 'invalidate_session') {
    invalidateContext({ clear: Boolean(message.clear) }).catch(() => {})
    log('session_invalidated', { reason: message.reason || 'backend_request' })
    return
  }

  log('agent_unknown_message', { message })
}

function sendHeartbeat() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return
  wsSend({
    t: 'hb',
    agentId: AGENT_ID,
    ts: Date.now(),
    activeJobId: activeJob?.id || null,
    v: AGENT_VERSION
  })
}

function connect() {
  let wsUrl = RAW_BACKEND_URL
  if (AGENT_TOKEN && !/([?&])token=/.test(wsUrl)) {
    wsUrl += (wsUrl.includes('?') ? '&' : '?') + `token=${encodeURIComponent(AGENT_TOKEN)}`
  }
  log('connecting', { wsUrl: wsUrl.replace(/token=[^&]+/, 'token=***') })
  socket = new WebSocket(wsUrl)

  socket.on('open', () => {
    log('socket_opened', { backend: wsUrl.replace(/token=[^&]+/, 'token=***') })
    // Build minimal ctx for daemons/flows helpers
    suppressUntilTs = suppressUntilTs || 0
    const ctx = {
      agentId: AGENT_ID,
      creatorId: process.env.BYO_CREATOR_ID || null,
      wsSend,
      ckpt,
      log,
       getSuppressUntil: () => suppressUntilTs,
      // Provide Playwright context getter lazily for flows
      getContext: async () => (await import('./lib/session.js')).getAuthenticatedContext(),
    }
    const poller = startNotificationsPoller(ctx)
    socket.on('close', () => poller.stop())
  })

  socket.on('message', handleMessage)

  socket.on('close', (code) => {
    log('socket_closed', { code })
    processing = false
    activeJob = null
    jobQueue.length = 0
    setTimeout(connect, 3000)
  })

  socket.on('error', (err) => {
    log('socket_error', { error: err.message })
  })
}

function wsSend(obj) {
  const s = JSON.stringify(obj)
  if (DEBUG_WS) log('ws_send', { data: s })
  socket.send(s)
}

const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)

connect()

process.on('SIGINT', async () => {
  clearInterval(heartbeatInterval)
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close(1000, 'Agent shutdown')
  }
  await invalidateContext({ clear: false }).catch(() => {})
  process.exit(0)
})
