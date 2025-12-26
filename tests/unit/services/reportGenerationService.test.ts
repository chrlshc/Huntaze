/**
 * Unit Tests - Report Generation Service
 * 
 * Tests for the report generation service
 * Based on: .kiro/specs/advanced-analytics/tasks.md (Task 8)
 * 
 * Coverage:
 * - Report generation (weekly, monthly, custom)
 * - Report scheduling
 * - Data export (CSV, JSON, PDF)
 * - Summary generation
 * - Report storage
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportGenerationService, ReportType, ExportFormat } from '../../../lib/services/reportGenerationService';
import { metricsAggregationService } from '../../../lib/services/metricsAggregationService';
import { trendAnalysisService } from '../../../lib/services/trendAnalysisService';
import { getPool } from '../../../lib/db';

// Mock dependencies
vi.mock('../../../lib/db', () => ({
  getPool: vi.fn(),
}));

vi.mock('../../../lib/services/metricsAggregationService', () => ({
  metricsAggregationService: {
    getUnifiedMetrics: vi.fn(),
    getContentPerformance: vi.fn(),
  },
}));

vi.mock('../../../lib/services/trendAnalysisService', () => ({
  trendAnalysisService: {
    analyzeTrends: vi.fn(),
  },
}));

describe('Report Generation Service', () => {
  let mockPool: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock database pool
    mockPool = {
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    };
    vi.mocked(getPool).mockReturnValue(mockPool);

    // Mock metrics aggregation service
    vi.mocked(metricsAggregationService.getUnifiedMetrics).mockResolvedValue({
      totalFollowers: 10000,
      totalEngagement: 5000,
      totalPosts: 100,
      averageEngagementRate: 5.5,
      platformBreakdown: {
        instagram: { followers: 6000, engagement: 3000, posts: 60 },
        tiktok: { followers: 4000, engagement: 2000, posts: 40 },
      },
    });

    vi.mocked(metricsAggregationService.getContentPerformance).mockResolvedValue([
      { id: 1, title: 'Top Post 1', engagement: 1000 },
      { id: 2, title: 'Top Post 2', engagement: 800 },
    ]);

    // Mock trend analysis service
    vi.mocked(trendAnalysisService.analyzeTrends).mockResolvedValue({
      insights: {
        significantChanges: [
          { description: 'Follower growth increased by 20%' },
          { description: 'Engagement rate improved' },
        ],
        recommendations: [
          'Post more during peak hours',
          'Focus on video content',
        ],
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC 8.1 - Generate Report', () => {
    it('should generate weekly report', async () => {
      const userId = 1;
      const reportType: ReportType = 'weekly';
      const timeRange = {
        startDate: new Date('2025-10-24'),
        endDate: new Date('2025-10-31'),
      };

      const report = await reportGenerationService.generateReport(
        userId,
        reportType,
        timeRange
      );

      expect(report).toBeDefined();
      expect(report.userId).toBe(userId);
      expect(report.type).toBe('weekly');
      expect(report.timeRange).toEqual(timeRange);
      expect(report.id).toMatch(/^report_\d+$/);
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate monthly report', async () => {
      const userId = 1;
      const reportType: ReportType = 'monthly';
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      const report = await reportGenerationService.generateReport(
        userId,
        reportType,
        timeRange
      );

      expect(report.type).toBe('monthly');
      expect(report.timeRange).toEqual(timeRange);
    });

    it('should generate custom report', async () => {
      const userId = 1;
      const reportType: ReportType = 'custom';
      const timeRange = {
        startDate: new Date('2025-10-15'),
        endDate: new Date('2025-10-25'),
      };

      const report = await reportGenerationService.generateReport(
        userId,
        reportType,
        timeRange
      );

      expect(report.type).toBe('custom');
      expect(report.timeRange).toEqual(timeRange);
    });

    it('should include metrics in report', async () => {
      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.metrics).toBeDefined();
      expect(report.metrics.totalFollowers).toBe(10000);
      expect(report.metrics.totalEngagement).toBe(5000);
      expect(report.metrics.totalPosts).toBe(100);
      expect(report.metrics.averageEngagementRate).toBe(5.5);
    });

    it('should include top content in report', async () => {
      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.topContent).toBeDefined();
      expect(report.topContent).toHaveLength(2);
      expect(report.topContent[0].title).toBe('Top Post 1');
    });

    it('should include trends in report', async () => {
      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.trends).toBeDefined();
      expect(report.trends.insights).toBeDefined();
    });

    it('should generate summary', async () => {
      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.summary).toBeDefined();
      expect(report.summary.title).toContain('Performance Report');
      expect(report.summary.highlights).toBeInstanceOf(Array);
      expect(report.summary.keyMetrics).toBeDefined();
      expect(report.summary.insights).toBeInstanceOf(Array);
    });

    it('should save report to database', async () => {
      await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO generated_reports'),
        expect.arrayContaining([
          1, // userId
          'weekly', // reportType
          expect.any(Date), // startDate
          expect.any(Date), // endDate
          expect.any(String), // summary JSON
          undefined, // pdfUrl
          expect.any(Date), // generatedAt
        ])
      );
    });

    it('should call all required services', async () => {
      const timeRange = { startDate: new Date(), endDate: new Date() };

      await reportGenerationService.generateReport(1, 'weekly', timeRange);

      expect(metricsAggregationService.getUnifiedMetrics).toHaveBeenCalledWith(1, timeRange);
      expect(trendAnalysisService.analyzeTrends).toHaveBeenCalledWith(1, timeRange);
      expect(metricsAggregationService.getContentPerformance).toHaveBeenCalledWith(1, { limit: 10 });
    });
  });

  describe('AC 8.2 - Schedule Report', () => {
    it('should schedule weekly report', async () => {
      const schedule = {
        userId: 1,
        reportType: 'weekly' as ReportType,
        frequency: 'weekly' as const,
        dayOfWeek: 1, // Monday
        timeOfDay: '09:00',
        emailDelivery: true,
      };

      await reportGenerationService.scheduleReport(schedule);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO report_schedules'),
        expect.arrayContaining([
          1, // userId
          'weekly', // reportType
          'weekly', // frequency
          1, // dayOfWeek
          undefined, // dayOfMonth
          '09:00', // timeOfDay
          true, // emailDelivery
        ])
      );
    });

    it('should schedule monthly report', async () => {
      const schedule = {
        userId: 1,
        reportType: 'monthly' as ReportType,
        frequency: 'monthly' as const,
        dayOfMonth: 1, // First day of month
        timeOfDay: '08:00',
        emailDelivery: true,
      };

      await reportGenerationService.scheduleReport(schedule);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO report_schedules'),
        expect.arrayContaining([
          1, // userId
          'monthly', // reportType
          'monthly', // frequency
          undefined, // dayOfWeek
          1, // dayOfMonth
          '08:00', // timeOfDay
          true, // emailDelivery
        ])
      );
    });

    it('should update existing schedule', async () => {
      const schedule = {
        userId: 1,
        reportType: 'weekly' as ReportType,
        frequency: 'weekly' as const,
        dayOfWeek: 5, // Friday
        timeOfDay: '17:00',
        emailDelivery: false,
      };

      await reportGenerationService.scheduleReport(schedule);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (user_id, report_type)'),
        expect.any(Array)
      );
    });

    it('should handle schedule without email delivery', async () => {
      const schedule = {
        userId: 1,
        reportType: 'weekly' as ReportType,
        frequency: 'weekly' as const,
        dayOfWeek: 1,
        emailDelivery: false,
      };

      await reportGenerationService.scheduleReport(schedule);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([false]) // emailDelivery
      );
    });
  });

  describe('AC 8.3 - Export Data', () => {
    describe('CSV Export', () => {
      it('should export data to CSV', async () => {
        const options = {
          timeRange: { startDate: new Date(), endDate: new Date() },
        };

        const buffer = await reportGenerationService.exportData(1, 'csv', options);

        expect(buffer).toBeInstanceOf(Buffer);
        const csv = buffer.toString('utf-8');
        expect(csv).toContain('Metric,Value');
        expect(csv).toContain('Total Followers,10000');
        expect(csv).toContain('Total Engagement,5000');
      });

      it('should include platform breakdown in CSV', async () => {
        const options = {
          timeRange: { startDate: new Date(), endDate: new Date() },
        };

        const buffer = await reportGenerationService.exportData(1, 'csv', options);
        const csv = buffer.toString('utf-8');

        expect(csv).toContain('instagram - Followers,6000');
        expect(csv).toContain('tiktok - Followers,4000');
      });

      it('should format engagement rate in CSV', async () => {
        const options = {
          timeRange: { startDate: new Date(), endDate: new Date() },
        };

        const buffer = await reportGenerationService.exportData(1, 'csv', options);
        const csv = buffer.toString('utf-8');

        expect(csv).toContain('Avg Engagement Rate,5.5%');
      });
    });

    describe('JSON Export', () => {
      it('should export data to JSON', async () => {
        const options = {
          timeRange: { startDate: new Date(), endDate: new Date() },
        };

        const buffer = await reportGenerationService.exportData(1, 'json', options);

        expect(buffer).toBeInstanceOf(Buffer);
        const json = JSON.parse(buffer.toString('utf-8'));
        expect(json.totalFollowers).toBe(10000);
        expect(json.totalEngagement).toBe(5000);
      });

      it('should include all metrics in JSON', async () => {
        const options = {
          timeRange: { startDate: new Date(), endDate: new Date() },
        };

        const buffer = await reportGenerationService.exportData(1, 'json', options);
        const json = JSON.parse(buffer.toString('utf-8'));

        expect(json).toHaveProperty('totalFollowers');
        expect(json).toHaveProperty('totalEngagement');
        expect(json).toHaveProperty('totalPosts');
        expect(json).toHaveProperty('averageEngagementRate');
        expect(json).toHaveProperty('platformBreakdown');
      });

      it('should format JSON with indentation', async () => {
        const options = {
          timeRange: { startDate: new Date(), endDate: new Date() },
        };

        const buffer = await reportGenerationService.exportData(1, 'json', options);
        const jsonString = buffer.toString('utf-8');

        // Check for indentation (2 spaces)
        expect(jsonString).toContain('  "totalFollowers"');
      });
    });

    describe('PDF Export', () => {
      it('should export data to PDF', async () => {
        const options = {
          timeRange: { startDate: new Date(), endDate: new Date() },
        };

        const buffer = await reportGenerationService.exportData(1, 'pdf', options);

        expect(buffer).toBeInstanceOf(Buffer);
        const text = buffer.toString('utf-8');
        expect(text).toContain('Performance Report');
        expect(text).toContain('Total Followers: 10000');
      });

      it('should include generation timestamp in PDF', async () => {
        const options = {
          timeRange: { startDate: new Date(), endDate: new Date() },
        };

        const buffer = await reportGenerationService.exportData(1, 'pdf', options);
        const text = buffer.toString('utf-8');

        expect(text).toContain('Generated:');
      });

      it('should include platform breakdown in PDF', async () => {
        const options = {
          timeRange: { startDate: new Date(), endDate: new Date() },
        };

        const buffer = await reportGenerationService.exportData(1, 'pdf', options);
        const text = buffer.toString('utf-8');

        expect(text).toContain('Platform Breakdown:');
        expect(text).toContain('instagram: 6000 followers');
        expect(text).toContain('tiktok: 4000 followers');
      });
    });

    it('should throw error for unsupported format', async () => {
      const options = {
        timeRange: { startDate: new Date(), endDate: new Date() },
      };

      await expect(
        reportGenerationService.exportData(1, 'xml' as ExportFormat, options)
      ).rejects.toThrow('Unsupported format: xml');
    });
  });

  describe('Summary Generation', () => {
    it('should generate highlights from metrics', async () => {
      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.summary.highlights).toContain('10.0K total followers');
      expect(report.summary.highlights).toContain('5.50% engagement rate');
    });

    it('should include trend highlights', async () => {
      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.summary.highlights).toContain('Follower growth increased by 20%');
    });

    it('should limit highlights to 5 items', async () => {
      // Mock more significant changes
      vi.mocked(trendAnalysisService.analyzeTrends).mockResolvedValue({
        insights: {
          significantChanges: Array(10).fill(null).map((_, i) => ({
            description: `Change ${i + 1}`,
          })),
          recommendations: [],
        },
      });

      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.summary.highlights.length).toBeLessThanOrEqual(5);
    });

    it('should include key metrics in summary', async () => {
      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.summary.keyMetrics).toEqual({
        followers: 10000,
        engagement: 5000,
        posts: 100,
        engagementRate: 5.5,
      });
    });

    it('should include insights in summary', async () => {
      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.summary.insights).toContain('Post more during peak hours');
      expect(report.summary.insights).toContain('Focus on video content');
    });

    it('should format large numbers correctly', async () => {
      vi.mocked(metricsAggregationService.getUnifiedMetrics).mockResolvedValue({
        totalFollowers: 1500000, // 1.5M
        totalEngagement: 5000,
        totalPosts: 100,
        averageEngagementRate: 5.5,
        platformBreakdown: {},
      });

      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.summary.highlights).toContain('1.5M total followers');
    });

    it('should format thousands correctly', async () => {
      vi.mocked(metricsAggregationService.getUnifiedMetrics).mockResolvedValue({
        totalFollowers: 5500, // 5.5K
        totalEngagement: 5000,
        totalPosts: 100,
        averageEngagementRate: 5.5,
        platformBreakdown: {},
      });

      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.summary.highlights).toContain('5.5K total followers');
    });
  });

  describe('Error Handling', () => {
    it('should handle metrics service error', async () => {
      vi.mocked(metricsAggregationService.getUnifiedMetrics).mockRejectedValue(
        new Error('Metrics service error')
      );

      await expect(
        reportGenerationService.generateReport(
          1,
          'weekly',
          { startDate: new Date(), endDate: new Date() }
        )
      ).rejects.toThrow('Metrics service error');
    });

    it('should handle trend analysis error', async () => {
      vi.mocked(trendAnalysisService.analyzeTrends).mockRejectedValue(
        new Error('Trend analysis error')
      );

      await expect(
        reportGenerationService.generateReport(
          1,
          'weekly',
          { startDate: new Date(), endDate: new Date() }
        )
      ).rejects.toThrow('Trend analysis error');
    });

    it('should handle database error on save', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await expect(
        reportGenerationService.generateReport(
          1,
          'weekly',
          { startDate: new Date(), endDate: new Date() }
        )
      ).rejects.toThrow('Database error');
    });

    it('should handle database error on schedule', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await expect(
        reportGenerationService.scheduleReport({
          userId: 1,
          reportType: 'weekly',
          frequency: 'weekly',
          emailDelivery: true,
        })
      ).rejects.toThrow('Database error');
    });

    it('should handle missing metrics data', async () => {
      vi.mocked(metricsAggregationService.getUnifiedMetrics).mockResolvedValue({
        totalFollowers: 0,
        totalEngagement: 0,
        totalPosts: 0,
        averageEngagementRate: 0,
        platformBreakdown: {},
      });

      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.summary.highlights.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing trend insights', async () => {
      vi.mocked(trendAnalysisService.analyzeTrends).mockResolvedValue({
        insights: {
          significantChanges: [],
          recommendations: [],
        },
      });

      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date(), endDate: new Date() }
      );

      expect(report.summary.insights).toEqual([]);
    });
  });

  describe('Integration', () => {
    it('should generate complete report with all components', async () => {
      const report = await reportGenerationService.generateReport(
        1,
        'weekly',
        { startDate: new Date('2025-10-24'), endDate: new Date('2025-10-31') }
      );

      // Verify report structure
      expect(report).toMatchObject({
        id: expect.stringMatching(/^report_\d+$/),
        userId: 1,
        type: 'weekly',
        timeRange: {
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        },
        generatedAt: expect.any(Date),
        summary: {
          title: expect.stringContaining('Performance Report'),
          highlights: expect.any(Array),
          keyMetrics: expect.any(Object),
          insights: expect.any(Array),
        },
        metrics: expect.any(Object),
        topContent: expect.any(Array),
        trends: expect.any(Object),
      });
    });

    it('should export data in all formats', async () => {
      const options = {
        timeRange: { startDate: new Date(), endDate: new Date() },
      };

      const csvBuffer = await reportGenerationService.exportData(1, 'csv', options);
      const jsonBuffer = await reportGenerationService.exportData(1, 'json', options);
      const pdfBuffer = await reportGenerationService.exportData(1, 'pdf', options);

      expect(csvBuffer).toBeInstanceOf(Buffer);
      expect(jsonBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer).toBeInstanceOf(Buffer);

      // Verify content
      expect(csvBuffer.toString()).toContain('Metric,Value');
      expect(JSON.parse(jsonBuffer.toString())).toHaveProperty('totalFollowers');
      expect(pdfBuffer.toString()).toContain('Performance Report');
    });
  });
});
