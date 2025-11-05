import { SafeDateRenderer } from '@/components/hydration';

/**
 * Report Generation Service
 * 
 * Generates performance reports and handles scheduling
 */

import { getPool } from '../db';
import { metricsAggregationService } from './metricsAggregationService';
import { trendAnalysisService } from './trendAnalysisService';
import { TimeRange } from '../db/repositories/analyticsSnapshotsRepository';

export type ReportType = 'weekly' | 'monthly' | 'custom';
export type ExportFormat = 'csv' | 'pdf' | 'json';

export interface Report {
  id: string;
  userId: number;
  type: ReportType;
  timeRange: TimeRange;
  generatedAt: Date;
  summary: ReportSummary;
  metrics: any;
  topContent: any[];
  trends: any;
  pdfUrl?: string;
}

export interface ReportSummary {
  title: string;
  highlights: string[];
  keyMetrics: Record<string, number>;
  insights: string[];
}

export interface ReportSchedule {
  userId: number;
  reportType: ReportType;
  frequency: 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay?: string;
  emailDelivery: boolean;
}

export interface ExportOptions {
  timeRange: TimeRange;
  includeCharts?: boolean;
  includeTopContent?: boolean;
}

/**
 * Report Generation Service
 */
export class ReportGenerationService {
  /**
   * Generate performance report
   */
  async generateReport(
    userId: number,
    reportType: ReportType,
    timeRange: TimeRange
  ): Promise<Report> {
    // Gather all data
    const [metrics, trends, content] = await Promise.all([
      metricsAggregationService.getUnifiedMetrics(userId, timeRange),
      trendAnalysisService.analyzeTrends(userId, timeRange),
      metricsAggregationService.getContentPerformance(userId, { limit: 10 }),
    ]);

    // Generate summary
    const summary = this.generateSummary(metrics, trends);

    // Create report record
    const report: Report = {
      id: `report_${Date.now()}`,
      userId,
      type: reportType,
      timeRange,
      generatedAt: new Date(),
      summary,
      metrics,
      topContent: content,
      trends,
    };

    // Store in database
    await this.saveReport(report);

    return report;
  }

  /**
   * Schedule automated reports
   */
  async scheduleReport(schedule: ReportSchedule): Promise<void> {
    const pool = getPool();

    await pool.query(
      `INSERT INTO report_schedules (
        user_id, report_type, frequency, day_of_week, day_of_month,
        time_of_day, email_delivery, enabled, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
      ON CONFLICT (user_id, report_type)
      DO UPDATE SET
        frequency = EXCLUDED.frequency,
        day_of_week = EXCLUDED.day_of_week,
        day_of_month = EXCLUDED.day_of_month,
        time_of_day = EXCLUDED.time_of_day,
        email_delivery = EXCLUDED.email_delivery,
        updated_at = NOW()`,
      [
        schedule.userId,
        schedule.reportType,
        schedule.frequency,
        schedule.dayOfWeek,
        schedule.dayOfMonth,
        schedule.timeOfDay,
        schedule.emailDelivery,
      ]
    );
  }

  /**
   * Export data to various formats
   */
  async exportData(
    userId: number,
    format: ExportFormat,
    options: ExportOptions
  ): Promise<Buffer> {
    const metrics = await metricsAggregationService.getUnifiedMetrics(
      userId,
      options.timeRange
    );

    switch (format) {
      case 'csv':
        return this.exportToCSV(metrics);
      case 'json':
        return this.exportToJSON(metrics);
      case 'pdf':
        return this.exportToPDF(metrics, options);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate report summary
   */
  private generateSummary(metrics: any, trends: any): ReportSummary {
    const highlights: string[] = [];

    // Add highlights based on metrics
    if (metrics.totalFollowers > 0) {
      highlights.push(`${this.formatNumber(metrics.totalFollowers)} total followers`);
    }

    if (metrics.averageEngagementRate > 0) {
      highlights.push(`${metrics.averageEngagementRate.toFixed(2)}% engagement rate`);
    }

    // Add trend highlights
    if (trends.insights?.significantChanges?.length > 0) {
      highlights.push(...trends.insights.significantChanges.map((c: any) => c.description));
    }

    return {
      title: `Performance Report - ${new Date().toLocaleDateString()}`,
      highlights: highlights.slice(0, 5),
      keyMetrics: {
        followers: metrics.totalFollowers,
        engagement: metrics.totalEngagement,
        posts: metrics.totalPosts,
        engagementRate: metrics.averageEngagementRate,
      },
      insights: trends.insights?.recommendations || [],
    };
  }

  /**
   * Save report to database
   */
  private async saveReport(report: Report): Promise<void> {
    const pool = getPool();

    await pool.query(
      `INSERT INTO generated_reports (
        user_id, report_type, time_range_start, time_range_end,
        summary_json, pdf_url, generated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        report.userId,
        report.type,
        report.timeRange.startDate,
        report.timeRange.endDate,
        JSON.stringify(report.summary),
        report.pdfUrl,
        report.generatedAt,
      ]
    );
  }

  /**
   * Export to CSV
   */
  private exportToCSV(metrics: any): Buffer {
    const rows = [
      ['Metric', 'Value'],
      ['Total Followers', metrics.totalFollowers],
      ['Total Engagement', metrics.totalEngagement],
      ['Total Posts', metrics.totalPosts],
      ['Avg Engagement Rate', `${metrics.averageEngagementRate}%`],
    ];

    // Add platform breakdown
    Object.entries(metrics.platformBreakdown || {}).forEach(([platform, data]: [string, any]) => {
      rows.push([`${platform} - Followers`, data.followers]);
      rows.push([`${platform} - Engagement`, data.engagement]);
      rows.push([`${platform} - Posts`, data.posts]);
    });

    const csv = rows.map(row => row.join(',')).join('\n');
    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Export to JSON
   */
  private exportToJSON(metrics: any): Buffer {
    return Buffer.from(JSON.stringify(metrics, null, 2), 'utf-8');
  }

  /**
   * Export to PDF (placeholder - would use library like puppeteer or pdfkit)
   */
  private exportToPDF(metrics: any, options: ExportOptions): Buffer {
    // Placeholder: In production, use a PDF library
    const text = `
Performance Report
Generated: ${new Date().toLocaleDateString()}

Total Followers: ${metrics.totalFollowers}
Total Engagement: ${metrics.totalEngagement}
Total Posts: ${metrics.totalPosts}
Avg Engagement Rate: ${metrics.averageEngagementRate}%

Platform Breakdown:
${Object.entries(metrics.platformBreakdown || {})
  .map(([platform, data]: [string, any]) => 
    `${platform}: ${data.followers} followers, ${data.engagement} engagement`
  )
  .join('\n')}
    `.trim();

    return Buffer.from(text, 'utf-8');
  }

  /**
   * Format number for display
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }
}

// Export singleton instance
export const reportGenerationService = new ReportGenerationService();
