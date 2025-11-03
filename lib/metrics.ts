// Simple EMF metrics emitter usable from both server routes and Node libs
export type Metric = { name: string; unit: string; value: number }
import { prom } from '../src/lib/prom'

export function emitMetric(namespace: string, metrics: Metric[], dimensions: Record<string, string | number | boolean>) {
  try {
    const baseDims: Record<string, string> = { Environment: process.env.NODE_ENV || 'development' }
    for (const [k, v] of Object.entries(dimensions || {})) baseDims[k] = String(v)
    const dimensionKeys = Object.keys(baseDims)
    const emf: Record<string, unknown> = {
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          { Namespace: namespace, Dimensions: [dimensionKeys], Metrics: metrics.map((m) => ({ Name: m.name, Unit: m.unit })) },
        ],
      },
      ...baseDims,
    }
    for (const m of metrics) emf[m.name] = m.value
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(emf))

    // Mirror to Prometheus where applicable
    for (const m of metrics) {
      // Counters
      if (m.name === 'social_tiktok_status_fetch_total') {
        const status = String((dimensions as any).status ?? 'unknown')
        prom.counters.tiktokStatusFetch.labels({ status }).inc(m.value)
      }
      if (m.name === 'social_tiktok_webhook_events_total') {
        const type = String((dimensions as any).type ?? 'unknown')
        prom.counters.tiktokWebhookEvents.labels({ type }).inc(m.value)
      }
      if (m.name === 'social_rate_limit_hits_total') {
        const platform = String((dimensions as any).platform ?? 'unknown')
        prom.counters.rateLimitHits.labels({ platform }).inc(m.value)
      }
      if (m.name === 'social_publish_inflight') {
        const platform = String((dimensions as any).platform ?? 'unknown')
        prom.counters.publishInflight.labels({ platform }).inc(m.value)
      }
      if (m.name === 'social_tiktok_publish_requests_total') {
        const result = String((dimensions as any).result ?? 'unknown')
        prom.counters.publishRequests.labels({ result }).inc(m.value)
      }

      // Histograms (ms -> seconds)
      if (m.name === 'social_status_poll_latency_ms') {
        const platform = String((dimensions as any).platform ?? 'unknown')
        prom.histograms.statusPollLatency.labels({ platform }).observe(m.value / 1000)
      }
      if (m.name === 'social_publish_time_ms') {
        const platform = String((dimensions as any).platform ?? 'unknown')
        prom.histograms.publishTime.labels({ platform }).observe(m.value / 1000)
      }
      if (m.name === 'social_twitter_insights_fetch_total') {
        const kind = String((dimensions as any).kind ?? 'unknown')
        prom.counters.twitterInsightsFetch.labels({ kind }).inc(m.value)
      }
      if (m.name === 'social_insights_fetch_latency_ms') {
        const platform = String((dimensions as any).platform ?? 'unknown')
        const kind = String((dimensions as any).kind ?? 'unknown')
        prom.histograms.insightsFetchLatency.labels({ platform, kind }).observe(m.value / 1000)
      }
      if (m.name === 'social_insights_fetch_total') {
        const platform = String((dimensions as any).platform ?? 'unknown')
        const kind = String((dimensions as any).kind ?? 'unknown')
        const status = String((dimensions as any).status ?? 'ok')
        ;(prom.counters as any).insightsFetch.labels({ platform, kind, status }).inc(m.value)
      }
      if (m.name === 'social_insights_items_fetched_total') {
        const platform = String((dimensions as any).platform ?? 'unknown')
        const kind = String((dimensions as any).kind ?? 'unknown')
        ;(prom.counters as any).insightsItemsFetched.labels({ platform, kind }).inc(m.value)
      }
      if (m.name === 'social_insights_quota_hits_total') {
        const platform = String((dimensions as any).platform ?? 'unknown')
        ;(prom.counters as any).insightsQuotaHits.labels({ platform }).inc(m.value)
      }
    }
  } catch {
    // noop
  }
}

export function incCounter(name: string, dimensions: Record<string, string | number | boolean> = {}, ns = 'Hunt/Social') {
  emitMetric(ns, [{ name, unit: 'Count', value: 1 }], dimensions)
}

export function observeMs(name: string, ms: number, dimensions: Record<string, string | number | boolean> = {}, ns = 'Hunt/Social') {
  emitMetric(ns, [{ name, unit: 'Milliseconds', value: ms }], dimensions)
}

export function setGauge(name: string, value: number, dimensions: Record<string, string | number | boolean> = {}, ns = 'Hunt/Social') {
  emitMetric(ns, [{ name, unit: 'Count', value: value }], dimensions)
}
