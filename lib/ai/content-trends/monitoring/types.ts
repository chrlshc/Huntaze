/**
 * Monitoring and Observability Types
 * Content & Trends AI Engine - Phase 6
 * 
 * Type definitions for Azure Monitor integration, metrics collection,
 * alerting, and dashboards.
 */

// ============================================================================
// Metrics Types
// ============================================================================

export interface MetricValue {
  name: string;
  value: number;
  timestamp: Date;
  dimensions: Record<string, string>;
  unit: MetricUnit;
}

export type MetricUnit =
  | 'count'
  | 'bytes'
  | 'milliseconds'
  | 'seconds'
  | 'percent'
  | 'tokens'
  | 'requests'
  | 'errors';

export interface MetricDefinition {
  name: string;
  displayName: string;
  description: string;
  unit: MetricUnit;
  aggregationType: AggregationType;
  dimensions: string[];
}

export type AggregationType = 'sum' | 'average' | 'min' | 'max' | 'count' | 'percentile';

// ============================================================================
// AI Model Metrics
// ============================================================================

export interface AIModelMetrics {
  modelId: string;
  modelName: string;
  timestamp: Date;
  requestCount: number;
  successCount: number;
  failureCount: number;
  totalTokensConsumed: number;
  inputTokens: number;
  outputTokens: number;
  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  costUsd: number;
  errorRate: number;
}

export interface ViralPredictionMetrics {
  timestamp: Date;
  totalPredictions: number;
  accuratePredictions: number;
  accuracyRate: number;
  averageConfidence: number;
  predictionsByCategory: Record<string, number>;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

export interface ContentGenerationMetrics {
  timestamp: Date;
  totalGenerations: number;
  averageQualityScore: number;
  brandAlignmentScore: number;
  generationsByType: Record<string, number>;
  averageGenerationTimeMs: number;
  rejectionRate: number;
}

// ============================================================================
// Alerting Types
// ============================================================================

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: AlertSeverity;
  condition: AlertCondition;
  actions: AlertAction[];
  cooldownMinutes: number;
  evaluationFrequencyMinutes: number;
}

export type AlertSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface AlertCondition {
  metricName: string;
  operator: ComparisonOperator;
  threshold: number;
  aggregation: AggregationType;
  windowMinutes: number;
  dimensions?: Record<string, string>;
}

export type ComparisonOperator = 
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'equal'
  | 'not_equal';

export interface AlertAction {
  type: AlertActionType;
  config: Record<string, unknown>;
}

export type AlertActionType = 
  | 'email'
  | 'webhook'
  | 'slack'
  | 'teams'
  | 'pagerduty'
  | 'azure_action_group';

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  firedAt: Date;
  resolvedAt?: Date;
  metricValue: number;
  threshold: number;
  description: string;
  dimensions: Record<string, string>;
}

export type AlertStatus = 'firing' | 'resolved' | 'acknowledged' | 'suppressed';

// ============================================================================
// Dashboard Types
// ============================================================================

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  refreshIntervalSeconds: number;
  timeRange: TimeRange;
  filters: DashboardFilter[];
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: WidgetConfig;
}

export type WidgetType = 
  | 'metric_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'table'
  | 'heatmap'
  | 'gauge'
  | 'text';

export interface WidgetConfig {
  metrics: string[];
  aggregation?: AggregationType;
  groupBy?: string[];
  filters?: Record<string, string>;
  thresholds?: WidgetThreshold[];
  displayOptions?: Record<string, unknown>;
}

export interface WidgetThreshold {
  value: number;
  color: string;
  label?: string;
}

export interface TimeRange {
  type: 'relative' | 'absolute';
  relativeMinutes?: number;
  startTime?: Date;
  endTime?: Date;
}

export interface DashboardFilter {
  field: string;
  operator: ComparisonOperator;
  value: string | number;
}

// ============================================================================
// Performance Baseline Types
// ============================================================================

export interface PerformanceBaseline {
  metricName: string;
  baselineValue: number;
  standardDeviation: number;
  calculatedAt: Date;
  sampleCount: number;
  percentiles: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export interface AnomalyDetectionResult {
  metricName: string;
  timestamp: Date;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  isAnomaly: boolean;
  anomalyScore: number;
  direction: 'above' | 'below' | 'normal';
}

// ============================================================================
// Azure Monitor Types
// ============================================================================

export interface AzureMonitorConfig {
  workspaceId: string;
  instrumentationKey: string;
  connectionString: string;
  resourceId: string;
  enableLiveMetrics: boolean;
  samplingPercentage: number;
}

export interface CustomEvent {
  name: string;
  properties: Record<string, string>;
  measurements: Record<string, number>;
  timestamp: Date;
}

export interface Trace {
  message: string;
  severityLevel: TraceSeverity;
  properties: Record<string, string>;
  timestamp: Date;
}

export type TraceSeverity = 'verbose' | 'information' | 'warning' | 'error' | 'critical';

// ============================================================================
// Service Interfaces
// ============================================================================

export interface MetricsCollector {
  recordMetric(metric: MetricValue): void;
  recordAIModelMetrics(metrics: AIModelMetrics): void;
  recordViralPredictionMetrics(metrics: ViralPredictionMetrics): void;
  recordContentGenerationMetrics(metrics: ContentGenerationMetrics): void;
  flush(): Promise<void>;
}

export interface AlertingService {
  createRule(rule: AlertRule): Promise<void>;
  updateRule(ruleId: string, updates: Partial<AlertRule>): Promise<void>;
  deleteRule(ruleId: string): Promise<void>;
  evaluateRules(): Promise<Alert[]>;
  acknowledgeAlert(alertId: string): Promise<void>;
  getActiveAlerts(): Promise<Alert[]>;
}

export interface DashboardService {
  createDashboard(dashboard: Dashboard): Promise<void>;
  updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Promise<void>;
  deleteDashboard(dashboardId: string): Promise<void>;
  getDashboard(dashboardId: string): Promise<Dashboard | null>;
  listDashboards(): Promise<Dashboard[]>;
  getWidgetData(widget: DashboardWidget, timeRange: TimeRange): Promise<unknown>;
}
