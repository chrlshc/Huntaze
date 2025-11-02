import { NextResponse } from 'next/server';
import { metrics } from '@/lib/utils/metrics';

interface MetricData {
  timestamp: string;
  metric: string;
  value: number;
  tags?: Record<string, string>;
}

/**
 * GET /api/monitoring/metrics
 * Returns current metrics and summary
 */
export async function GET() {
  try {
    const recentMetrics = metrics.getRecentMetrics(200);
    
    // Calculate summary by platform
    const summary = {
      oauth: {
        success: {} as Record<string, number>,
        failure: {} as Record<string, number>,
      },
      upload: {
        success: {} as Record<string, number>,
        failure: {} as Record<string, number>,
      },
      webhook: {
        received: {} as Record<string, number>,
        processed: {} as Record<string, number>,
        avgLatency: {} as Record<string, number>,
      },
      tokenRefresh: {
        success: {} as Record<string, number>,
        failure: {} as Record<string, number>,
      },
    };

    const latencies: Record<string, number[]> = {};

    for (const metric of recentMetrics) {
      const platform = metric.tags?.platform || 'unknown';

      // OAuth metrics
      if (metric.metric === 'oauth.success') {
        summary.oauth.success[platform] = (summary.oauth.success[platform] || 0) + metric.value;
      } else if (metric.metric === 'oauth.failure') {
        summary.oauth.failure[platform] = (summary.oauth.failure[platform] || 0) + metric.value;
      }

      // Upload metrics
      else if (metric.metric === 'upload.success') {
        summary.upload.success[platform] = (summary.upload.success[platform] || 0) + metric.value;
      } else if (metric.metric === 'upload.failure') {
        summary.upload.failure[platform] = (summary.upload.failure[platform] || 0) + metric.value;
      }

      // Webhook metrics
      else if (metric.metric === 'webhook.received') {
        summary.webhook.received[platform] = (summary.webhook.received[platform] || 0) + metric.value;
      } else if (metric.metric === 'webhook.processed') {
        summary.webhook.processed[platform] = (summary.webhook.processed[platform] || 0) + metric.value;
      } else if (metric.metric === 'webhook.latency') {
        if (!latencies[platform]) {
          latencies[platform] = [];
        }
        latencies[platform].push(metric.value);
      }

      // Token refresh metrics
      else if (metric.metric === 'token.refresh.success') {
        summary.tokenRefresh.success[platform] = (summary.tokenRefresh.success[platform] || 0) + metric.value;
      } else if (metric.metric === 'token.refresh.failure') {
        summary.tokenRefresh.failure[platform] = (summary.tokenRefresh.failure[platform] || 0) + metric.value;
      }
    }

    // Calculate average latencies
    for (const [platform, values] of Object.entries(latencies)) {
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        summary.webhook.avgLatency[platform] = avg;
      }
    }

    return NextResponse.json({
      metrics: recentMetrics,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}
