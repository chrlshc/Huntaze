/**
 * Integration Tests - Report Generation Service
 * 
 * Integration tests for report generation with real database
 * Based on: .kiro/specs/advanced-analytics/tasks.md (Task 8)
 * 
 * Coverage:
 * - End-to-end report generation
 * - Database persistence
 * - Schedule management
 * - Export functionality
 * - Multi-user scenarios
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { reportGenerationService } from '../../../lib/services/reportGenerationService';
import { getPool } from '../../../lib/db';

describe('Report Generation Service - Integration', () => {
  let testUserId: number;
  const pool = getPool();

  beforeAll(async () => {
    // Create test user
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, email_verified)
       VALUES ($1, $2, $3, true)
       RETURNING id`,
      ['report-test@example.com', 'Report Test User', 'hash']
    );
    testUserId = result.rows[0].id;

    // Create test analytics data
    await pool.query(
      `INSERT INTO analytics_snapshots (
        user_id, platform, snapshot_date, followers, engagement, posts
      ) VALUES 
        ($1, 'instagram', NOW() - INTERVAL '7 days', 5000, 2500, 50),
        ($1, 'instagram', NOW(), 5500, 2750, 55),
        ($1, 'tiktok', NOW() - INTERVAL '7 days', 3000, 1500, 30),
        ($1, 'tiktok', NOW(), 3300, 1650, 33)`,
      [testUserId]
    );
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM generated_reports WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM report_schedules WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM analytics_snapshots WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  beforeEach(async () => {
    // Clean up reports before each test
    await pool.query('DELETE FROM generated_reports WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM report_schedules WHERE user_id = $1', [testUserId]);
  });

  describe('Report Generation', () => {
    it('should generate and persist weekly report', async () => {
      const timeRange = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      };

      const report = await reportGenerationService.generateReport(
        testUserId,
        'weekly',
        timeRange
      );

      // Verify report was created
      expect(report).toBeDefined();
      expect(report.userId).toBe(testUserId);
      expect(report.type).toBe('weekly');

      // Verify report was saved to database
      const result = await pool.query(
        'SELECT * FROM generated_reports WHERE user_id = $1',
        [testUserId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].report_type).toBe('weekly');
    });

    it('should generate report with real metrics', async () => {
      const timeRange = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      };

      const report = await reportGenerationService.generateReport(
        testUserId,
        'weekly',
        timeRange
      );

      // Verify metrics are populated
      expect(report.metrics).toBeDefined();
      expect(report.metrics.totalFollowers).toBeGreaterThan(0);
      expect(report.summary).toBeDefined();
      expect(report.summary.keyMetrics).toBeDefined();
    });

    it('should generate multiple reports for same user', async () => {
      const timeRange1 = {
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };

      const timeRange2 = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      };

      await reportGenerationService.generateReport(testUserId, 'weekly', timeRange1);
      await reportGenerationService.generateReport(testUserId, 'weekly', timeRange2);

      const result = await pool.query(
        'SELECT * FROM generated_reports WHERE user_id = $1 ORDER BY generated_at',
        [testUserId]
      );

      expect(result.rows.length).toBe(2);
    });
  });

  describe('Report Scheduling', () => {
    it('should create weekly schedule', async () => {
      const schedule = {
        userId: testUserId,
        reportType: 'weekly' as const,
        frequency: 'weekly' as const,
        dayOfWeek: 1,
        timeOfDay: '09:00',
        emailDelivery: true,
      };

      await reportGenerationService.scheduleReport(schedule);

      const result = await pool.query(
        'SELECT * FROM report_schedules WHERE user_id = $1',
        [testUserId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].report_type).toBe('weekly');
      expect(result.rows[0].frequency).toBe('weekly');
      expect(result.rows[0].day_of_week).toBe(1);
      expect(result.rows[0].enabled).toBe(true);
    });

    it('should create monthly schedule', async () => {
      const schedule = {
        userId: testUserId,
        reportType: 'monthly' as const,
        frequency: 'monthly' as const,
        dayOfMonth: 1,
        timeOfDay: '08:00',
        emailDelivery: true,
      };

      await reportGenerationService.scheduleReport(schedule);

      const result = await pool.query(
        'SELECT * FROM report_schedules WHERE user_id = $1',
        [testUserId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].report_type).toBe('monthly');
      expect(result.rows[0].day_of_month).toBe(1);
    });

    it('should update existing schedule', async () => {
      // Create initial schedule
      const schedule1 = {
        userId: testUserId,
        reportType: 'weekly' as const,
        frequency: 'weekly' as const,
        dayOfWeek: 1,
        timeOfDay: '09:00',
        emailDelivery: true,
      };

      await reportGenerationService.scheduleReport(schedule1);

      // Update schedule
      const schedule2 = {
        userId: testUserId,
        reportType: 'weekly' as const,
        frequency: 'weekly' as const,
        dayOfWeek: 5, // Changed to Friday
        timeOfDay: '17:00', // Changed time
        emailDelivery: false, // Changed email delivery
      };

      await reportGenerationService.scheduleReport(schedule2);

      const result = await pool.query(
        'SELECT * FROM report_schedules WHERE user_id = $1',
        [testUserId]
      );

      // Should still have only one schedule (updated)
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].day_of_week).toBe(5);
      expect(result.rows[0].time_of_day).toBe('17:00');
      expect(result.rows[0].email_delivery).toBe(false);
    });

    it('should allow multiple schedules for different report types', async () => {
      const weeklySchedule = {
        userId: testUserId,
        reportType: 'weekly' as const,
        frequency: 'weekly' as const,
        dayOfWeek: 1,
        emailDelivery: true,
      };

      const monthlySchedule = {
        userId: testUserId,
        reportType: 'monthly' as const,
        frequency: 'monthly' as const,
        dayOfMonth: 1,
        emailDelivery: true,
      };

      await reportGenerationService.scheduleReport(weeklySchedule);
      await reportGenerationService.scheduleReport(monthlySchedule);

      const result = await pool.query(
        'SELECT * FROM report_schedules WHERE user_id = $1 ORDER BY report_type',
        [testUserId]
      );

      expect(result.rows.length).toBe(2);
      expect(result.rows[0].report_type).toBe('monthly');
      expect(result.rows[1].report_type).toBe('weekly');
    });
  });

  describe('Data Export', () => {
    it('should export data to CSV format', async () => {
      const options = {
        timeRange: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        },
      };

      const buffer = await reportGenerationService.exportData(
        testUserId,
        'csv',
        options
      );

      expect(buffer).toBeInstanceOf(Buffer);
      const csv = buffer.toString('utf-8');
      expect(csv).toContain('Metric,Value');
      expect(csv).toContain('Total Followers');
    });

    it('should export data to JSON format', async () => {
      const options = {
        timeRange: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        },
      };

      const buffer = await reportGenerationService.exportData(
        testUserId,
        'json',
        options
      );

      expect(buffer).toBeInstanceOf(Buffer);
      const json = JSON.parse(buffer.toString('utf-8'));
      expect(json).toHaveProperty('totalFollowers');
      expect(json).toHaveProperty('totalEngagement');
    });

    it('should export data to PDF format', async () => {
      const options = {
        timeRange: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        },
      };

      const buffer = await reportGenerationService.exportData(
        testUserId,
        'pdf',
        options
      );

      expect(buffer).toBeInstanceOf(Buffer);
      const text = buffer.toString('utf-8');
      expect(text).toContain('Performance Report');
    });
  });

  describe('Multi-User Scenarios', () => {
    let secondUserId: number;

    beforeAll(async () => {
      // Create second test user
      const result = await pool.query(
        `INSERT INTO users (email, name, password_hash, email_verified)
         VALUES ($1, $2, $3, true)
         RETURNING id`,
        ['report-test-2@example.com', 'Report Test User 2', 'hash']
      );
      secondUserId = result.rows[0].id;
    });

    afterAll(async () => {
      await pool.query('DELETE FROM generated_reports WHERE user_id = $1', [secondUserId]);
      await pool.query('DELETE FROM report_schedules WHERE user_id = $1', [secondUserId]);
      await pool.query('DELETE FROM users WHERE id = $1', [secondUserId]);
    });

    it('should isolate reports between users', async () => {
      const timeRange = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      };

      // Generate reports for both users
      await reportGenerationService.generateReport(testUserId, 'weekly', timeRange);
      await reportGenerationService.generateReport(secondUserId, 'weekly', timeRange);

      // Verify each user has only their own report
      const user1Reports = await pool.query(
        'SELECT * FROM generated_reports WHERE user_id = $1',
        [testUserId]
      );

      const user2Reports = await pool.query(
        'SELECT * FROM generated_reports WHERE user_id = $1',
        [secondUserId]
      );

      expect(user1Reports.rows.length).toBe(1);
      expect(user2Reports.rows.length).toBe(1);
      expect(user1Reports.rows[0].user_id).toBe(testUserId);
      expect(user2Reports.rows[0].user_id).toBe(secondUserId);
    });

    it('should isolate schedules between users', async () => {
      const schedule = {
        userId: testUserId,
        reportType: 'weekly' as const,
        frequency: 'weekly' as const,
        dayOfWeek: 1,
        emailDelivery: true,
      };

      await reportGenerationService.scheduleReport(schedule);
      await reportGenerationService.scheduleReport({
        ...schedule,
        userId: secondUserId,
      });

      const user1Schedules = await pool.query(
        'SELECT * FROM report_schedules WHERE user_id = $1',
        [testUserId]
      );

      const user2Schedules = await pool.query(
        'SELECT * FROM report_schedules WHERE user_id = $1',
        [secondUserId]
      );

      expect(user1Schedules.rows.length).toBe(1);
      expect(user2Schedules.rows.length).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user ID', async () => {
      const timeRange = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      };

      // Should not throw, but return empty metrics
      const report = await reportGenerationService.generateReport(
        99999,
        'weekly',
        timeRange
      );

      expect(report).toBeDefined();
    });

    it('should handle empty time range', async () => {
      const timeRange = {
        startDate: new Date(),
        endDate: new Date(),
      };

      const report = await reportGenerationService.generateReport(
        testUserId,
        'weekly',
        timeRange
      );

      expect(report).toBeDefined();
      expect(report.metrics).toBeDefined();
    });
  });
});
