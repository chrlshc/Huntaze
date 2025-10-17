import { getAuthenticatedContext, invalidateContext } from './session.js'
import { flowHandlers } from '../flows/index.js'
import { FlowError, ErrorCodes, normaliseError, buildSuccess } from './errors.js'
import { takeToken, resetRateLimit } from './rateLimit.js'
import { MAX_RETRIES } from './config.js'

function createLogger(job) {
  return (level, payload) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'job_log',
      level,
      jobId: job.id,
      jobType: job.type,
      ...payload
    }))
  }
}

async function runFlow(job, logger) {
  const handler = flowHandlers[job.type]
  if (!handler) {
    throw new FlowError(ErrorCodes.BAD_REQUEST, `Unsupported job type: ${job.type}`, { retryable: false })
  }

  // All registered flows in flowHandlers are considered implemented

  const context = await getAuthenticatedContext()
  const result = await handler(context, job.payload, logger)
  if (!result || result.status !== 'success') {
    return buildSuccess(result?.payload || null)
  }
  return result
}

export async function executeJob(job) {
  const logger = createLogger(job)
  const rl = takeToken(job.type)
  if (!rl.allowed) {
    throw new FlowError(ErrorCodes.RATE_LIMITED, `Rate limit reached for ${job.type}`, { retryable: true, meta: { remaining: rl.remaining } })
  }

  try {
    const started = Date.now()
    const context = await getAuthenticatedContext()
    const result = await runFlow(job, logger)
    return { ...result, durationMs: Date.now() - started }
  } catch (err) {
    if (err instanceof FlowError && err.code === ErrorCodes.LOGIN_REQUIRED) {
      await invalidateContext({ clear: true })
    }
    if (err instanceof FlowError && !err.retryable) {
      resetRateLimit(job.type)
    }
    return { ...normaliseError(err), durationMs: null }
  }
}

export function shouldRetry(result, attempt) {
  if (result.status !== 'error') return false
  if (!result.retryable) return false
  return attempt < MAX_RETRIES
}
