import { randomUUID } from 'crypto'

const jobs = new Map()
const queue = []

const DEFAULT_VISIBILITY_MS = 120000
const MAX_ATTEMPTS = 5

export function createDemoJob() {
  return {
    id: randomUUID(),
    type: 'send_dm',
    payload: {
      recipient: 'demo-fan',
      text: 'Hello from BYO-IP demo'
    }
  }
}

export function enqueueJob(job) {
  const entry = {
    ...job,
    status: 'queued',
    attempts: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    visibleAt: Date.now(),
    assignedTo: null
  }
  jobs.set(job.id, entry)
  queue.push(job.id)
  return entry
}

export function leaseJob(agentId, now = Date.now()) {
  for (let i = 0; i < queue.length; i += 1) {
    const jobId = queue[i]
    const job = jobs.get(jobId)
    if (!job) {
      queue.splice(i, 1)
      i -= 1
      continue
    }
    if (job.status === 'queued' && job.visibleAt <= now) {
      job.status = 'assigned'
      job.assignedTo = agentId
      job.visibleAt = now + DEFAULT_VISIBILITY_MS
      job.attempts += 1
      job.updatedAt = now
      queue.splice(i, 1)
      return job
    }
    if (job.status === 'assigned' && job.visibleAt <= now) {
      job.assignedTo = agentId
      job.visibleAt = now + DEFAULT_VISIBILITY_MS
      job.attempts += 1
      job.updatedAt = now
      return job
    }
  }
  return null
}

export function acknowledgeJob(jobId) {
  const job = jobs.get(jobId)
  if (!job) return null
  job.status = 'running'
  job.updatedAt = Date.now()
  return job
}

export function completeJob(jobId, status, { retryable = false } = {}) {
  const job = jobs.get(jobId)
  if (!job) return null
  job.updatedAt = Date.now()
  job.status = status
  if (status === 'failed' && retryable && job.attempts < MAX_ATTEMPTS) {
    job.status = 'queued'
    job.visibleAt = Date.now() + Math.min(2 ** job.attempts * 1000, 60000)
    job.assignedTo = null
    queue.push(jobId)
  }
  return job
}

export function getJobsSnapshot() {
  return Array.from(jobs.values()).map((job) => ({
    id: job.id,
    type: job.type,
    status: job.status,
    attempts: job.attempts,
    assignedTo: job.assignedTo,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    visibleAt: job.visibleAt
  }))
}

export function outstandingJobs(agentId) {
  return Array.from(jobs.values()).filter((job) => job.assignedTo === agentId && ['assigned', 'running'].includes(job.status))
}

