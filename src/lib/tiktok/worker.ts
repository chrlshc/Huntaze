import { fetchTikTokStatus } from './status'
import { enqueueTikTokStatusPoll, getTikTokJob, updateTikTokJob, popDueTikTokJobs, JobState } from './queue'
import { incCounter, observeMs } from '../../../lib/metrics'
import { addEvent, setTerminal } from './events'

const STATE_ORDER: Record<JobState, number> = {
  PENDING: 0,
  PROCESSING: 1,
  PUBLISHED: 2,
  FAILED: 2,
}

function isTerminal(state: JobState) {
  return state === 'PUBLISHED' || state === 'FAILED'
}

function backoffSeconds(attempt: number) {
  // Decorrelated jitter: pick random in [base, base*3]
  const seq = [10, 20, 40, 80]
  const base = seq[Math.min(attempt, seq.length - 1)]
  const max = base * 3
  const next = Math.floor(base + Math.random() * (max - base))
  return next
}

async function refreshAccessToken(_accountId?: string): Promise<string | null> {
  // Placeholder: integrate your token refresh here; return new token or null.
  // For now, try static token fallback for dev env.
  return process.env.TT_USER_TOKEN || null
}

export async function handleTikTokStatusJob(videoId: string) {
  const started = Date.now()
  const job = await getTikTokJob(videoId)
  if (!job) return
  const token = job.userAccessToken
  let res
  try {
    res = await fetchTikTokStatus({ video_id: videoId, userAccessToken: token })
  } catch (err: any) {
    incCounter('social_tiktok_status_fetch_total', { status: 'exception' })
    // Schedule retry on transient errors
    const nextDelay = backoffSeconds(job.attempts)
    await updateTikTokJob(videoId, {
      attempts: job.attempts + 1,
      lastPollAt: Date.now(),
      nextPollAt: Date.now() + nextDelay * 1000,
    })
    await enqueueTikTokStatusPoll({ videoId, userAccessToken: token, delaySec: nextDelay })
    return
  }

  const newState = res.status as JobState
  await addEvent(videoId, `POLL:${newState}`, Date.now())

  // Idempotent advance only
  const prevOrder = STATE_ORDER[job.state]
  const nextOrder = STATE_ORDER[newState]
  const advanced = nextOrder > prevOrder

  if (advanced) {
    await updateTikTokJob(videoId, { state: newState, lastPollAt: Date.now() })
  } else {
    await updateTikTokJob(videoId, { lastPollAt: Date.now() })
  }

  if (isTerminal(newState)) {
    await setTerminal(videoId, newState as any, Date.now())
    incCounter('social_tiktok_publish_requests_total', { result: newState.toLowerCase() })
    observeMs('social_publish_time_ms', Date.now() - (job.createdAt || started), { platform: 'tiktok' })
    return
  }

  // Schedule next backoff
  const nextDelay = backoffSeconds(job.attempts)
  await updateTikTokJob(videoId, {
    attempts: job.attempts + 1,
    nextPollAt: Date.now() + nextDelay * 1000,
  })
  await enqueueTikTokStatusPoll({ videoId, userAccessToken: token, delaySec: nextDelay })
}

export async function processDueTikTokStatusJobs(limit = 25) {
  const ids = await popDueTikTokJobs(limit)
  for (const id of ids) {
    await handleTikTokStatusJob(id)
  }
  return { processed: ids.length }
}
