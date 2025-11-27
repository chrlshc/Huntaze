import { CloudWatchClient, GetMetricStatisticsCommand, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

export interface DashboardMetrics {
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  fcp?: number;
  tti?: number;
}

export interface DashboardAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  severity: 'warning' | 'critical';
}

export interface HistoricalDataPoint {
  timestamp: Date;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  alerts: DashboardAlert[];
  historical: HistoricalDataPoint[];
  grade: string;
}

export class DashboardService {
  private cloudwatch: CloudWatchClient;
  private namespace: string;

  constructor() {
    this.cloudwatch = new CloudWatchClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      } : undefined
    });
    this.namespace = process.env.CLOUDWATCH_NAMESPACE || 'Huntaze/Performance';
  }

  /**
   * Fetch current performance metrics from CloudWatch
   */
  async getCurrentMetrics(): Promise<DashboardMetrics> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // Last 5 minutes

    const metrics = ['LCP', 'FID', 'CLS', 'TTFB'];
    const results: Partial<DashboardMetrics> = {};

    for (const metricName of metrics) {
      try {
        const command = new GetMetricStatisticsCommand({
          Namespace: this.namespace,
          MetricName: metricName,
          StartTime: startTime,
          EndTime: endTime,
          Period: 300, // 5 minutes
          Statistics: ['Average'],
          Dimensions: [
            {
              Name: 'Environment',
              Value: process.env.NODE_ENV || 'development'
            }
          ]
        });

        const response = await this.cloudwatch.send(command);
        
        if (response.Datapoints && response.Datapoints.length > 0) {
          const latestDatapoint = response.Datapoints.sort(
            (a, b) => (b.Timestamp?.getTime() || 0) - (a.Timestamp?.getTime() || 0)
          )[0];
          
          const key = metricName.toLowerCase() as keyof DashboardMetrics;
          results[key] = latestDatapoint.Average || 0;
        }
      } catch (error) {
        console.error(`Error fetching ${metricName}:`, error);
        const key = metricName.toLowerCase() as keyof DashboardMetrics;
        results[key] = 0;
      }
    }

    return {
      lcp: results.lcp || 0,
      fid: results.fid || 0,
      cls: results.cls || 0,
      ttfb: results.ttfb || 0
    };
  }

  /**
   * Fetch active CloudWatch alarms
   */
  async getActiveAlerts(): Promise<DashboardAlert[]> {
    try {
      const command = new DescribeAlarmsCommand({
        StateValue: 'ALARM',
        MaxRecords: 100
      });

      const response = await this.cloudwatch.send(command);
      
      if (!response.MetricAlarms) {
        return [];
      }

      return response.MetricAlarms
        .filter(alarm => alarm.Namespace === this.namespace)
        .map(alarm => ({
          id: alarm.AlarmArn || `alarm-${Date.now()}`,
          metric: alarm.MetricName || 'Unknown',
          value: alarm.StateValue === 'ALARM' ? (alarm.Threshold || 0) * 1.5 : 0,
          threshold: alarm.Threshold || 0,
          timestamp: alarm.StateUpdatedTimestamp || new Date(),
          severity: this.determineSeverity(alarm.MetricName || '', alarm.Threshold || 0)
        }));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  /**
   * Fetch historical performance data
   */
  async getHistoricalData(hours: number = 24): Promise<HistoricalDataPoint[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    const metrics = ['LCP', 'FID', 'CLS', 'TTFB'];
    const dataByTimestamp: Map<number, Partial<HistoricalDataPoint>> = new Map();

    for (const metricName of metrics) {
      try {
        const command = new GetMetricStatisticsCommand({
          Namespace: this.namespace,
          MetricName: metricName,
          StartTime: startTime,
          EndTime: endTime,
          Period: 3600, // 1 hour intervals
          Statistics: ['Average'],
          Dimensions: [
            {
              Name: 'Environment',
              Value: process.env.NODE_ENV || 'development'
            }
          ]
        });

        const response = await this.cloudwatch.send(command);
        
        if (response.Datapoints) {
          response.Datapoints.forEach(datapoint => {
            if (datapoint.Timestamp && datapoint.Average !== undefined) {
              const timestamp = datapoint.Timestamp.getTime();
              const existing = dataByTimestamp.get(timestamp) || { timestamp: datapoint.Timestamp };
              
              const key = metricName.toLowerCase() as keyof Omit<HistoricalDataPoint, 'timestamp'>;
              existing[key] = datapoint.Average;
              
              dataByTimestamp.set(timestamp, existing);
            }
          });
        }
      } catch (error) {
        console.error(`Error fetching historical ${metricName}:`, error);
      }
    }

    // Convert map to array and sort by timestamp
    return Array.from(dataByTimestamp.values())
      .filter(point => 
        point.lcp !== undefined && 
        point.fid !== undefined && 
        point.cls !== undefined && 
        point.ttfb !== undefined
      )
      .map(point => ({
        timestamp: point.timestamp!,
        lcp: point.lcp!,
        fid: point.fid!,
        cls: point.cls!,
        ttfb: point.ttfb!
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    const [metrics, alerts, historical] = await Promise.all([
      this.getCurrentMetrics(),
      this.getActiveAlerts(),
      this.getHistoricalData(24)
    ]);

    const grade = this.calculatePerformanceGrade(metrics);

    return {
      metrics,
      alerts,
      historical,
      grade
    };
  }

  /**
   * Calculate performance grade based on Web Vitals
   */
  private calculatePerformanceGrade(metrics: DashboardMetrics): string {
    const scores = {
      lcp: this.getMetricScore(metrics.lcp, 2500, 4000),
      fid: this.getMetricScore(metrics.fid, 100, 300),
      cls: this.getMetricScore(metrics.cls, 0.1, 0.25),
      ttfb: this.getMetricScore(metrics.ttfb, 800, 1800)
    };

    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

    if (avgScore >= 0.9) return 'A';
    if (avgScore >= 0.75) return 'B';
    if (avgScore >= 0.5) return 'C';
    if (avgScore >= 0.25) return 'D';
    return 'F';
  }

  private getMetricScore(value: number, goodThreshold: number, poorThreshold: number): number {
    if (value <= goodThreshold) return 1;
    if (value >= poorThreshold) return 0;
    return 1 - ((value - goodThreshold) / (poorThreshold - goodThreshold));
  }

  private determineSeverity(metricName: string, threshold: number): 'warning' | 'critical' {
    // LCP and TTFB are critical if they exceed poor thresholds
    if (metricName === 'LCP' && threshold >= 4000) return 'critical';
    if (metricName === 'TTFB' && threshold >= 1800) return 'critical';
    if (metricName === 'FID' && threshold >= 300) return 'critical';
    if (metricName === 'CLS' && threshold >= 0.25) return 'critical';
    
    return 'warning';
  }
}

// Singleton instance
let dashboardServiceInstance: DashboardService | null = null;

export function getDashboardService(): DashboardService {
  if (!dashboardServiceInstance) {
    dashboardServiceInstance = new DashboardService();
  }
  return dashboardServiceInstance;
}
