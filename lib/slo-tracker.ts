/**
 * SLO Tracker
 * 
 * Tracks Service Level Objectives (SLOs) for the onboarding system.
 * Calculates compliance, error budgets, and generates reports.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

// Types
export interface SLOConfig {
  version: string;
  service: string;
  global: {
    measurement_window: string;
    evaluation_interval: string;
  };
  slos: SLO[];
  reporting: ReportingConfig;
  alerts: AlertConfig;
  error_budget: ErrorBudgetConfig;
  documentation: DocumentationConfig;
}

export interface SLO {
  name: string;
  description: string;
  metric: string;
  labels?: Record<string, string>;
  percentile?: number;
  target: number;
  threshold: number;
  window: string;
  severity: 'critical' | 'warning';
  note?: string;
  allowed_downtime_per_month?: string;
}

export interface ReportingConfig {
  destinations: Array<{
    type: string;
    channel?: string;
    recipients?: string[];
    frequency: string;
  }>;
  include: string[];
}

export interface AlertConfig {
  critical: AlertRule[];
  warning: AlertRule[];
}

export interface AlertRule {
  slo: string;
  condition: string;
  duration: string;
  destination: string;
}

export interface ErrorBudgetConfig {
  calculation_method: string;
  budgets: Array<{
    slo: string;
    period: string;
    budget: number;
  }>;
  policies: Array<{
    condition: string;
    action: string;
    notify: string[];
  }>;
}

export interface DocumentationConfig {
  runbook_url: string;
  dashboard_url: string;
  incident_response: string;
}

export interface SLOMetrics {
  name: string;
  current_value: number;
  target: number;
  threshold: number;
  compliance: number;  // 0-100%
  status: 'healthy' | 'warning' | 'breach';
  error_budget_remaining: number;  // 0-100%
  timestamp: Date;
}

export interface SLOReport {
  service: string;
  period: string;
  generated_at: Date;
  overall_compliance: number;
  slo_metrics: SLOMetrics[];
  violations: SLOViolation[];
  recommendations: string[];
}

export interface SLOViolation {
  slo_name: string;
  severity: string;
  started_at: Date;
  ended_at?: Date;
  duration_minutes: number;
  impact: string;
}

/**
 * SLO Tracker class
 */
export class SLOTracker {
  private config: SLOConfig;

  constructor(configPath?: string) {
    const path = configPath || join(process.cwd(), 'config', 'slo.yaml');
    const fileContents = readFileSync(path, 'utf8');
    this.config = yaml.load(fileContents) as SLOConfig;
  }

  /**
   * Get all SLO definitions
   */
  getSLOs(): SLO[] {
    return this.config.slos;
  }

  /**
   * Get a specific SLO by name
   */
  getSLO(name: string): SLO | undefined {
    return this.config.slos.find(slo => slo.name === name);
  }

  /**
   * Calculate SLO compliance for a given metric
   */
  calculateCompliance(
    sloName: string,
    currentValue: number,
    totalRequests: number
  ): SLOMetrics {
    const slo = this.getSLO(sloName);
    if (!slo) {
      throw new Error(`SLO not found: ${sloName}`);
    }

    // Calculate compliance percentage
    let compliance: number;
    let status: 'healthy' | 'warning' | 'breach';

    // For latency metrics (lower is better)
    if (slo.metric.includes('latency')) {
      if (currentValue <= slo.target) {
        compliance = 100;
        status = 'healthy';
      } else if (currentValue <= slo.threshold) {
        compliance = ((slo.threshold - currentValue) / (slo.threshold - slo.target)) * 100;
        status = 'warning';
      } else {
        compliance = 0;
        status = 'breach';
      }
    }
    // For error rates (lower is better)
    else if (slo.metric.includes('error')) {
      const errorRate = currentValue / totalRequests;
      if (errorRate <= slo.target) {
        compliance = 100;
        status = 'healthy';
      } else if (errorRate <= slo.threshold) {
        compliance = ((slo.threshold - errorRate) / (slo.threshold - slo.target)) * 100;
        status = 'warning';
      } else {
        compliance = 0;
        status = 'breach';
      }
    }
    // For availability (higher is better)
    else if (slo.metric.includes('uptime')) {
      if (currentValue >= slo.target) {
        compliance = 100;
        status = 'healthy';
      } else if (currentValue >= slo.threshold) {
        compliance = ((currentValue - slo.threshold) / (slo.target - slo.threshold)) * 100;
        status = 'warning';
      } else {
        compliance = 0;
        status = 'breach';
      }
    }
    // For cache hit rate (higher is better)
    else if (slo.metric.includes('cache_hit_rate')) {
      if (currentValue >= slo.target) {
        compliance = 100;
        status = 'healthy';
      } else if (currentValue >= slo.threshold) {
        compliance = ((currentValue - slo.threshold) / (slo.target - slo.threshold)) * 100;
        status = 'warning';
      } else {
        compliance = 0;
        status = 'breach';
      }
    }
    // Default (lower is better)
    else {
      if (currentValue <= slo.target) {
        compliance = 100;
        status = 'healthy';
      } else if (currentValue <= slo.threshold) {
        compliance = ((slo.threshold - currentValue) / (slo.threshold - slo.target)) * 100;
        status = 'warning';
      } else {
        compliance = 0;
        status = 'breach';
      }
    }

    // Calculate error budget remaining
    const errorBudget = this.getErrorBudget(sloName);
    const errorBudgetRemaining = errorBudget ? 
      Math.max(0, 100 - ((100 - compliance) / errorBudget.budget * 100)) : 
      100;

    return {
      name: sloName,
      current_value: currentValue,
      target: slo.target,
      threshold: slo.threshold,
      compliance: Math.max(0, Math.min(100, compliance)),
      status,
      error_budget_remaining: errorBudgetRemaining,
      timestamp: new Date()
    };
  }

  /**
   * Get error budget configuration for an SLO
   */
  getErrorBudget(sloName: string) {
    return this.config.error_budget.budgets.find(b => b.slo === sloName);
  }

  /**
   * Generate SLO compliance report
   */
  generateReport(metrics: SLOMetrics[]): SLOReport {
    const overallCompliance = metrics.reduce((sum, m) => sum + m.compliance, 0) / metrics.length;

    const violations: SLOViolation[] = metrics
      .filter(m => m.status === 'breach')
      .map(m => ({
        slo_name: m.name,
        severity: this.getSLO(m.name)?.severity || 'warning',
        started_at: m.timestamp,
        duration_minutes: 0,  // Would be calculated from historical data
        impact: this.calculateImpact(m)
      }));

    const recommendations = this.generateRecommendations(metrics);

    return {
      service: this.config.service,
      period: this.config.global.measurement_window,
      generated_at: new Date(),
      overall_compliance: overallCompliance,
      slo_metrics: metrics,
      violations,
      recommendations
    };
  }

  /**
   * Calculate impact of an SLO breach
   */
  private calculateImpact(metric: SLOMetrics): string {
    const slo = this.getSLO(metric.name);
    if (!slo) return 'Unknown impact';

    if (slo.severity === 'critical') {
      return 'High - User-facing service degradation';
    } else if (metric.compliance < 50) {
      return 'Medium - Significant performance degradation';
    } else {
      return 'Low - Minor performance impact';
    }
  }

  /**
   * Generate recommendations based on SLO metrics
   */
  private generateRecommendations(metrics: SLOMetrics[]): string[] {
    const recommendations: string[] = [];

    metrics.forEach(metric => {
      const slo = this.getSLO(metric.name);
      if (!slo) return;

      if (metric.status === 'breach') {
        if (slo.metric.includes('latency')) {
          recommendations.push(
            `${metric.name}: Investigate slow queries and consider adding caching or database indexes`
          );
        } else if (slo.metric.includes('error')) {
          recommendations.push(
            `${metric.name}: Review error logs and implement additional error handling`
          );
        } else if (slo.metric.includes('cache')) {
          recommendations.push(
            `${metric.name}: Review cache TTL settings and cache key strategy`
          );
        }
      } else if (metric.status === 'warning') {
        recommendations.push(
          `${metric.name}: Monitor closely - approaching SLO threshold`
        );
      }

      if (metric.error_budget_remaining < 20) {
        recommendations.push(
          `${metric.name}: Error budget critically low (${metric.error_budget_remaining.toFixed(1)}%) - consider freezing deployments`
        );
      }
    });

    return recommendations;
  }

  /**
   * Check if an alert should be triggered
   */
  shouldAlert(metric: SLOMetrics): AlertRule | null {
    const slo = this.getSLO(metric.name);
    if (!slo) return null;

    const alertRules = slo.severity === 'critical' 
      ? this.config.alerts.critical 
      : this.config.alerts.warning;

    const matchingRule = alertRules.find(rule => rule.slo === metric.name);
    if (!matchingRule) return null;

    // Check if alert condition is met
    if (matchingRule.condition === 'breach' && metric.status === 'breach') {
      return matchingRule;
    } else if (matchingRule.condition === 'threshold' && 
               (metric.status === 'warning' || metric.status === 'breach')) {
      return matchingRule;
    }

    return null;
  }

  /**
   * Get documentation URLs
   */
  getDocumentation(): DocumentationConfig {
    return this.config.documentation;
  }
}

// Export singleton instance
export const sloTracker = new SLOTracker();
