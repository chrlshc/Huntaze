// OnlyFans Monitoring & Metrics

// Mock implementations for testing without external dependencies
class MockMetric {
  inc(labels?: Record<string, string>) {}
  startTimer() {
    return () => {};
  }
}

export const registry = {
  metrics: async () => '# Mock metrics'
};

export const ofCampaignsSent = new MockMetric();
export const ofMessageDuration = new MockMetric();
export const ofRateLimitHits = new MockMetric();
export const ofActiveSessions = new MockMetric();

export function tracedOnlyFansCall<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  // Simple tracing without Sentry for now
  const start = Date.now();
  return fn()
    .then(result => {
      const duration = Date.now() - start;
      console.log(`[TRACE] ${operationName} completed in ${duration}ms`);
      return result;
    })
    .catch(error => {
      console.error(`[TRACE] ${operationName} failed:`, error.message);
      throw error;
    });
}

// Export metrics as text for Prometheus scraping
export const getMetricsText = async () => registry.metrics();
