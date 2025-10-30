// Lightweight observability bootstrap with request correlation and EMF metrics
// - Adds/propagates X-Request-Id
// - Logs structured request entries
// - Emits EMF-compatible JSON for CloudWatch metric extraction

type Handler = (req: Request) => Promise<Response>

export type MonitorOpts = {
  sse?: boolean // hint for streaming responses; do not alter body
  rawBody?: boolean // hint for raw bodies (e.g., Stripe); do not touch body
  route?: string // optional override for displayed operation name
  // Optional categorization for domain/feature level KPIs
  domain?: 'onboarding' | 'analytics' | 'ai-team' | 'crm' | 'core'
  feature?: string
  // Optionally resolve a user id (for DAU/WAU/adoption)
  getUserId?: (req: Request) => Promise<string | undefined> | string | undefined
}

function getRequestId(req: Request): string {
  const id = (req.headers.get('x-request-id') || req.headers.get('X-Request-Id'))?.toString()
  if (id && id.trim()) return id
  const g = (globalThis as any)
  if (g.crypto?.randomUUID) return g.crypto.randomUUID()
  try {
     
    const { randomUUID } = require('crypto') as typeof import('crypto')
    return randomUUID()
  } catch {
    return `req-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
  }
}

function logStructured(payload: Record<string, unknown>) {
  try {
    // Keep single-line JSON for ingestion systems
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload))
  } catch {
    // noop
  }
}

function emitEMF(namespace: string, metrics: Array<{ name: string; unit: string; value: number }>, dimensions: Record<string, string>) {
  const baseDims = { Environment: process.env.NODE_ENV || 'development', ...dimensions }
  const dimensionKeys = Object.keys(baseDims)
  const emf = {
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [
        {
          Namespace: namespace,
          Dimensions: [dimensionKeys],
          Metrics: metrics.map((m) => ({ Name: m.name, Unit: m.unit })),
        },
      ],
    },
    ...baseDims,
  } as Record<string, unknown>

  for (const m of metrics) emf[m.name] = m.value

  logStructured(emf)
}

export function withMonitoring(nameOrHandler: string | Handler, maybeHandler?: Handler, opts?: MonitorOpts): Handler {
  const hasName = typeof nameOrHandler === 'string'
  const name = hasName ? (nameOrHandler as string) : undefined
  const handler: Handler = (hasName ? (maybeHandler as Handler) : (nameOrHandler as Handler))

  return async (req: Request): Promise<Response> => {
    const startedAt = Date.now()
    const url = new URL(req.url)
    const path = url.pathname
    const operation = opts?.route || name || path
    const method = (req as any).method || 'POST'
    const requestId = getRequestId(req)

    // Stash requestId for simple per-request correlation in logs
    ;(globalThis as any)['__currentRequestId'] = requestId

    try {
      const res = await handler(req)
      const duration = Date.now() - startedAt

      // Ensure request id is visible to clients and downstream hops
      try { res.headers.set('X-Request-Id', requestId) } catch {}

      // Structured access log
      let userId: string | undefined = undefined
      try {
        const maybe = opts?.getUserId?.(req)
        userId = typeof (maybe as any)?.then === 'function' ? await (maybe as any) : (maybe as any)
      } catch {}
      logStructured({
        level: 'info',
        event: 'api_request',
        service: process.env.MONITORING_SERVICE || 'api',
        route: path,
        operation,
        domain: opts?.domain,
        feature: opts?.feature,
        method,
        status: res.status,
        duration_ms: duration,
        requestId,
        userId,
        timestamp: new Date().toISOString(),
      })

      // EMF: count + latency (namespace aligned with runbook examples)
      emitEMF(process.env.MONITORING_NAMESPACE || 'Hunt/CIN', [
        { name: 'HttpRequests', unit: 'Count', value: 1 },
        { name: 'HttpLatencyMs', unit: 'Milliseconds', value: duration },
      ], {
        Service: process.env.MONITORING_SERVICE || 'cin-api',
        Route: path,
        Method: method,
        Status: String(res.status),
      })

      return res
    } catch (err) {
      const duration = Date.now() - startedAt
      const message = err instanceof Error ? err.message : 'unknown_error'
      const nameErr = err instanceof Error ? err.name : 'Error'
      const stack = err instanceof Error ? err.stack : undefined

      logStructured({
        level: 'error',
        event: 'api_error',
        service: process.env.MONITORING_SERVICE || 'api',
        route: path,
        operation,
        domain: opts?.domain,
        feature: opts?.feature,
        method,
        error: message,
        error_name: nameErr,
        stack,
        duration_ms: duration,
        requestId,
        timestamp: new Date().toISOString(),
      })

      emitEMF(process.env.MONITORING_NAMESPACE || 'Hunt/CIN', [
        { name: 'HttpRequests', unit: 'Count', value: 1 },
        { name: 'HttpLatencyMs', unit: 'Milliseconds', value: duration },
      ], {
        Service: process.env.MONITORING_SERVICE || 'cin-api',
        Route: path,
        Method: method,
        Status: '500',
      })

      const res = new Response(JSON.stringify({ error: 'Internal Server Error', requestId }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8', 'X-Request-Id': requestId },
      })
      return res
    } finally {
      delete (globalThis as any)['__currentRequestId']
    }
  }
}

// No-op placeholder to align with starter usage; can be expanded for X-Ray, etc.
export async function initObservability() {
  return
}
