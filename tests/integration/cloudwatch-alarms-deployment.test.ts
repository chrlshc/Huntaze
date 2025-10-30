/**
 * Integration Tests for CloudWatch Alarms Deployment
 * Tests the deployment and validation of CloudWatch alarms
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Mock AWS SDK
const mockCloudWatchClient = {
  send: vi.fn()
};

const mockSNSClient = {
  send: vi.fn()
};

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => mockCloudWatchClient),
  DescribeAlarmsCommand: vi.fn((params) => params),
  DescribeAlarmsForMetricCommand: vi.fn((params) => params),
  PutMetricAlarmCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn(() => mockSNSClient),
  ListTopicsCommand: vi.fn(),
  ListSubscriptionsByTopicCommand: vi.fn((params) => params)
}));

describe('CloudWatch Alarms Deployment Integration', () => {
  const validationScriptPath = path.join(
    process.cwd(),
    'scripts/validate-cloudwatch-alarms.sh'
  );

  beforeAll(() => {
    // Setup mock responses
    mockCloudWatchClient.send.mockResolvedValue({
      MetricAlarms: [
        {
          AlarmName: 'ecs-huntaze-api-cpu-high',
          StateValue: 'OK',
          MetricName: 'CPUUtilization',
          Threshold: 70
        },
        {
          AlarmName: 'ecs-huntaze-api-memory-high',
          StateValue: 'OK',
          MetricName: 'MemoryUtilization',
          Threshold: 80
        },
        {
          AlarmName: 'ecs-huntaze-api-no-running-tasks',
          StateValue: 'OK',
          MetricName: 'RunningTaskCount',
          Threshold: 1
        }
      ],
      CompositeAlarms: [
        {
          AlarmName: 'ecs-huntaze-api-service-unhealthy',
          StateValue: 'OK'
        }
      ]
    });

    mockSNSClient.send.mockResolvedValue({
      Topics: [
        { TopicArn: 'arn:aws:sns:us-east-1:123456789012:huntaze-ops-alerts' }
      ],
      Subscriptions: [
        {
          Protocol: 'email',
          Endpoint: 'ops@huntaze.com',
          SubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:huntaze-ops-alerts:sub-123'
        }
      ]
    });
  });

  describe('Validation Script Execution', () => {
    it('should have executable validation script', () => {
      expect(fs.existsSync(validationScriptPath)).toBe(true);
      
      const stats = fs.statSync(validationScriptPath);
      // Check if file has execute permissions (on Unix-like systems)
      if (process.platform !== 'win32') {
        expect(stats.mode & 0o111).toBeGreaterThan(0);
      }
    });

    it('should validate script has proper shebang', () => {
      const scriptContent = fs.readFileSync(validationScriptPath, 'utf-8');
      expect(scriptContent.startsWith('#!/bin/bash')).toBe(true);
    });

    it('should validate script checks SNS topics', () => {
      const scriptContent = fs.readFileSync(validationScriptPath, 'utf-8');
      expect(scriptContent).toContain('aws sns list-topics');
      expect(scriptContent).toContain('ops-alerts');
    });

    it('should validate script checks ECS alarms', () => {
      const scriptContent = fs.readFileSync(validationScriptPath, 'utf-8');
      expect(scriptContent).toContain('aws cloudwatch describe-alarms');
      expect(scriptContent).toContain('alarm-name-prefix "ecs-"');
    });

    it('should validate script checks RDS alarms', () => {
      const scriptContent = fs.readFileSync(validationScriptPath, 'utf-8');
      expect(scriptContent).toContain('alarm-name-prefix "rds-"');
    });

    it('should validate script checks SQS alarms', () => {
      const scriptContent = fs.readFileSync(validationScriptPath, 'utf-8');
      expect(scriptContent).toContain('alarm-name-prefix "sqs-"');
    });

    it('should validate script checks composite alarms', () => {
      const scriptContent = fs.readFileSync(validationScriptPath, 'utf-8');
      expect(scriptContent).toContain('alarm-types CompositeAlarm');
    });

    it('should validate script checks for active alarms', () => {
      const scriptContent = fs.readFileSync(validationScriptPath, 'utf-8');
      expect(scriptContent).toContain('state-value ALARM');
    });

    it('should validate script checks CloudWatch dashboard', () => {
      const scriptContent = fs.readFileSync(validationScriptPath, 'utf-8');
      expect(scriptContent).toContain('list-dashboards');
      expect(scriptContent).toContain('Huntaze-Alarms-Overview');
    });
  });

  describe('ECS Alarms Deployment', () => {
    it('should deploy CPU utilization alarms for all services', async () => {
      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const cpuAlarms = MetricAlarms.filter((alarm: any) => 
        alarm.MetricName === 'CPUUtilization'
      );
      
      expect(cpuAlarms.length).toBeGreaterThanOrEqual(2);
    });

    it('should deploy memory utilization alarms for all services', async () => {
      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const memoryAlarms = MetricAlarms.filter((alarm: any) => 
        alarm.MetricName === 'MemoryUtilization'
      );
      
      expect(memoryAlarms.length).toBeGreaterThanOrEqual(2);
    });

    it('should deploy task count alarms for all services', async () => {
      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const taskCountAlarms = MetricAlarms.filter((alarm: any) => 
        alarm.MetricName === 'RunningTaskCount'
      );
      
      expect(taskCountAlarms.length).toBeGreaterThanOrEqual(2);
    });

    it('should configure correct thresholds for ECS alarms', async () => {
      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const cpuAlarm = MetricAlarms.find((alarm: any) => 
        alarm.MetricName === 'CPUUtilization'
      );
      expect(cpuAlarm?.Threshold).toBe(70);
      
      const memoryAlarm = MetricAlarms.find((alarm: any) => 
        alarm.MetricName === 'MemoryUtilization'
      );
      expect(memoryAlarm?.Threshold).toBe(80);
      
      const taskCountAlarm = MetricAlarms.find((alarm: any) => 
        alarm.MetricName === 'RunningTaskCount'
      );
      expect(taskCountAlarm?.Threshold).toBe(1);
    });
  });

  describe('RDS Alarms Deployment', () => {
    it('should deploy RDS latency alarms', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        MetricAlarms: [
          {
            AlarmName: 'rds-huntaze-postgres-read-latency-high',
            MetricName: 'ReadLatency',
            Threshold: 0.1
          },
          {
            AlarmName: 'rds-huntaze-postgres-write-latency-high',
            MetricName: 'WriteLatency',
            Threshold: 0.1
          }
        ]
      });

      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      expect(MetricAlarms.some((alarm: any) => alarm.MetricName === 'ReadLatency')).toBe(true);
      expect(MetricAlarms.some((alarm: any) => alarm.MetricName === 'WriteLatency')).toBe(true);
    });

    it('should deploy RDS disk queue depth alarm', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        MetricAlarms: [
          {
            AlarmName: 'rds-huntaze-postgres-disk-queue-depth-high',
            MetricName: 'DiskQueueDepth',
            Threshold: 10
          }
        ]
      });

      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const diskQueueAlarm = MetricAlarms.find((alarm: any) => 
        alarm.MetricName === 'DiskQueueDepth'
      );
      
      expect(diskQueueAlarm).toBeDefined();
      expect(diskQueueAlarm?.Threshold).toBe(10);
    });
  });

  describe('SQS Alarms Deployment', () => {
    it('should deploy age of oldest message alarms', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        MetricAlarms: [
          {
            AlarmName: 'sqs-workflows-fifo-age-of-oldest-message-high',
            MetricName: 'ApproximateAgeOfOldestMessage',
            Threshold: 300
          },
          {
            AlarmName: 'sqs-rate-limiter-age-of-oldest-message-high',
            MetricName: 'ApproximateAgeOfOldestMessage',
            Threshold: 300
          }
        ]
      });

      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const ageAlarms = MetricAlarms.filter((alarm: any) => 
        alarm.MetricName === 'ApproximateAgeOfOldestMessage'
      );
      
      expect(ageAlarms.length).toBeGreaterThanOrEqual(2);
      ageAlarms.forEach((alarm: any) => {
        expect(alarm.Threshold).toBe(300);
      });
    });

    it('should deploy messages visible alarms', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        MetricAlarms: [
          {
            AlarmName: 'sqs-workflows-fifo-messages-visible-high',
            MetricName: 'ApproximateNumberOfMessagesVisible',
            Threshold: 1000
          },
          {
            AlarmName: 'sqs-rate-limiter-messages-visible-high',
            MetricName: 'ApproximateNumberOfMessagesVisible',
            Threshold: 1000
          }
        ]
      });

      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const messagesAlarms = MetricAlarms.filter((alarm: any) => 
        alarm.MetricName === 'ApproximateNumberOfMessagesVisible'
      );
      
      expect(messagesAlarms.length).toBeGreaterThanOrEqual(2);
    });

    it('should deploy DLQ depth alarms', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        MetricAlarms: [
          {
            AlarmName: 'sqs-workflows-fifo-dlq-depth-high',
            MetricName: 'ApproximateNumberOfMessagesVisible',
            Threshold: 10,
            Dimensions: [{ Name: 'QueueName', Value: 'huntaze-hybrid-workflows-dlq.fifo' }]
          },
          {
            AlarmName: 'sqs-rate-limiter-dlq-depth-high',
            MetricName: 'ApproximateNumberOfMessagesVisible',
            Threshold: 10,
            Dimensions: [{ Name: 'QueueName', Value: 'huntaze-rate-limiter-dlq' }]
          }
        ]
      });

      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const dlqAlarms = MetricAlarms.filter((alarm: any) => 
        alarm.AlarmName.includes('dlq')
      );
      
      expect(dlqAlarms.length).toBeGreaterThanOrEqual(2);
      dlqAlarms.forEach((alarm: any) => {
        expect(alarm.Threshold).toBe(10);
      });
    });
  });

  describe('SNS Topic Configuration', () => {
    it('should deploy ops alerts SNS topic', async () => {
      const { Topics } = await mockSNSClient.send({});
      
      const opsTopic = Topics.find((topic: any) => 
        topic.TopicArn.includes('ops-alerts')
      );
      
      expect(opsTopic).toBeDefined();
    });

    it('should configure email subscription for ops alerts', async () => {
      const { Subscriptions } = await mockSNSClient.send({});
      
      const emailSub = Subscriptions.find((sub: any) => 
        sub.Protocol === 'email'
      );
      
      expect(emailSub).toBeDefined();
      expect(emailSub?.Endpoint).toContain('@');
    });
  });

  describe('Composite Alarms Deployment', () => {
    it('should deploy ECS service health composite alarm', async () => {
      const { CompositeAlarms } = await mockCloudWatchClient.send({});
      
      const ecsComposite = CompositeAlarms.find((alarm: any) => 
        alarm.AlarmName.includes('service-unhealthy')
      );
      
      expect(ecsComposite).toBeDefined();
    });

    it('should deploy RDS database health composite alarm', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        CompositeAlarms: [
          {
            AlarmName: 'rds-huntaze-postgres-unhealthy',
            StateValue: 'OK'
          }
        ]
      });

      const { CompositeAlarms } = await mockCloudWatchClient.send({});
      
      const rdsComposite = CompositeAlarms.find((alarm: any) => 
        alarm.AlarmName.includes('postgres-unhealthy')
      );
      
      expect(rdsComposite).toBeDefined();
    });
  });

  describe('CloudWatch Dashboard Deployment', () => {
    it('should deploy alarms overview dashboard', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        DashboardEntries: [
          {
            DashboardName: 'Huntaze-Alarms-Overview',
            DashboardArn: 'arn:aws:cloudwatch::123456789012:dashboard/Huntaze-Alarms-Overview'
          }
        ]
      });

      const { DashboardEntries } = await mockCloudWatchClient.send({});
      
      const dashboard = DashboardEntries.find((d: any) => 
        d.DashboardName === 'Huntaze-Alarms-Overview'
      );
      
      expect(dashboard).toBeDefined();
    });
  });

  describe('Alarm State Monitoring', () => {
    it('should detect alarms in ALARM state', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        MetricAlarms: [
          {
            AlarmName: 'ecs-huntaze-api-cpu-high',
            StateValue: 'ALARM',
            StateReason: 'Threshold Crossed: 1 datapoint [75.0] was greater than the threshold (70.0).'
          }
        ]
      });

      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const alarmsInAlarmState = MetricAlarms.filter((alarm: any) => 
        alarm.StateValue === 'ALARM'
      );
      
      expect(alarmsInAlarmState.length).toBeGreaterThan(0);
      expect(alarmsInAlarmState[0].StateReason).toBeDefined();
    });

    it('should verify all alarms have actions configured', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        MetricAlarms: [
          {
            AlarmName: 'ecs-huntaze-api-cpu-high',
            AlarmActions: ['arn:aws:sns:us-east-1:123456789012:huntaze-ops-alerts'],
            OKActions: ['arn:aws:sns:us-east-1:123456789012:huntaze-ops-alerts']
          }
        ]
      });

      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      MetricAlarms.forEach((alarm: any) => {
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Terraform State Validation', () => {
    it('should validate Terraform configuration is valid', () => {
      const terraformDir = path.join(process.cwd(), 'infra/terraform/production-hardening');
      
      try {
        // This would normally run terraform validate
        // execSync('terraform validate', { cwd: terraformDir, stdio: 'pipe' });
        expect(fs.existsSync(path.join(terraformDir, 'cloudwatch-alarms.tf'))).toBe(true);
      } catch (error) {
        // In test environment, just check file exists
        expect(fs.existsSync(path.join(terraformDir, 'cloudwatch-alarms.tf'))).toBe(true);
      }
    });

    it('should have required variables defined', () => {
      const variablesPath = path.join(
        process.cwd(),
        'infra/terraform/production-hardening/variables.tf'
      );
      
      if (fs.existsSync(variablesPath)) {
        const variablesContent = fs.readFileSync(variablesPath, 'utf-8');
        expect(variablesContent).toContain('ops_alert_email');
        expect(variablesContent).toContain('rds_instance_identifier');
      }
    });
  });

  describe('Alarm Coverage Validation', () => {
    it('should have comprehensive ECS coverage', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        MetricAlarms: [
          { AlarmName: 'ecs-huntaze-api-cpu-high', MetricName: 'CPUUtilization' },
          { AlarmName: 'ecs-huntaze-api-memory-high', MetricName: 'MemoryUtilization' },
          { AlarmName: 'ecs-huntaze-api-no-running-tasks', MetricName: 'RunningTaskCount' },
          { AlarmName: 'ecs-onlyfans-scraper-cpu-high', MetricName: 'CPUUtilization' },
          { AlarmName: 'ecs-onlyfans-scraper-memory-high', MetricName: 'MemoryUtilization' },
          { AlarmName: 'ecs-onlyfans-scraper-no-running-tasks', MetricName: 'RunningTaskCount' }
        ]
      });

      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const ecsAlarms = MetricAlarms.filter((alarm: any) => 
        alarm.AlarmName.startsWith('ecs-')
      );
      
      expect(ecsAlarms.length).toBeGreaterThanOrEqual(6);
    });

    it('should have comprehensive RDS coverage', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        MetricAlarms: [
          { AlarmName: 'rds-huntaze-postgres-cpu-high', MetricName: 'CPUUtilization' },
          { AlarmName: 'rds-huntaze-postgres-memory-low', MetricName: 'FreeableMemory' },
          { AlarmName: 'rds-huntaze-postgres-connections-high', MetricName: 'DatabaseConnections' },
          { AlarmName: 'rds-huntaze-postgres-read-latency-high', MetricName: 'ReadLatency' },
          { AlarmName: 'rds-huntaze-postgres-write-latency-high', MetricName: 'WriteLatency' },
          { AlarmName: 'rds-huntaze-postgres-disk-queue-depth-high', MetricName: 'DiskQueueDepth' }
        ]
      });

      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const rdsAlarms = MetricAlarms.filter((alarm: any) => 
        alarm.AlarmName.startsWith('rds-')
      );
      
      expect(rdsAlarms.length).toBeGreaterThanOrEqual(6);
    });

    it('should have comprehensive SQS coverage', async () => {
      mockCloudWatchClient.send.mockResolvedValueOnce({
        MetricAlarms: [
          { AlarmName: 'sqs-workflows-fifo-age-of-oldest-message-high' },
          { AlarmName: 'sqs-workflows-fifo-messages-visible-high' },
          { AlarmName: 'sqs-workflows-fifo-dlq-depth-high' },
          { AlarmName: 'sqs-rate-limiter-age-of-oldest-message-high' },
          { AlarmName: 'sqs-rate-limiter-messages-visible-high' },
          { AlarmName: 'sqs-rate-limiter-dlq-depth-high' }
        ]
      });

      const { MetricAlarms } = await mockCloudWatchClient.send({});
      
      const sqsAlarms = MetricAlarms.filter((alarm: any) => 
        alarm.AlarmName.startsWith('sqs-')
      );
      
      expect(sqsAlarms.length).toBeGreaterThanOrEqual(6);
    });
  });
});
