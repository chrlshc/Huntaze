/**
 * Client-side metrics collection
 * Sends metrics to API endpoint which forwards to CloudWatch
 */

export interface ClientMetric {
  metricName: string;
  value: number;
  unit: 'Milliseconds' | 'Count' | 'Percent' | 'Bytes';
  dimensions?: Record<string, string>;
}

/**
 * Send metric from client to CloudWatch via API
 */
export async function sendMetric(metric: ClientMetric): Promise<void> {
  try {
    await fetch('/api/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metric),
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.debug('Failed to send metric:', error);
  }
}

/**
 * Send multiple metrics in batch
 */
export async function sendMetricsBatch(metrics: ClientMetric[]): Promise<void> {
  try {
    await fetch('/api/metrics/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metrics }),
    });
  } catch (error) {
    console.debug('Failed to send metrics batch:', error);
  }
}
