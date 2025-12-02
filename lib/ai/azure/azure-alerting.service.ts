/**
 * Azure Alerting Service
 * Implements alert rules, dashboards, and notifications for Azure AI operations
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 35: Set up alerting and dashboards
 * Validates: Requirements 5.2, 11.2
 */

import { CostThreshold, CostAlert } from './azure-cost-reporting.service';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: AlertType;
  condition: AlertCondition;
  severity: AlertSeverity;
  enabled: boolean;
  actions: AlertAction[];
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export type AlertType = 
  | 'cost_threshold'
  | 'latency_sla'
  | 'error_rate'
  | 'circuit_breaker'
  | 'quota_usage'
  | 'availability';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  threshold: number;
  windowMinutes: number;
  aggregation: 'avg' | 'sum' | 'max' | 'min' | 'count';
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'pagerduty' | 'log';
  target: string;
  config?: Record<string, string>;
}

export interface AlertInstance {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  timestamp: Date;
  resolvedAt?: Date;
  status: 'firing' | 'resolved';
  message: string;
  metricValue: number;
  threshold: number;
  dimensions: Record<string, string>;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  refreshIntervalSeconds: number;
  timeRange: TimeRange;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; width: number; height: number };
  query: MetricQuery;
  visualization: VisualizationConfig;
}

export type WidgetType = 'line_chart' | 'bar_chart' | 'gauge' | 'stat' | 'table' | 'heatmap';

export interface MetricQuery {
  metric: string;
  aggregation: 'avg' | 'sum' | 'max' | 'min' | 'count' | 'p50' | 'p95' | 'p99';
  groupBy?: string[];
  filters?: Record<string, string>;
}

export interface VisualizationConfig {
  colorScheme?: string;
  thresholds?: { value: number; color: string }[];
  unit?: string;
  decimals?: number;
}

export interface TimeRange {
  from: string; // e.g., 'now-1h', 'now-24h'
  to: string;   // e.g., 'now'
}

export interface SLAConfig {
  name: string;
  target: number;
  metric: string;
  windowDays: number;
}

export interface SLAStatus {
  name: string;
  target: number;
  current: number;
  status: 'met' | 'at_risk' | 'breached';
  remainingBudget: number;
}

// ============================================================================
// Default Alert Rules
// ============================================================================

export const DEFAULT_ALERT_RULES: Omit<AlertRule, 'id'>[] = [
  // Cost threshold alerts
  {
    name: 'Daily Cost 80% Warning',
    description: 'Alert when daily cost reaches 80% of limit',
    type: 'cost_threshold',
    condition: {
      metric: 'azure_openai_cost',
      operator: 'gte',
      threshold: 80, // 80 USD (80% of 100)
      windowMinutes: 1440, // 24 hours
      aggregation: 'sum',
    },
    severity: 'warning',
    enabled: true,
    actions: [{ type: 'log', target: 'console' }],
    cooldownMinutes: 60,
  },
  {
    name: 'Daily Cost 90% Critical',
    description: 'Alert when daily cost reaches 90% of limit',
    type: 'cost_threshold',
    condition: {
      metric: 'azure_openai_cost',
      operator: 'gte',
      threshold: 90,
      windowMinutes: 1440,
      aggregation: 'sum',
    },
    severity: 'critical',
    enabled: true,
    actions: [{ type: 'log', target: 'console' }],
    cooldownMinutes: 30,
  },
  {
    name: 'Daily Cost 100% Exceeded',
    description: 'Alert when daily cost exceeds limit',
    type: 'cost_threshold',
    condition: {
      metric: 'azure_openai_cost',
      operator: 'gte',
      threshold: 100,
      windowMinutes: 1440,
      aggregation: 'sum',
    },
    severity: 'critical',
    enabled: true,
    actions: [{ type: 'log', target: 'console' }],
    cooldownMinutes: 15,
  },
  // Latency SLA alerts
  {
    name: 'P95 Latency SLA Violation',
    description: 'Alert when P95 latency exceeds 3 seconds',
    type: 'latency_sla',
    condition: {
      metric: 'azure_openai_latency',
      operator: 'gt',
      threshold: 3000, // 3 seconds
      windowMinutes: 5,
      aggregation: 'p95' as 'avg', // Type workaround
    },
    severity: 'warning',
    enabled: true,
    actions: [{ type: 'log', target: 'console' }],
    cooldownMinutes: 10,
  },
  // Error rate alerts
  {
    name: 'High Error Rate',
    description: 'Alert when error rate exceeds 5%',
    type: 'error_rate',
    condition: {
      metric: 'azure_openai_error_rate',
      operator: 'gt',
      threshold: 5, // 5%
      windowMinutes: 5,
      aggregation: 'avg',
    },
    severity: 'warning',
    enabled: true,
    actions: [{ type: 'log', target: 'console' }],
    cooldownMinutes: 5,
  },
  // Circuit breaker alerts
  {
    name: 'Circuit Breaker Open',
    description: 'Alert when circuit breaker opens',
    type: 'circuit_breaker',
    condition: {
      metric: 'azure_openai_circuit_breaker_state',
      operator: 'eq',
      threshold: 2, // 2 = open
      windowMinutes: 1,
      aggregation: 'max',
    },
    severity: 'critical',
    enabled: true,
    actions: [{ type: 'log', target: 'console' }],
    cooldownMinutes: 5,
  },
];

// ============================================================================
// Default Dashboard Configuration
// ============================================================================

export const DEFAULT_DASHBOARD: Omit<DashboardConfig, 'id'> = {
  name: 'Azure AI Operations Dashboard',
  description: 'Real-time monitoring of Azure OpenAI operations',
  refreshIntervalSeconds: 30,
  timeRange: { from: 'now-1h', to: 'now' },
  widgets: [
    {
      id: 'requests_per_minute',
      type: 'line_chart',
      title: 'Requests per Minute',
      position: { x: 0, y: 0, width: 6, height: 4 },
      query: {
        metric: 'azure_openai_success',
        aggregation: 'count',
        groupBy: ['deployment'],
      },
      visualization: { unit: 'req/min' },
    },
    {
      id: 'latency_p95',
      type: 'line_chart',
      title: 'P95 Latency',
      position: { x: 6, y: 0, width: 6, height: 4 },
      query: {
        metric: 'azure_openai_latency',
        aggregation: 'p95',
        groupBy: ['deployment'],
      },
      visualization: {
        unit: 'ms',
        thresholds: [
          { value: 1000, color: 'green' },
          { value: 2000, color: 'yellow' },
          { value: 3000, color: 'red' },
        ],
      },
    },
    {
      id: 'total_cost',
      type: 'stat',
      title: 'Total Cost (Today)',
      position: { x: 0, y: 4, width: 3, height: 2 },
      query: {
        metric: 'azure_openai_cost',
        aggregation: 'sum',
      },
      visualization: { unit: 'USD', decimals: 2 },
    },
    {
      id: 'total_tokens',
      type: 'stat',
      title: 'Total Tokens (Today)',
      position: { x: 3, y: 4, width: 3, height: 2 },
      query: {
        metric: 'azure_openai_total_tokens',
        aggregation: 'sum',
      },
      visualization: { unit: 'tokens' },
    },
    {
      id: 'success_rate',
      type: 'gauge',
      title: 'Success Rate',
      position: { x: 6, y: 4, width: 3, height: 2 },
      query: {
        metric: 'azure_openai_success_rate',
        aggregation: 'avg',
      },
      visualization: {
        unit: '%',
        thresholds: [
          { value: 95, color: 'green' },
          { value: 90, color: 'yellow' },
          { value: 0, color: 'red' },
        ],
      },
    },
    {
      id: 'error_rate',
      type: 'gauge',
      title: 'Error Rate',
      position: { x: 9, y: 4, width: 3, height: 2 },
      query: {
        metric: 'azure_openai_error_rate',
        aggregation: 'avg',
      },
      visualization: {
        unit: '%',
        thresholds: [
          { value: 1, color: 'green' },
          { value: 5, color: 'yellow' },
          { value: 10, color: 'red' },
        ],
      },
    },
    {
      id: 'cost_by_model',
      type: 'bar_chart',
      title: 'Cost by Model',
      position: { x: 0, y: 6, width: 6, height: 4 },
      query: {
        metric: 'azure_openai_cost',
        aggregation: 'sum',
        groupBy: ['model'],
      },
      visualization: { unit: 'USD', colorScheme: 'category10' },
    },
    {
      id: 'circuit_breaker_status',
      type: 'table',
      title: 'Circuit Breaker Status',
      position: { x: 6, y: 6, width: 6, height: 4 },
      query: {
        metric: 'azure_openai_circuit_breaker_state',
        aggregation: 'max',
        groupBy: ['deployment'],
      },
      visualization: {},
    },
  ],
};

// ============================================================================
// Azure Alerting Service
// ============================================================================

export class AzureAlertingService {
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, AlertInstance> = new Map();
  private alertHistory: AlertInstance[] = [];
  private dashboards: Map<string, DashboardConfig> = new Map();
  private slaConfigs: SLAConfig[] = [];
  private static instance: AzureAlertingService | null = null;

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultDashboard();
    this.initializeDefaultSLAs();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AzureAlertingService {
    if (!AzureAlertingService.instance) {
      AzureAlertingService.instance = new AzureAlertingService();
    }
    return AzureAlertingService.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    AzureAlertingService.instance = null;
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    for (const rule of DEFAULT_ALERT_RULES) {
      const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      this.alertRules.set(id, { ...rule, id });
    }
  }

  /**
   * Initialize default dashboard
   */
  private initializeDefaultDashboard(): void {
    const id = 'dashboard_main';
    this.dashboards.set(id, { ...DEFAULT_DASHBOARD, id });
  }

  /**
   * Initialize default SLAs
   */
  private initializeDefaultSLAs(): void {
    this.slaConfigs = [
      { name: 'Availability', target: 99.9, metric: 'azure_openai_success_rate', windowDays: 30 },
      { name: 'P95 Latency', target: 3000, metric: 'azure_openai_latency_p95', windowDays: 30 },
      { name: 'Error Rate', target: 1, metric: 'azure_openai_error_rate', windowDays: 30 },
    ];
  }

  // ============================================================================
  // Alert Rule Management
  // ============================================================================

  /**
   * Add a new alert rule
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newRule: AlertRule = { ...rule, id };
    this.alertRules.set(id, newRule);
    return newRule;
  }

  /**
   * Update an alert rule
   */
  updateAlertRule(id: string, updates: Partial<AlertRule>): AlertRule | null {
    const rule = this.alertRules.get(id);
    if (!rule) return null;

    const updatedRule = { ...rule, ...updates, id };
    this.alertRules.set(id, updatedRule);
    return updatedRule;
  }

  /**
   * Delete an alert rule
   */
  deleteAlertRule(id: string): boolean {
    return this.alertRules.delete(id);
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get alert rule by ID
   */
  getAlertRule(id: string): AlertRule | undefined {
    return this.alertRules.get(id);
  }

  // ============================================================================
  // Alert Evaluation
  // ============================================================================

  /**
   * Evaluate a metric value against alert rules
   */
  evaluateMetric(
    metric: string,
    value: number,
    dimensions: Record<string, string> = {}
  ): AlertInstance[] {
    const triggeredAlerts: AlertInstance[] = [];

    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;
      if (rule.condition.metric !== metric) continue;

      // Check cooldown
      if (rule.lastTriggered) {
        const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldownMinutes * 60000);
        if (new Date() < cooldownEnd) continue;
      }

      // Evaluate condition
      const triggered = this.evaluateCondition(rule.condition, value);
      if (triggered) {
        const alert = this.createAlert(rule, value, dimensions);
        triggeredAlerts.push(alert);
        this.activeAlerts.set(alert.id, alert);
        this.alertHistory.push(alert);
        rule.lastTriggered = new Date();

        // Execute actions
        this.executeActions(rule.actions, alert);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(condition: AlertCondition, value: number): boolean {
    switch (condition.operator) {
      case 'gt': return value > condition.threshold;
      case 'gte': return value >= condition.threshold;
      case 'lt': return value < condition.threshold;
      case 'lte': return value <= condition.threshold;
      case 'eq': return value === condition.threshold;
      default: return false;
    }
  }

  /**
   * Create an alert instance
   */
  private createAlert(
    rule: AlertRule,
    value: number,
    dimensions: Record<string, string>
  ): AlertInstance {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      timestamp: new Date(),
      status: 'firing',
      message: `${rule.name}: ${value} ${rule.condition.operator} ${rule.condition.threshold}`,
      metricValue: value,
      threshold: rule.condition.threshold,
      dimensions,
    };
  }

  /**
   * Execute alert actions
   */
  private executeActions(actions: AlertAction[], alert: AlertInstance): void {
    for (const action of actions) {
      switch (action.type) {
        case 'log':
          console.log(`[ALERT][${alert.severity.toUpperCase()}] ${alert.message}`, {
            ruleId: alert.ruleId,
            value: alert.metricValue,
            threshold: alert.threshold,
            dimensions: alert.dimensions,
          });
          break;
        case 'webhook':
          // In production, would send HTTP POST to action.target
          console.log(`[WEBHOOK] Would send to ${action.target}:`, alert);
          break;
        case 'email':
          // In production, would send email via SES/SendGrid
          console.log(`[EMAIL] Would send to ${action.target}:`, alert.message);
          break;
        case 'slack':
          // In production, would send to Slack webhook
          console.log(`[SLACK] Would send to ${action.target}:`, alert.message);
          break;
        case 'pagerduty':
          // In production, would trigger PagerDuty incident
          console.log(`[PAGERDUTY] Would trigger incident:`, alert.message);
          break;
      }
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): AlertInstance | null {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return null;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    this.activeAlerts.delete(alertId);

    return alert;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): AlertInstance[] {
    return this.alertHistory.slice(-limit);
  }

  // ============================================================================
  // Dashboard Management
  // ============================================================================

  /**
   * Create a dashboard
   */
  createDashboard(config: Omit<DashboardConfig, 'id'>): DashboardConfig {
    const id = `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const dashboard: DashboardConfig = { ...config, id };
    this.dashboards.set(id, dashboard);
    return dashboard;
  }

  /**
   * Update a dashboard
   */
  updateDashboard(id: string, updates: Partial<DashboardConfig>): DashboardConfig | null {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) return null;

    const updated = { ...dashboard, ...updates, id };
    this.dashboards.set(id, updated);
    return updated;
  }

  /**
   * Delete a dashboard
   */
  deleteDashboard(id: string): boolean {
    return this.dashboards.delete(id);
  }

  /**
   * Get all dashboards
   */
  getDashboards(): DashboardConfig[] {
    return Array.from(this.dashboards.values());
  }

  /**
   * Get dashboard by ID
   */
  getDashboard(id: string): DashboardConfig | undefined {
    return this.dashboards.get(id);
  }

  // ============================================================================
  // SLA Management
  // ============================================================================

  /**
   * Calculate SLA status
   */
  calculateSLAStatus(
    slaName: string,
    currentValue: number
  ): SLAStatus | null {
    const sla = this.slaConfigs.find(s => s.name === slaName);
    if (!sla) return null;

    let status: 'met' | 'at_risk' | 'breached';
    let remainingBudget: number;

    // For availability/success rate (higher is better)
    if (sla.metric.includes('success') || sla.metric.includes('availability')) {
      remainingBudget = currentValue - sla.target;
      if (currentValue >= sla.target) status = 'met';
      else if (currentValue >= sla.target * 0.99) status = 'at_risk';
      else status = 'breached';
    }
    // For latency/error rate (lower is better)
    else {
      remainingBudget = sla.target - currentValue;
      if (currentValue <= sla.target) status = 'met';
      else if (currentValue <= sla.target * 1.1) status = 'at_risk';
      else status = 'breached';
    }

    return {
      name: sla.name,
      target: sla.target,
      current: currentValue,
      status,
      remainingBudget,
    };
  }

  /**
   * Get all SLA configurations
   */
  getSLAConfigs(): SLAConfig[] {
    return [...this.slaConfigs];
  }

  /**
   * Add SLA configuration
   */
  addSLAConfig(config: SLAConfig): void {
    this.slaConfigs.push(config);
  }

  // ============================================================================
  // Cost Alert Integration
  // ============================================================================

  /**
   * Process cost alert from cost reporting service
   */
  processCostAlert(costAlert: CostAlert): AlertInstance {
    const alert: AlertInstance = {
      id: `alert_cost_${Date.now()}`,
      ruleId: `cost_${costAlert.threshold.type}`,
      ruleName: `Cost ${costAlert.type} - ${costAlert.threshold.type}`,
      severity: costAlert.type === 'exceeded' ? 'critical' : costAlert.type === 'critical' ? 'critical' : 'warning',
      timestamp: costAlert.timestamp,
      status: 'firing',
      message: costAlert.message,
      metricValue: costAlert.currentCost,
      threshold: costAlert.threshold.limit,
      dimensions: {
        type: costAlert.threshold.type,
        percentUsed: costAlert.percentUsed.toString(),
      },
    };

    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    // Log the alert
    console.log(`[COST ALERT][${alert.severity.toUpperCase()}] ${alert.message}`);

    return alert;
  }

  // ============================================================================
  // Testing Utilities
  // ============================================================================

  /**
   * Clear all alerts (for testing)
   */
  clearAlerts(): void {
    this.activeAlerts.clear();
    this.alertHistory = [];
  }

  /**
   * Reset all rules to defaults (for testing)
   */
  resetToDefaults(): void {
    this.alertRules.clear();
    this.dashboards.clear();
    this.initializeDefaultRules();
    this.initializeDefaultDashboard();
    this.initializeDefaultSLAs();
  }
}

// Export singleton instance
export const azureAlertingService = AzureAlertingService.getInstance();
