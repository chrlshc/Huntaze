/**
 * Unit Tests for CloudWatch Alarms Configuration
 * Tests Task 6: Create CloudWatch alarms for ECS, RDS, and SQS
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('CloudWatch Alarms Configuration - Task 6', () => {
  const terraformFilePath = path.join(
    process.cwd(),
    'infra/terraform/production-hardening/cloudwatch-alarms.tf'
  );

  let terraformContent: string;

  beforeEach(() => {
    if (fs.existsSync(terraformFilePath)) {
      terraformContent = fs.readFileSync(terraformFilePath, 'utf-8');
    }
  });

  describe('SNS Topic Configuration', () => {
    it('should define ops alerts SNS topic', () => {
      expect(terraformContent).toContain('resource "aws_sns_topic" "ops_alerts"');
      expect(terraformContent).toContain('name              = "huntaze-ops-alerts"');
    });

    it('should enable SNS encryption with KMS', () => {
      expect(terraformContent).toContain('kms_master_key_id = aws_kms_key.sns_encryption.id');
    });

    it('should configure SNS topic policy for CloudWatch', () => {
      expect(terraformContent).toContain('resource "aws_sns_topic_policy" "ops_alerts"');
      expect(terraformContent).toContain('Service = "cloudwatch.amazonaws.com"');
      expect(terraformContent).toContain('Action   = "SNS:Publish"');
    });

    it('should configure email subscription', () => {
      expect(terraformContent).toContain('resource "aws_sns_topic_subscription" "ops_alerts_email"');
      expect(terraformContent).toContain('protocol  = "email"');
      expect(terraformContent).toContain('endpoint  = var.ops_alert_email');
    });
  });

  describe('ECS Alarms - CPU Utilization', () => {
    it('should create CPU alarm for huntaze-api service', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "ecs_service_cpu_high_api"');
      expect(terraformContent).toContain('alarm_name          = "ecs-huntaze-api-cpu-high"');
    });

    it('should configure CPU threshold at 70%', () => {
      const cpuAlarmMatch = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "ecs_service_cpu_high_api"[\s\S]*?threshold\s*=\s*"(\d+)"/
      );
      expect(cpuAlarmMatch).toBeTruthy();
      expect(cpuAlarmMatch?.[1]).toBe('70');
    });

    it('should use correct metric name and namespace for CPU', () => {
      const cpuAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "ecs_service_cpu_high_api"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(cpuAlarmSection).toContain('metric_name         = "CPUUtilization"');
      expect(cpuAlarmSection).toContain('namespace           = "AWS/ECS"');
    });

    it('should create CPU alarm for onlyfans-scraper service', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "ecs_service_cpu_high_scraper"');
      expect(terraformContent).toContain('alarm_name          = "ecs-onlyfans-scraper-cpu-high"');
    });

    it('should configure alarm actions for CPU alarms', () => {
      const cpuAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "ecs_service_cpu_high_api"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(cpuAlarmSection).toContain('alarm_actions       = [aws_sns_topic.ops_alerts.arn]');
      expect(cpuAlarmSection).toContain('ok_actions          = [aws_sns_topic.ops_alerts.arn]');
    });

    it('should set appropriate evaluation periods for CPU', () => {
      const cpuAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "ecs_service_cpu_high_api"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(cpuAlarmSection).toContain('evaluation_periods  = "2"');
      expect(cpuAlarmSection).toContain('period              = "300"');
    });
  });

  describe('ECS Alarms - Memory Utilization', () => {
    it('should create memory alarm for huntaze-api service', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "ecs_service_memory_high_api"');
      expect(terraformContent).toContain('alarm_name          = "ecs-huntaze-api-memory-high"');
    });

    it('should configure memory threshold at 80%', () => {
      const memoryAlarmMatch = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "ecs_service_memory_high_api"[\s\S]*?threshold\s*=\s*"(\d+)"/
      );
      expect(memoryAlarmMatch).toBeTruthy();
      expect(memoryAlarmMatch?.[1]).toBe('80');
    });

    it('should use correct metric name for memory', () => {
      const memoryAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "ecs_service_memory_high_api"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(memoryAlarmSection).toContain('metric_name         = "MemoryUtilization"');
    });

    it('should create memory alarm for onlyfans-scraper service', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "ecs_service_memory_high_scraper"');
      expect(terraformContent).toContain('alarm_name          = "ecs-onlyfans-scraper-memory-high"');
    });
  });

  describe('ECS Alarms - Task Count', () => {
    it('should create task count alarm for huntaze-api service', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "ecs_service_task_count_low_api"');
      expect(terraformContent).toContain('alarm_name          = "ecs-huntaze-api-no-running-tasks"');
    });

    it('should configure task count threshold less than 1', () => {
      const taskCountAlarmMatch = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "ecs_service_task_count_low_api"[\s\S]*?threshold\s*=\s*"(\d+)"/
      );
      expect(taskCountAlarmMatch).toBeTruthy();
      expect(taskCountAlarmMatch?.[1]).toBe('1');
    });

    it('should use LessThanThreshold comparison for task count', () => {
      const taskCountAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "ecs_service_task_count_low_api"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(taskCountAlarmSection).toContain('comparison_operator = "LessThanThreshold"');
    });

    it('should use RunningTaskCount metric from ContainerInsights', () => {
      const taskCountAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "ecs_service_task_count_low_api"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(taskCountAlarmSection).toContain('metric_name         = "RunningTaskCount"');
      expect(taskCountAlarmSection).toContain('namespace           = "ECS/ContainerInsights"');
    });

    it('should treat missing data as breaching for task count', () => {
      const taskCountAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "ecs_service_task_count_low_api"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(taskCountAlarmSection).toContain('treat_missing_data  = "breaching"');
    });

    it('should mark task count alarms as critical severity', () => {
      const taskCountAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "ecs_service_task_count_low_api"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(taskCountAlarmSection).toContain('Severity    = "critical"');
    });
  });

  describe('RDS Alarms - CPU and Memory', () => {
    it('should reference RDS CPU alarm from s3-rds-security.tf', () => {
      // This alarm is defined in s3-rds-security.tf
      expect(terraformContent).toContain('aws_cloudwatch_metric_alarm.rds_cpu_high.alarm_name');
    });

    it('should reference RDS memory alarm from s3-rds-security.tf', () => {
      expect(terraformContent).toContain('aws_cloudwatch_metric_alarm.rds_memory_low.alarm_name');
    });

    it('should reference RDS connections alarm from s3-rds-security.tf', () => {
      expect(terraformContent).toContain('aws_cloudwatch_metric_alarm.rds_connections_high.alarm_name');
    });
  });

  describe('RDS Alarms - Latency', () => {
    it('should create read latency alarm', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "rds_read_latency_high"');
      expect(terraformContent).toContain('alarm_name          = "rds-huntaze-postgres-read-latency-high"');
    });

    it('should configure read latency threshold at 100ms', () => {
      const readLatencyAlarmMatch = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "rds_read_latency_high"[\s\S]*?threshold\s*=\s*"([\d.]+)"/
      );
      expect(readLatencyAlarmMatch).toBeTruthy();
      expect(readLatencyAlarmMatch?.[1]).toBe('0.1');
    });

    it('should create write latency alarm', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "rds_write_latency_high"');
      expect(terraformContent).toContain('alarm_name          = "rds-huntaze-postgres-write-latency-high"');
    });

    it('should use correct metric names for latency', () => {
      expect(terraformContent).toContain('metric_name         = "ReadLatency"');
      expect(terraformContent).toContain('metric_name         = "WriteLatency"');
    });
  });

  describe('RDS Alarms - Disk Queue Depth', () => {
    it('should create disk queue depth alarm', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "rds_disk_queue_depth_high"');
      expect(terraformContent).toContain('alarm_name          = "rds-huntaze-postgres-disk-queue-depth-high"');
    });

    it('should configure disk queue depth threshold at 10', () => {
      const diskQueueAlarmMatch = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "rds_disk_queue_depth_high"[\s\S]*?threshold\s*=\s*"(\d+)"/
      );
      expect(diskQueueAlarmMatch).toBeTruthy();
      expect(diskQueueAlarmMatch?.[1]).toBe('10');
    });

    it('should use DiskQueueDepth metric', () => {
      const diskQueueAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "rds_disk_queue_depth_high"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(diskQueueAlarmSection).toContain('metric_name         = "DiskQueueDepth"');
      expect(diskQueueAlarmSection).toContain('namespace           = "AWS/RDS"');
    });
  });

  describe('SQS Alarms - Age of Oldest Message', () => {
    it('should create age alarm for FIFO queue', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "sqs_age_of_oldest_message_fifo"');
      expect(terraformContent).toContain('alarm_name          = "sqs-workflows-fifo-age-of-oldest-message-high"');
    });

    it('should configure age threshold at 300 seconds', () => {
      const ageAlarmMatch = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "sqs_age_of_oldest_message_fifo"[\s\S]*?threshold\s*=\s*"(\d+)"/
      );
      expect(ageAlarmMatch).toBeTruthy();
      expect(ageAlarmMatch?.[1]).toBe('300');
    });

    it('should create age alarm for standard queue', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "sqs_age_of_oldest_message_standard"');
      expect(terraformContent).toContain('alarm_name          = "sqs-rate-limiter-age-of-oldest-message-high"');
    });

    it('should use ApproximateAgeOfOldestMessage metric', () => {
      const ageAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "sqs_age_of_oldest_message_fifo"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(ageAlarmSection).toContain('metric_name         = "ApproximateAgeOfOldestMessage"');
      expect(ageAlarmSection).toContain('namespace           = "AWS/SQS"');
    });

    it('should use Maximum statistic for age metric', () => {
      const ageAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "sqs_age_of_oldest_message_fifo"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(ageAlarmSection).toContain('statistic           = "Maximum"');
    });
  });

  describe('SQS Alarms - Messages Visible', () => {
    it('should create messages visible alarm for FIFO queue', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "sqs_messages_visible_fifo"');
      expect(terraformContent).toContain('alarm_name          = "sqs-workflows-fifo-messages-visible-high"');
    });

    it('should configure messages visible threshold at 1000', () => {
      const messagesAlarmMatch = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "sqs_messages_visible_fifo"[\s\S]*?threshold\s*=\s*"(\d+)"/
      );
      expect(messagesAlarmMatch).toBeTruthy();
      expect(messagesAlarmMatch?.[1]).toBe('1000');
    });

    it('should create messages visible alarm for standard queue', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "sqs_messages_visible_standard"');
    });

    it('should use ApproximateNumberOfMessagesVisible metric', () => {
      const messagesAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "sqs_messages_visible_fifo"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(messagesAlarmSection).toContain('metric_name         = "ApproximateNumberOfMessagesVisible"');
    });
  });

  describe('SQS Alarms - DLQ Depth', () => {
    it('should create DLQ depth alarm for FIFO DLQ', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "sqs_dlq_depth_fifo"');
      expect(terraformContent).toContain('alarm_name          = "sqs-workflows-fifo-dlq-depth-high"');
    });

    it('should configure DLQ depth threshold at 10', () => {
      const dlqAlarmMatch = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "sqs_dlq_depth_fifo"[\s\S]*?threshold\s*=\s*"(\d+)"/
      );
      expect(dlqAlarmMatch).toBeTruthy();
      expect(dlqAlarmMatch?.[1]).toBe('10');
    });

    it('should create DLQ depth alarm for standard DLQ', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_metric_alarm" "sqs_dlq_depth_standard"');
      expect(terraformContent).toContain('alarm_name          = "sqs-rate-limiter-dlq-depth-high"');
    });

    it('should mark DLQ alarms as critical severity', () => {
      const dlqAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "sqs_dlq_depth_fifo"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(dlqAlarmSection).toContain('Severity    = "critical"');
    });

    it('should treat missing data as not breaching for DLQ', () => {
      const dlqAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "sqs_dlq_depth_fifo"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(dlqAlarmSection).toContain('treat_missing_data  = "notBreaching"');
    });

    it('should use fast evaluation period for DLQ (60 seconds)', () => {
      const dlqAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_metric_alarm" "sqs_dlq_depth_fifo"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(dlqAlarmSection).toContain('period              = "60"');
    });
  });

  describe('Composite Alarms', () => {
    it('should create composite alarm for API service health', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_composite_alarm" "ecs_api_service_unhealthy"');
      expect(terraformContent).toContain('alarm_name          = "ecs-huntaze-api-service-unhealthy"');
    });

    it('should combine task count and resource alarms for API', () => {
      const compositeAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_composite_alarm" "ecs_api_service_unhealthy"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(compositeAlarmSection).toContain('ecs_service_task_count_low_api');
      expect(compositeAlarmSection).toContain('ecs_service_cpu_high_api');
      expect(compositeAlarmSection).toContain('ecs_service_memory_high_api');
    });

    it('should create composite alarm for RDS health', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_composite_alarm" "rds_database_unhealthy"');
      expect(terraformContent).toContain('alarm_name          = "rds-huntaze-postgres-unhealthy"');
    });

    it('should combine multiple RDS metrics in composite alarm', () => {
      const rdsCompositeSection = terraformContent.match(
        /resource "aws_cloudwatch_composite_alarm" "rds_database_unhealthy"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(rdsCompositeSection).toContain('rds_cpu_high');
      expect(rdsCompositeSection).toContain('rds_memory_low');
      expect(rdsCompositeSection).toContain('rds_connections_high');
    });

    it('should mark composite alarms as critical', () => {
      const compositeAlarmSection = terraformContent.match(
        /resource "aws_cloudwatch_composite_alarm" "ecs_api_service_unhealthy"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(compositeAlarmSection).toContain('Severity    = "critical"');
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should create alarms overview dashboard', () => {
      expect(terraformContent).toContain('resource "aws_cloudwatch_dashboard" "alarms_overview"');
      expect(terraformContent).toContain('dashboard_name = "Huntaze-Alarms-Overview"');
    });

    it('should include critical alarms widget', () => {
      const dashboardSection = terraformContent.match(
        /resource "aws_cloudwatch_dashboard" "alarms_overview"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(dashboardSection).toContain('title  = "Critical Alarms"');
      expect(dashboardSection).toContain('ecs_service_task_count_low_api');
      expect(dashboardSection).toContain('sqs_dlq_depth_fifo');
    });

    it('should include ECS service alarms widget', () => {
      const dashboardSection = terraformContent.match(
        /resource "aws_cloudwatch_dashboard" "alarms_overview"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(dashboardSection).toContain('title  = "ECS Service Alarms"');
    });

    it('should include RDS alarms widget', () => {
      const dashboardSection = terraformContent.match(
        /resource "aws_cloudwatch_dashboard" "alarms_overview"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(dashboardSection).toContain('title  = "RDS Alarms"');
    });

    it('should include SQS alarms widget', () => {
      const dashboardSection = terraformContent.match(
        /resource "aws_cloudwatch_dashboard" "alarms_overview"[\s\S]*?(?=resource|$)/
      )?.[0];
      
      expect(dashboardSection).toContain('title  = "SQS Alarms"');
    });
  });

  describe('Alarm Tags and Metadata', () => {
    it('should tag all alarms with Environment', () => {
      const alarmResources = terraformContent.match(/resource "aws_cloudwatch_metric_alarm"/g);
      expect(alarmResources).toBeTruthy();
      expect(alarmResources!.length).toBeGreaterThan(10);
      
      // Check that tags section exists for alarms
      expect(terraformContent).toContain('Environment = "production"');
    });

    it('should tag all alarms with ManagedBy terraform', () => {
      expect(terraformContent).toContain('ManagedBy   = "terraform"');
    });

    it('should assign severity levels to alarms', () => {
      expect(terraformContent).toContain('Severity    = "warning"');
      expect(terraformContent).toContain('Severity    = "critical"');
    });
  });

  describe('Alarm Coverage Requirements', () => {
    it('should have at least 6 ECS alarms (2 services × 3 metrics)', () => {
      const ecsAlarms = terraformContent.match(/resource "aws_cloudwatch_metric_alarm" "ecs_service/g);
      expect(ecsAlarms).toBeTruthy();
      expect(ecsAlarms!.length).toBeGreaterThanOrEqual(6);
    });

    it('should have at least 3 RDS alarms (additional to s3-rds-security.tf)', () => {
      const rdsAlarms = terraformContent.match(/resource "aws_cloudwatch_metric_alarm" "rds_/g);
      expect(rdsAlarms).toBeTruthy();
      expect(rdsAlarms!.length).toBeGreaterThanOrEqual(3);
    });

    it('should have at least 6 SQS alarms (2 queues × 3 metrics)', () => {
      const sqsAlarms = terraformContent.match(/resource "aws_cloudwatch_metric_alarm" "sqs_/g);
      expect(sqsAlarms).toBeTruthy();
      expect(sqsAlarms!.length).toBeGreaterThanOrEqual(6);
    });

    it('should have at least 2 composite alarms', () => {
      const compositeAlarms = terraformContent.match(/resource "aws_cloudwatch_composite_alarm"/g);
      expect(compositeAlarms).toBeTruthy();
      expect(compositeAlarms!.length).toBeGreaterThanOrEqual(2);
    });
  });
});
