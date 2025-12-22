/**
 * Dashboard Service
 * Content & Trends AI Engine - Phase 6
 * 
 * Custom dashboards for viral prediction accuracy,
 * content generation quality, and AI model performance.
 */

import {
  Dashboard,
  DashboardWidget,
  DashboardService,
  TimeRange,
  WidgetType,
  MetricValue,
} from './types';

// ============================================================================
// Dashboard Service Implementation
// ============================================================================

export class ContentTrendsDashboardService implements DashboardService {
  private dashboards: Map<string, Dashboard> = new Map();
  private metricsStore: Map<string, MetricValue[]> = new Map();

  constructor() {
    this.initializeDefaultDashboards();
  }

  /**
   * Create a new dashboard
   */
  async createDashboard(dashboard: Dashboard): Promise<void> {
    this.dashboards.set(dashboard.id, dashboard);
  }

  /**
   * Update an existing dashboard
   */
  async updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Promise<void> {
    const existing = this.dashboards.get(dashboardId);
    if (!existing) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }
    this.dashboards.set(dashboardId, { ...existing, ...updates });
  }

  /**
   * Delete a dashboard
   */
  async deleteDashboard(dashboardId: string): Promise<void> {
    this.dashboards.delete(dashboardId);
  }

  /**
   * Get a dashboard by ID
   */
  async getDashboard(dashboardId: string): Promise<Dashboard | null> {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * List all dashboards
   */
  async listDashboards(): Promise<Dashboard[]> {
    return Array.from(this.dashboards.values());
  }

  /**
   * Get data for a widget
   */
  async getWidgetData(widget: DashboardWidget, timeRange: TimeRange): Promise<unknown> {
    const { startTime, endTime } = this.resolveTimeRange(timeRange);

    switch (widget.type) {
      case 'metric_card':
        return this.getMetricCardData(widget, startTime, endTime);
      case 'line_chart':
        return this.getLineChartData(widget, startTime, endTime);
      case 'bar_chart':
        return this.getBarChartData(widget, startTime, endTime);
      case 'pie_chart':
        return this.getPieChartData(widget, startTime, endTime);
      case 'table':
        return this.getTableData(widget, startTime, endTime);
      case 'gauge':
        return this.getGaugeData(widget, startTime, endTime);
      default:
        return null;
    }
  }

  /**
   * Ingest metric for dashboard display
   */
  ingestMetric(metric: MetricValue): void {
    const key = metric.name;
    const existing = this.metricsStore.get(key) || [];
    existing.push(metric);

    // Keep only last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filtered = existing.filter(m => m.timestamp > oneDayAgo);
    this.metricsStore.set(key, filtered);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private initializeDefaultDashboards(): void {
    // AI Model Performance Dashboard
    const aiModelDashboard: Dashboard = {
      id: 'ai-model-performance',
      name: 'AI Model Performance',
      description: 'Monitor AI model latency, token consumption, and error rates',
      refreshIntervalSeconds: 30,
      timeRange: { type: 'relative', relativeMinutes: 60 },
      filters: [],
      widgets: [
        {
          id: 'total-requests',
          type: 'metric_card',
          title: 'Total Requests',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: { metrics: ['ai.model.requests'], aggregation: 'sum' },
        },
        {
          id: 'success-rate',
          type: 'gauge',
          title: 'Success Rate',
          position: { x: 3, y: 0, width: 3, height: 2 },
          config: {
            metrics: ['ai.model.success_rate'],
            aggregation: 'average',
            thresholds: [
              { value: 95, color: '#28a745', label: 'Good' },
              { value: 90, color: '#ffc107', label: 'Warning' },
              { value: 0, color: '#dc3545', label: 'Critical' },
            ],
          },
        },
        {
          id: 'avg-latency',
          type: 'metric_card',
          title: 'Avg Latency (ms)',
          position: { x: 6, y: 0, width: 3, height: 2 },
          config: { metrics: ['ai.model.latency.avg'], aggregation: 'average' },
        },
        {
          id: 'total-tokens',
          type: 'metric_card',
          title: 'Total Tokens',
          position: { x: 9, y: 0, width: 3, height: 2 },
          config: { metrics: ['ai.model.tokens.total'], aggregation: 'sum' },
        },
        {
          id: 'latency-trend',
          type: 'line_chart',
          title: 'Latency Trend',
          position: { x: 0, y: 2, width: 6, height: 4 },
          config: {
            metrics: ['ai.model.latency.avg', 'ai.model.latency.p95', 'ai.model.latency.p99'],
            groupBy: ['modelName'],
          },
        },
        {
          id: 'requests-by-model',
          type: 'bar_chart',
          title: 'Requests by Model',
          position: { x: 6, y: 2, width: 6, height: 4 },
          config: { metrics: ['ai.model.requests'], groupBy: ['modelName'] },
        },
      ],
    };

    // Viral Prediction Dashboard
    const viralPredictionDashboard: Dashboard = {
      id: 'viral-prediction',
      name: 'Viral Prediction Accuracy',
      description: 'Track viral prediction accuracy and confidence metrics',
      refreshIntervalSeconds: 60,
      timeRange: { type: 'relative', relativeMinutes: 1440 },
      filters: [],
      widgets: [
        {
          id: 'accuracy-rate',
          type: 'gauge',
          title: 'Prediction Accuracy',
          position: { x: 0, y: 0, width: 4, height: 3 },
          config: {
            metrics: ['viral.predictions.accuracy'],
            aggregation: 'average',
            thresholds: [
              { value: 75, color: '#28a745', label: 'Target Met' },
              { value: 60, color: '#ffc107', label: 'Below Target' },
              { value: 0, color: '#dc3545', label: 'Critical' },
            ],
          },
        },
        {
          id: 'total-predictions',
          type: 'metric_card',
          title: 'Total Predictions',
          position: { x: 4, y: 0, width: 4, height: 3 },
          config: { metrics: ['viral.predictions.total'], aggregation: 'sum' },
        },
        {
          id: 'avg-confidence',
          type: 'metric_card',
          title: 'Avg Confidence',
          position: { x: 8, y: 0, width: 4, height: 3 },
          config: { metrics: ['viral.predictions.confidence.avg'], aggregation: 'average' },
        },
        {
          id: 'accuracy-trend',
          type: 'line_chart',
          title: 'Accuracy Trend',
          position: { x: 0, y: 3, width: 8, height: 4 },
          config: { metrics: ['viral.predictions.accuracy'] },
        },
        {
          id: 'predictions-by-category',
          type: 'pie_chart',
          title: 'Predictions by Category',
          position: { x: 8, y: 3, width: 4, height: 4 },
          config: { metrics: ['viral.predictions.by_category'], groupBy: ['category'] },
        },
      ],
    };

    // Content Generation Dashboard
    const contentGenerationDashboard: Dashboard = {
      id: 'content-generation',
      name: 'Content Generation Quality',
      description: 'Monitor content generation quality and performance',
      refreshIntervalSeconds: 60,
      timeRange: { type: 'relative', relativeMinutes: 1440 },
      filters: [],
      widgets: [
        {
          id: 'quality-score',
          type: 'gauge',
          title: 'Quality Score',
          position: { x: 0, y: 0, width: 4, height: 3 },
          config: {
            metrics: ['content.quality.avg'],
            aggregation: 'average',
            thresholds: [
              { value: 8, color: '#28a745', label: 'Excellent' },
              { value: 6, color: '#ffc107', label: 'Good' },
              { value: 0, color: '#dc3545', label: 'Needs Improvement' },
            ],
          },
        },
        {
          id: 'brand-alignment',
          type: 'gauge',
          title: 'Brand Alignment',
          position: { x: 4, y: 0, width: 4, height: 3 },
          config: { metrics: ['content.brand_alignment.avg'], aggregation: 'average' },
        },
        {
          id: 'total-generations',
          type: 'metric_card',
          title: 'Total Generations',
          position: { x: 8, y: 0, width: 4, height: 3 },
          config: { metrics: ['content.generations.total'], aggregation: 'sum' },
        },
        {
          id: 'generation-time-trend',
          type: 'line_chart',
          title: 'Generation Time Trend',
          position: { x: 0, y: 3, width: 6, height: 4 },
          config: { metrics: ['content.generation_time.avg'] },
        },
        {
          id: 'generations-by-type',
          type: 'bar_chart',
          title: 'Generations by Type',
          position: { x: 6, y: 3, width: 6, height: 4 },
          config: { metrics: ['content.generations.by_type'], groupBy: ['type'] },
        },
      ],
    };

    this.dashboards.set(aiModelDashboard.id, aiModelDashboard);
    this.dashboards.set(viralPredictionDashboard.id, viralPredictionDashboard);
    this.dashboards.set(contentGenerationDashboard.id, contentGenerationDashboard);
  }

  private resolveTimeRange(timeRange: TimeRange): { startTime: Date; endTime: Date } {
    if (timeRange.type === 'absolute' && timeRange.startTime && timeRange.endTime) {
      return { startTime: timeRange.startTime, endTime: timeRange.endTime };
    }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (timeRange.relativeMinutes || 60) * 60 * 1000);
    return { startTime, endTime };
  }

  private getMetricCardData(widget: DashboardWidget, startTime: Date, endTime: Date): unknown {
    const metricName = widget.config.metrics[0];
    const metrics = this.getMetricsInRange(metricName, startTime, endTime);
    const value = this.aggregate(metrics, widget.config.aggregation || 'average');
    return { value, unit: metrics[0]?.unit || 'count' };
  }

  private getLineChartData(widget: DashboardWidget, startTime: Date, endTime: Date): unknown {
    const series: { name: string; data: { timestamp: Date; value: number }[] }[] = [];

    for (const metricName of widget.config.metrics) {
      const metrics = this.getMetricsInRange(metricName, startTime, endTime);
      series.push({
        name: metricName,
        data: metrics.map(m => ({ timestamp: m.timestamp, value: m.value })),
      });
    }

    return { series };
  }

  private getBarChartData(widget: DashboardWidget, startTime: Date, endTime: Date): unknown {
    const metricName = widget.config.metrics[0];
    const metrics = this.getMetricsInRange(metricName, startTime, endTime);
    const groupBy = widget.config.groupBy?.[0];

    if (!groupBy) {
      return { categories: [metricName], values: [this.aggregate(metrics, 'sum')] };
    }

    const grouped = new Map<string, number>();
    for (const metric of metrics) {
      const key = metric.dimensions[groupBy] || 'unknown';
      grouped.set(key, (grouped.get(key) || 0) + metric.value);
    }

    return {
      categories: Array.from(grouped.keys()),
      values: Array.from(grouped.values()),
    };
  }

  private getPieChartData(widget: DashboardWidget, startTime: Date, endTime: Date): unknown {
    return this.getBarChartData(widget, startTime, endTime);
  }

  private getTableData(widget: DashboardWidget, startTime: Date, endTime: Date): unknown {
    const metricName = widget.config.metrics[0];
    const metrics = this.getMetricsInRange(metricName, startTime, endTime);
    return { rows: metrics.slice(-100) };
  }

  private getGaugeData(widget: DashboardWidget, startTime: Date, endTime: Date): unknown {
    const data = this.getMetricCardData(widget, startTime, endTime) as { value: number };
    return { ...data, thresholds: widget.config.thresholds };
  }

  private getMetricsInRange(metricName: string, startTime: Date, endTime: Date): MetricValue[] {
    const metrics = this.metricsStore.get(metricName) || [];
    return metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  private aggregate(metrics: MetricValue[], aggregation: string): number {
    if (metrics.length === 0) return 0;
    const values = metrics.map(m => m.value);

    switch (aggregation) {
      case 'sum': return values.reduce((a, b) => a + b, 0);
      case 'average': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min': return Math.min(...values);
      case 'max': return Math.max(...values);
      case 'count': return values.length;
      default: return values.reduce((a, b) => a + b, 0) / values.length;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createDashboardService(): ContentTrendsDashboardService {
  return new ContentTrendsDashboardService();
}
