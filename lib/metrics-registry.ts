import 'server-only';

/**
 * Centralized Prometheus client registry with lazy initialization
 * Ensures prom-client is only loaded at runtime and metrics are idempotent
 */

let promP: Promise<typeof import('prom-client')> | undefined;

/**
 * Get the Prometheus client instance (lazy loaded, cached)
 * Automatically collects default metrics on first call
 */
export async function prom() {
  promP ||= (async () => {
    const p = await import('prom-client');
    // Idempotent: collectDefaultMetrics only runs once per process
    p.collectDefaultMetrics();
    return p;
  })();
  return promP;
}

/**
 * Get or create a Counter metric (idempotent)
 * Reuses existing metric if already registered
 */
export async function getOrCreateCounter(
  name: string,
  help: string,
  labelNames?: string[]
) {
  const p = await prom();
  const existing = p.register.getSingleMetric(name);
  if (existing) return existing as InstanceType<typeof p.Counter>;
  
  return new p.Counter({ name, help, labelNames });
}

/**
 * Get or create a Histogram metric (idempotent)
 * Reuses existing metric if already registered
 */
export async function getOrCreateHistogram(
  name: string,
  help: string,
  labelNames?: string[],
  buckets?: number[]
) {
  const p = await prom();
  const existing = p.register.getSingleMetric(name);
  if (existing) return existing as InstanceType<typeof p.Histogram>;
  
  return new p.Histogram({ name, help, labelNames, buckets });
}

/**
 * Get or create a Gauge metric (idempotent)
 * Reuses existing metric if already registered
 */
export async function getOrCreateGauge(
  name: string,
  help: string,
  labelNames?: string[]
) {
  const p = await prom();
  const existing = p.register.getSingleMetric(name);
  if (existing) return existing as InstanceType<typeof p.Gauge>;
  
  return new p.Gauge({ name, help, labelNames });
}

/**
 * Get the Prometheus registry for metrics export
 */
export async function getRegistry() {
  const p = await prom();
  return p.register;
}

/**
 * Get the Prometheus content type for HTTP responses
 */
export async function getContentType() {
  const p = await prom();
  return p.contentType;
}
