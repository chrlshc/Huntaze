import { WebSocketServer } from 'ws'
import { randomUUID } from 'crypto'
import { enqueueJob, leaseJob, acknowledgeJob, completeJob, getJobsSnapshot, outstandingJobs, createDemoJob } from './queue.js'
import { startMetricsServer } from './metrics.js'

const PORT = Number(process.env.BYO_BACKEND_PORT || 8081)
const AUTH_TOKEN = process.env.BYO_AGENT_TOKEN || 'development-token'
const HEARTBEAT_INTERVAL = Number(process.env.BYO_BACKEND_HEARTBEAT_MS || 15000)
const METRICS_PORT = Number(process.env.BYO_BACKEND_METRICS_PORT || PORT + 1)

const agents = new Map()

function log(event, payload = {}) {
  const timestamp = new Date().toISOString()
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ timestamp, event, ...payload }))
}

function agentSnapshot() {
  return Array.from(agents.values()).map((agent) => ({
    agentId: agent.agentId,
    status: agent.status,
    lastSeen: agent.lastSeen,
    wsState: agent.ws?.readyState || null,
    version: agent.version,
    currentJobId: agent.currentJobId
  }))
}

function metricsSnapshot() {
  return {
    jobs: getJobsSnapshot(),
    agents: agentSnapshot()
  }
}

startMetricsServer(metricsSnapshot, METRICS_PORT)

function authenticate(message) {
  if (message.type !== 'auth') return { ok: false, reason: 'invalid_message' }
  if (message.token !== AUTH_TOKEN) return { ok: false, reason: 'invalid_token' }
  return {
    ok: true,
    agentId: message.agentId || `agent-${randomUUID().slice(0, 8)}`,
    version: message.version || 'unknown'
  }
}

function dispatchJob(agent) {
  const job = leaseJob(agent.agentId)
  if (!job) return
  agent.ws.send(JSON.stringify({ type: 'job_assign', job }))
  agent.currentJobId = job.id
  log('job_dispatched', { agentId: agent.agentId, jobId: job.id, jobType: job.type, attempt: job.attempts })
}

const server = new WebSocketServer({ port: PORT }, () => {
  log('backend_ready', { port: PORT })
})

server.on('connection', (ws) => {
  let agentMeta = null

  ws.on('message', (raw) => {
    let message
    try {
      message = JSON.parse(raw.toString())
    } catch (err) {
      log('invalid_json', { error: err.message })
      ws.close(4000, 'Invalid JSON message')
      return
    }

    if (!agentMeta) {
      const auth = authenticate(message)
      if (!auth.ok) {
        ws.close(4003, auth.reason)
        return
      }
      agentMeta = {
        agentId: auth.agentId,
        ws,
        lastSeen: Date.now(),
        status: 'online',
        version: auth.version,
        currentJobId: null
      }
      agents.set(ws, agentMeta)
      ws.send(JSON.stringify({ type: 'auth_ok', agentId: auth.agentId }))
      log('agent_authenticated', { agentId: auth.agentId, version: auth.version })

      enqueueJob(createDemoJob())
      enqueueJob({
        id: randomUUID(),
        type: 'scrape_subs',
        payload: { limit: 25 }
      })
      dispatchJob(agentMeta)
      return
    }

    agentMeta.lastSeen = Date.now()

    if (message.type === 'heartbeat') {
      agentMeta.status = 'online'
      agentMeta.version = message.version || agentMeta.version
      return
    }

    if (message.type === 'job_ack') {
      const job = acknowledgeJob(message.jobId)
      if (job) {
        log('job_acknowledged', { agentId: agentMeta.agentId, jobId: job.id, attempt: job.attempts })
      }
      return
    }

    if (message.type === 'job_result') {
      const retryable = Boolean(message.retryable)
      completeJob(message.jobId, message.status === 'success' ? 'succeeded' : 'failed', { retryable })
      agentMeta.currentJobId = null
      log('job_completed', {
        agentId: agentMeta.agentId,
        jobId: message.jobId,
        status: message.status,
        attempt: message.attempt,
        retryable
      })
      dispatchJob(agentMeta)
      return
    }

    log('unknown_message', { agentId: agentMeta.agentId, message })
  })

  ws.on('close', (code) => {
    if (agentMeta) {
      agentMeta.status = 'offline'
      agentMeta.ws = null
      const outstanding = outstandingJobs(agentMeta.agentId)
      outstanding.forEach((job) => {
        completeJob(job.id, 'failed', { retryable: true })
      })
      log('agent_disconnected', { agentId: agentMeta.agentId, code })
    }
    agents.delete(ws)
  })
})

setInterval(() => {
  for (const agent of agents.values()) {
    if (!agent.ws || agent.ws.readyState !== agent.ws.OPEN) continue
    const idle = Date.now() - agent.lastSeen
    if (idle > HEARTBEAT_INTERVAL * 2) {
      log('agent_idle', { agentId: agent.agentId, idleMs: idle })
      agent.ws.ping()
    }
  }
}, HEARTBEAT_INTERVAL)

process.on('SIGINT', () => {
  server.close()
  log('backend_shutdown')
  process.exit(0)
})
