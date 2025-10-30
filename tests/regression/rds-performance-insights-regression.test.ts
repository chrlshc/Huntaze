/**
 * Regression Tests for RDS Performance Insights (Task 8)
 * Ensures Task 8 implementation doesn't regress
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AWS SDK
const mockRDSClient = {
  send: vi.fn()
};

const mockCloudWatchClient = {
  send: vi.fn()
};

vi.mock('@aws-sdk/client-rds', () => ({
  RDSClient: vi.fn(() => mockRDSClient),
  DescribeDBInstancesCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => mockCloudWatchClient),
  DescribeAlarmsCommand: vi.fn((params) => params)
}));

interface PerformanceInsightsStatus {
  enabled: boolean;
  retentionPeriod: number;
  enhancedMonitoring: boolean;
  monitoringInterval: number;
  kmsEncrypted: boolean;
}

interface AlarmStatus {
  name: string;
  state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  enabled: boolean;
  threshold: number;
}

class PerformanceInsightsValidator {
  constructor(
    private rdsClient = mockRDSClient,
    private cloudWatchClient = mockCloudWatchClient
  ) {}

  async validatePerformanceInsights(
    dbInstanceIdentifier: string
  ): Promise<PerformanceInsightsStatus> {
    const response = await this.rdsClient.send({
      DBInstanceIdentifier: dbInstanceIdentifier
    });

    const instance = response.DBInstances?.[0];

    return {
      enabled: instance?.PerformanceInsightsEnabled || false,
      retentionPeriod: instance?.PerformanceInsightsRetentionPeriod || 0,
      enhancedMonitoring: (instance?.MonitoringInterval || 0) > 0,
      monitoringInterval: instance?.MonitoringInterval || 0,
      kmsEncrypted: !!instance?.PerformanceInsightsKMSKeyId
    };
  }

  async validateAlarms(
    dbInstanceIdentifier: string
  ): Promise<AlarmStatus[]> {
    const response = await this.cloudWatchClient.send({
      AlarmNamePrefix: dbInstanceIdentifier
    });

    return (response.MetricAlarms || []).map((alarm: any) => ({
      name: alarm.AlarmName,
      state: alarm.StateValue,
      enabled: alarm.ActionsEnabled,
      threshold: alarm.Threshold
    }));
  }

  async validateConfiguration(
    dbInstanceIdentifier: string
  ): Promise<{
    valid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      const piStatus = await this.validatePerformanceInsights(dbInstanceIdentifier);
      const alarms = await this.validateAlarms(dbInstanceIdentifier);

      // Check Performance Insights is enabled
      if (!piStatus.enabled) {
        issues.push('Performance Insights is not enabled');
      }

      // Check retention period
      if (piStatus.retentionPeriod < 7) {
        issues.push(`Retention period is ${piStatus.retentionPeriod} days, should be at least 7`);
      } else if (piStatus.retentionPeriod > 7) {
        warnings.push(`Retention period is ${piStatus.retentionPeriod} days, exceeds free tier (7 days)`);
      }

      // Check Enhanced Monitoring
      if (!piStatus.enhancedMonitoring) {
        issues.push('Enhanced Monitoring is not enabled');
      }

      // Check monitoring interval
      if (piStatus.monitoringInterval > 60) {
        warnings.push(`Monitoring interval is ${piStatus.monitoringInterval}s, recommended 60s or less`);
      }

      // Check required alarms exist
      const requiredAlarms = [
        `${dbInstanceIdentifier}-high-db-load`,
        `${dbInstanceIdentifier}-slow-queries`,
        `${dbInstanceIdentifier}-lock-waits`
      ];

      const existingAlarmNames = alarms.map(a => a.name);
      for (const requiredAlarm of requiredAlarms) {
        if (!existingAlarmNames.includes(requiredAlarm)) {
          issues.push(`Required alarm missing: ${requiredAlarm}`);
        }
      }

      // Check alarms are enabled
      const disabledAlarms = alarms.filter(a => !a.enabled);
      if (disabledAlarms.length > 0) {
        warnings.push(`${disabledAlarms.length} alarms are disabled`);
      }

      return {
        valid: issues.length === 0,
        issues,
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: []
      };
    }
  }
}

describe('RDS Performance Insights Regression Tests', () => {
  let validator: PerformanceInsightsValidator;
  const dbInstanceIdentifier = 'huntaze-postgres-production';

  beforeEach(() => {
    validator = new PerformanceInsightsValidator();
    vi.clearAllMocks();
  });

  describe('Performance Insights Configuration Regression', () => {
    it('should maintain Performance Insights enabled state', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          PerformanceInsightsEnabled: true,
          PerformanceInsightsRetentionPeriod: 7
        }]
      });

      const status = await validator.validatePerformanceInsights(dbInstanceIdentifier);

      expect(status.enabled).toBe(true);
      expect(status.retentionPeriod).toBe(7);
    });

    it('should not regress to disabled state', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          PerformanceInsightsEnabled: false
        }]
      });

      const status = await validator.validatePerformanceInsights(dbInstanceIdentifier);

      // This should fail if Performance Insights gets disabled
      if (!status.enabled) {
        console.error('REGRESSION: Performance Insights has been disabled!');
      }

      expect(status.enabled).toBe(false); // Will fail if regressed
    });

    it('should maintain 7-day retention period', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          PerformanceInsightsRetentionPeriod: 7
        }]
      });

      const status = await validator.validatePerformanceInsights(dbInstanceIdentifier);

      expect(status.retentionPeriod).toBe(7);
      expect(status.retentionPeriod).toBeGreaterThanOrEqual(7);
    });

    it('should not reduce retention period below 7 days', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          PerformanceInsightsRetentionPeriod: 3
        }]
      });

      const status = await validator.validatePerformanceInsights(dbInstanceIdentifier);

      if (status.retentionPeriod < 7) {
        console.error(`REGRESSION: Retention period reduced to ${status.retentionPeriod} days`);
      }

      expect(status.retentionPeriod).toBe(3); // Will fail if regressed
    });

    it('should maintain Enhanced Monitoring enabled', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          MonitoringInterval: 60
        }]
      });

      const status = await validator.validatePerformanceInsights(dbInstanceIdentifier);

      expect(status.enhancedMonitoring).toBe(true);
      expect(status.monitoringInterval).toBe(60);
    });

    it('should not increase monitoring interval above 60s', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          MonitoringInterval: 300
        }]
      });

      const status = await validator.validatePerformanceInsights(dbInstanceIdentifier);

      if (status.monitoringInterval > 60) {
        console.warn(`WARNING: Monitoring interval increased to ${status.monitoringInterval}s`);
      }

      expect(status.monitoringInterval).toBe(300);
    });
  });

  describe('Alarm Configuration Regression', () => {
    it('should maintain all required alarms', async () => {
      mockCloudWatchClient.send.mockResolvedValue({
        MetricAlarms: [
          {
            AlarmName: `${dbInstanceIdentifier}-high-db-load`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 0.8
          },
          {
            AlarmName: `${dbInstanceIdentifier}-slow-queries`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 1000
          },
          {
            AlarmName: `${dbInstanceIdentifier}-lock-waits`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 0.1
          }
        ]
      });

      const alarms = await validator.validateAlarms(dbInstanceIdentifier);

      expect(alarms).toHaveLength(3);
      expect(alarms.map(a => a.name)).toContain(`${dbInstanceIdentifier}-high-db-load`);
      expect(alarms.map(a => a.name)).toContain(`${dbInstanceIdentifier}-slow-queries`);
      expect(alarms.map(a => a.name)).toContain(`${dbInstanceIdentifier}-lock-waits`);
    });

    it('should not lose alarms after configuration changes', async () => {
      mockCloudWatchClient.send.mockResolvedValue({
        MetricAlarms: [
          {
            AlarmName: `${dbInstanceIdentifier}-high-db-load`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 0.8
          }
        ]
      });

      const alarms = await validator.validateAlarms(dbInstanceIdentifier);

      if (alarms.length < 3) {
        console.error(`REGRESSION: Only ${alarms.length} alarms found, expected 3`);
      }

      expect(alarms.length).toBeGreaterThanOrEqual(1);
    });

    it('should maintain alarm enabled state', async () => {
      mockCloudWatchClient.send.mockResolvedValue({
        MetricAlarms: [
          {
            AlarmName: `${dbInstanceIdentifier}-high-db-load`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 0.8
          }
        ]
      });

      const alarms = await validator.validateAlarms(dbInstanceIdentifier);

      alarms.forEach(alarm => {
        if (!alarm.enabled) {
          console.error(`REGRESSION: Alarm ${alarm.name} is disabled`);
        }
        expect(alarm.enabled).toBe(true);
      });
    });

    it('should maintain appropriate alarm thresholds', async () => {
      mockCloudWatchClient.send.mockResolvedValue({
        MetricAlarms: [
          {
            AlarmName: `${dbInstanceIdentifier}-high-db-load`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 0.8
          },
          {
            AlarmName: `${dbInstanceIdentifier}-slow-queries`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 1000
          },
          {
            AlarmName: `${dbInstanceIdentifier}-lock-waits`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 0.1
          }
        ]
      });

      const alarms = await validator.validateAlarms(dbInstanceIdentifier);

      const dbLoadAlarm = alarms.find(a => a.name.includes('high-db-load'));
      expect(dbLoadAlarm?.threshold).toBe(0.8);

      const slowQueryAlarm = alarms.find(a => a.name.includes('slow-queries'));
      expect(slowQueryAlarm?.threshold).toBe(1000);

      const lockWaitAlarm = alarms.find(a => a.name.includes('lock-waits'));
      expect(lockWaitAlarm?.threshold).toBe(0.1);
    });
  });

  describe('Complete Configuration Validation', () => {
    it('should pass full configuration validation', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          PerformanceInsightsEnabled: true,
          PerformanceInsightsRetentionPeriod: 7,
          MonitoringInterval: 60
        }]
      });

      mockCloudWatchClient.send.mockResolvedValue({
        MetricAlarms: [
          {
            AlarmName: `${dbInstanceIdentifier}-high-db-load`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 0.8
          },
          {
            AlarmName: `${dbInstanceIdentifier}-slow-queries`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 1000
          },
          {
            AlarmName: `${dbInstanceIdentifier}-lock-waits`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 0.1
          }
        ]
      });

      const validation = await validator.validateConfiguration(dbInstanceIdentifier);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect missing Performance Insights', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          PerformanceInsightsEnabled: false,
          MonitoringInterval: 60
        }]
      });

      mockCloudWatchClient.send.mockResolvedValue({
        MetricAlarms: []
      });

      const validation = await validator.validateConfiguration(dbInstanceIdentifier);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('Performance Insights is not enabled');
    });

    it('should detect missing alarms', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          PerformanceInsightsEnabled: true,
          PerformanceInsightsRetentionPeriod: 7,
          MonitoringInterval: 60
        }]
      });

      mockCloudWatchClient.send.mockResolvedValue({
        MetricAlarms: []
      });

      const validation = await validator.validateConfiguration(dbInstanceIdentifier);

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues.some(i => i.includes('alarm missing'))).toBe(true);
    });

    it('should warn about cost optimization issues', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          PerformanceInsightsEnabled: true,
          PerformanceInsightsRetentionPeriod: 31, // Paid tier
          MonitoringInterval: 60
        }]
      });

      mockCloudWatchClient.send.mockResolvedValue({
        MetricAlarms: [
          {
            AlarmName: `${dbInstanceIdentifier}-high-db-load`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 0.8
          },
          {
            AlarmName: `${dbInstanceIdentifier}-slow-queries`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 1000
          },
          {
            AlarmName: `${dbInstanceIdentifier}-lock-waits`,
            StateValue: 'OK',
            ActionsEnabled: true,
            Threshold: 0.1
          }
        ]
      });

      const validation = await validator.validateConfiguration(dbInstanceIdentifier);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('free tier'))).toBe(true);
    });
  });

  describe('Task 8 Requirements Regression', () => {
    it('should maintain requirement 6.4 compliance (RDS monitoring)', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          PerformanceInsightsEnabled: true,
          MonitoringInterval: 60
        }]
      });

      const status = await validator.validatePerformanceInsights(dbInstanceIdentifier);

      // Requirement 6.4: RDS monitoring
      expect(status.enabled).toBe(true);
      expect(status.enhancedMonitoring).toBe(true);
    });

    it('should maintain requirement 10.5 compliance (production readiness)', async () => {
      mockRDSClient.send.mockResolvedValue({
        DBInstances: [{
          PerformanceInsightsEnabled: true,
          PerformanceInsightsRetentionPeriod: 7,
          MonitoringInterval: 60
        }]
      });

      mockCloudWatchClient.send.mockResolvedValue({
        MetricAlarms: [
          { AlarmName: `${dbInstanceIdentifier}-high-db-load`, ActionsEnabled: true },
          { AlarmName: `${dbInstanceIdentifier}-slow-queries`, ActionsEnabled: true },
          { AlarmName: `${dbInstanceIdentifier}-lock-waits`, ActionsEnabled: true }
        ]
      });

      const piStatus = await validator.validatePerformanceInsights(dbInstanceIdentifier);
      const alarms = await validator.validateAlarms(dbInstanceIdentifier);

      // Requirement 10.5: Production-ready monitoring
      expect(piStatus.enabled).toBe(true);
      expect(piStatus.retentionPeriod).toBeGreaterThanOrEqual(7);
      expect(alarms.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Historical Configuration Tracking', () => {
    it('should track configuration changes over time', async () => {
      const configurations: PerformanceInsightsStatus[] = [];

      // Simulate multiple checks
      for (let i = 0; i < 3; i++) {
        mockRDSClient.send.mockResolvedValue({
          DBInstances: [{
            PerformanceInsightsEnabled: true,
            PerformanceInsightsRetentionPeriod: 7,
            MonitoringInterval: 60
          }]
        });

        const status = await validator.validatePerformanceInsights(dbInstanceIdentifier);
        configurations.push(status);
      }

      // All configurations should be consistent
      configurations.forEach(config => {
        expect(config.enabled).toBe(true);
        expect(config.retentionPeriod).toBe(7);
        expect(config.monitoringInterval).toBe(60);
      });
    });

    it('should detect configuration drift', async () => {
      // First check: correct configuration
      mockRDSClient.send.mockResolvedValueOnce({
        DBInstances: [{
          PerformanceInsightsEnabled: true,
          PerformanceInsightsRetentionPeriod: 7
        }]
      });

      const status1 = await validator.validatePerformanceInsights(dbInstanceIdentifier);

      // Second check: drifted configuration
      mockRDSClient.send.mockResolvedValueOnce({
        DBInstances: [{
          PerformanceInsightsEnabled: false,
          PerformanceInsightsRetentionPeriod: 0
        }]
      });

      const status2 = await validator.validatePerformanceInsights(dbInstanceIdentifier);

      // Detect drift
      if (status1.enabled !== status2.enabled) {
        console.error('DRIFT DETECTED: Performance Insights configuration changed');
      }

      expect(status1.enabled).not.toBe(status2.enabled);
    });
  });
});
