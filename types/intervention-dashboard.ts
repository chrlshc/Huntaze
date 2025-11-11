/**
 * Type definitions for Intervention Dashboard data structures
 * These types ensure type safety for trend data and metrics
 */

/**
 * Represents a single data point in a time-series trend
 */
export interface TrendDataPoint {
  timestamp: Date;
  value: number;
}

/**
 * Aggregates all performance trend data for dashboard visualization
 */
export interface PerformanceTrends {
  effectiveness: TrendDataPoint[];
  successRate: TrendDataPoint[];
  resolutionTime: TrendDataPoint[];
  userSatisfaction: TrendDataPoint[];
}

/**
 * Hourly metrics snapshot for intervention performance
 */
export interface HourlyMetrics {
  totalInterventions: number;
  successRate: number;
  averageEffectiveness: number;
  averageResolutionTime: number;
  averageUserSatisfaction: number;
  escalationRate: number;
}

/**
 * Real-time metrics for intervention monitoring
 */
export interface RealTimeMetrics {
  totalInterventions: number;
  successRate: number;
  averageEffectiveness: number;
  averageResolutionTime: number;
  averageUserSatisfaction: number;
  escalationRate: number;
  lastUpdated: Date;
}

/**
 * Alert data structure for dashboard notifications
 */
export interface DashboardAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  recommendation: string;
  createdAt: Date;
}
