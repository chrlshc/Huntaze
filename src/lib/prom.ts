import client from 'prom-client'

const g = globalThis as any
if (!g.__prom_registry) {
  g.__prom_registry = new client.Registry()
}

export const registry: client.Registry = g.__prom_registry
export const contentType: string = (client.register as any).contentType || 'text/plain; version=0.0.4; charset=utf-8'

let defaultMetricsStarted = false
export function ensureDefaultMetrics() {
  if (defaultMetricsStarted) return
  client.collectDefaultMetrics({ register: registry })
  defaultMetricsStarted = true
}

// Metrics
const counters = {
  tiktokStatusFetch: new client.Counter({
    name: 'social_tiktok_status_fetch_total',
    help: 'TikTok status fetch attempts',
    labelNames: ['status'] as const,
    registers: [registry],
  }),
  messagesSent: new client.Counter({
    name: 'hz_messages_sent_total',
    help: 'Total messages sent via messaging',
    labelNames: ['mode'] as const,
    registers: [registry],
  }),
  tiktokWebhookEvents: new client.Counter({
    name: 'social_tiktok_webhook_events_total',
    help: 'TikTok webhook events',
    labelNames: ['type'] as const,
    registers: [registry],
  }),
  messageReplyLatency: new client.Histogram({
    name: 'hz_messages_reply_latency_seconds',
    help: 'End-to-end latency to process a message reply',
    labelNames: ['mode'] as const,
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [registry],
  }),
  rateLimitHits: new client.Counter({
    name: 'social_rate_limit_hits_total',
    help: 'API rate limit hits',
    labelNames: ['platform'] as const,
    registers: [registry],
  }),
  publishInflight: new client.Counter({
    name: 'social_publish_inflight',
    help: 'Publish operations enqueued (increment-only)',
    labelNames: ['platform'] as const,
    registers: [registry],
  }),
  publishRequests: new client.Counter({
    name: 'social_tiktok_publish_requests_total',
    help: 'TikTok publish terminal results',
    labelNames: ['result'] as const,
    registers: [registry],
  }),
  azureSmokeEvents: new client.Counter({
    name: 'azure_smoke_events_total',
    help: 'Azure smoke route events by action',
    labelNames: ['action', 'path', 'env', 'force', 'source'] as const, // actions: locked, auth_missing, auth_invalid, force_required, rate_limited, ok
    registers: [registry],
  }),
}

const histograms = {
  statusPollLatency: new client.Histogram({
    name: 'social_status_poll_latency_seconds',
    help: 'Status poll latency in seconds',
    labelNames: ['platform'] as const,
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [registry],
  }),
  publishTime: new client.Histogram({
    name: 'social_publish_time_seconds',
    help: 'End-to-end publish time in seconds',
    labelNames: ['platform'] as const,
    buckets: [0.5, 1, 2, 5, 10, 20, 30, 60, 120, 300, 600],
    registers: [registry],
  }),
  insightsFetchLatency: new client.Histogram({
    name: 'social_insights_fetch_latency_seconds',
    help: 'Insights fetch latency in seconds',
    labelNames: ['platform','kind'] as const,
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [registry],
  }),
  llmLatency: new client.Histogram({
    name: 'llm_latency_seconds',
    help: 'LLM request latency in seconds',
    labelNames: ['provider'] as const,
    buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [registry],
  }),
  aiSummaryLatency: new client.Histogram({
    name: 'ai_summary_latency_seconds',
    help: 'AI insights summarizer latency in seconds',
    labelNames: ['platform'] as const,
    buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [registry],
  }),
}

// Gauges
const gauges = {
  schedulerLag: new client.Gauge({
    name: 'insights_scheduler_lag_seconds',
    help: 'Lag seconds of scheduled item at pickup',
    labelNames: ['queue'] as const,
    registers: [registry],
  }),
  schedulerInflight: new client.Gauge({
    name: 'insights_scheduler_inflight',
    help: 'Items currently being processed by scheduler',
    labelNames: ['queue'] as const,
    registers: [registry],
  }),
}

export const prom = { counters, histograms, gauges }

// Debug API 429s counter
counters.debugApiRateLimited = new client.Counter({
  name: 'social_debug_api_rate_limited_total',
  help: 'Number of 429 responses from /api/debug/*',
  labelNames: ['route'] as const,
  registers: [registry],
}) as any

// Twitter insights fetch counter
counters.twitterInsightsFetch = new client.Counter({
  name: 'social_twitter_insights_fetch_total',
  help: 'Twitter insights fetch attempts',
  labelNames: ['kind'] as const,
  registers: [registry],
}) as any

// Generic insights metrics (platform-agnostic)
counters.insightsFetch = new client.Counter({
  name: 'social_insights_fetch_total',
  help: 'Insights fetch attempts',
  labelNames: ['platform','kind','status'] as const,
  registers: [registry],
}) as any

counters.insightsItemsFetched = new client.Counter({
  name: 'social_insights_items_fetched_total',
  help: 'Insights items fetched',
  labelNames: ['platform','kind'] as const,
  registers: [registry],
}) as any

counters.insightsQuotaHits = new client.Counter({
  name: 'social_insights_quota_hits_total',
  help: 'Quota/rate-limit hits while fetching insights',
  labelNames: ['platform'] as const,
  registers: [registry],
}) as any

// Scheduler runs counter
counters.schedulerRuns = new client.Counter({
  name: 'insights_scheduler_runs_total',
  help: 'Number of scheduler processing runs',
  labelNames: ['queue'] as const,
  registers: [registry],
}) as any

// LLM requests + tokens
counters.llmRequests = new client.Counter({
  name: 'llm_requests_total',
  help: 'LLM requests (by provider and status)',
  labelNames: ['provider','status'] as const,
  registers: [registry],
}) as any

counters.llmTokens = new client.Counter({
  name: 'llm_tokens_total',
  help: 'LLM tokens by provider and kind (input|output)',
  labelNames: ['provider','kind'] as const,
  registers: [registry],
}) as any

// Summarizer jobs & errors
counters.aiSummaryJobs = new client.Counter({
  name: 'ai_summary_jobs_total',
  help: 'AI insights summarizer jobs processed',
  labelNames: ['platform','status'] as const,
  registers: [registry],
}) as any

counters.aiSummaryErrors = new client.Counter({
  name: 'ai_summary_errors_total',
  help: 'AI insights summarizer errors',
  labelNames: ['platform','reason'] as const,
  registers: [registry],
}) as any

// Twitter track debug mutations
counters.twitterTrackMutations = new client.Counter({
  name: 'social_twitter_track_mutations_total',
  help: 'Debug API Twitter track mutations',
  labelNames: ['method'] as const,
  registers: [registry],
}) as any
