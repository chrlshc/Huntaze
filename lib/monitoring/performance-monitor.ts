'use client';

interface MetricSummary {
  avg: number;
  min: number;
  max: number;
  count: number;
}

export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static recordMetric(name: string, value: number) {
    const current = this.metrics.get(name) ?? [];
    current.push(value);
    if (current.length > 100) current.shift();
    this.metrics.set(name, current);
  }

  static getMetrics(name: string): MetricSummary {
    const values = this.metrics.get(name) ?? [];
    if (!values.length) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    const total = values.reduce((acc, value) => acc + value, 0);
    return {
      avg: total / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  static async flush() {
    if (!this.metrics.size) return;
    const payload: Record<string, MetricSummary> = {};
    for (const [name] of this.metrics.entries()) {
      payload[name] = this.getMetrics(name);
    }

    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics: payload, timestamp: new Date().toISOString() }),
        credentials: 'include',
      });
      this.metrics.clear();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to send performance metrics', error);
      }
    }
  }
}
