# ============================================================================
# CloudWatch Alarms - ECS, RDS, SQS
# ============================================================================
# Comprehensive monitoring and alerting for production services
# ============================================================================

# ============================================================================
# SNS Topic for Operational Alerts
# ============================================================================

resource "aws_sns_topic" "ops_alerts" {
  name              = "huntaze-ops-alerts"
  display_name      = "Huntaze Operational Alerts"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name        = "huntaze-ops-alerts"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Operational alerts"
  }
}

resource "aws_sns_topic_policy" "ops_alerts" {
  arn = aws_sns_topic.ops_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.ops_alerts.arn
      }
    ]
  })
}

# Email subscription
resource "aws_sns_topic_subscription" "ops_alerts_email" {
  topic_arn = aws_sns_topic.ops_alerts.arn
  protocol  = "email"
  endpoint  = var.ops_alert_email
}

# ============================================================================
# ECS Service-Level Alarms
# ============================================================================

# Data: Get ECS services
# Commented out - services don't exist yet
# data "aws_ecs_service" "huntaze_api" {
#   service_name = "huntaze-api"
#   cluster_arn  = data.aws_ecs_cluster.huntaze_cluster.arn
# }

# data "aws_ecs_service" "onlyfans_scraper" {
#   service_name = "huntaze-onlyfans-scraper"
#   cluster_arn  = data.aws_ecs_cluster.huntaze_of_fargate.arn
# }

# CPU Utilization Alarms (per service)
resource "aws_cloudwatch_metric_alarm" "ecs_service_cpu_high_api" {
  alarm_name          = "ecs-huntaze-api-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "ECS huntaze-api service CPU utilization > 70%"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    ServiceName = "huntaze-api"
    ClusterName = "huntaze-cluster"
  }

  tags = {
    Name        = "ecs-huntaze-api-cpu-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_service_cpu_high_scraper" {
  alarm_name          = "ecs-onlyfans-scraper-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "ECS onlyfans-scraper service CPU utilization > 70%"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    ServiceName = "huntaze-onlyfans-scraper"
    ClusterName = "huntaze-of-fargate"
  }

  tags = {
    Name        = "ecs-onlyfans-scraper-cpu-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Memory Utilization Alarms (per service)
resource "aws_cloudwatch_metric_alarm" "ecs_service_memory_high_api" {
  alarm_name          = "ecs-huntaze-api-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS huntaze-api service memory utilization > 80%"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    ServiceName = "huntaze-api"
    ClusterName = "huntaze-cluster"
  }

  tags = {
    Name        = "ecs-huntaze-api-memory-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_service_memory_high_scraper" {
  alarm_name          = "ecs-onlyfans-scraper-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS onlyfans-scraper service memory utilization > 80%"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    ServiceName = "huntaze-onlyfans-scraper"
    ClusterName = "huntaze-of-fargate"
  }

  tags = {
    Name        = "ecs-onlyfans-scraper-memory-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Task Count Alarms (service availability)
resource "aws_cloudwatch_metric_alarm" "ecs_service_task_count_low_api" {
  alarm_name          = "ecs-huntaze-api-no-running-tasks"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "ECS huntaze-api service has no running tasks (CRITICAL)"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    ServiceName = "huntaze-api"
    ClusterName = "huntaze-cluster"
  }

  tags = {
    Name        = "ecs-huntaze-api-task-count-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "critical"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_service_task_count_low_scraper" {
  alarm_name          = "ecs-onlyfans-scraper-no-running-tasks"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "ECS onlyfans-scraper service has no running tasks (CRITICAL)"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    ServiceName = "huntaze-onlyfans-scraper"
    ClusterName = "huntaze-of-fargate"
  }

  tags = {
    Name        = "ecs-onlyfans-scraper-task-count-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "critical"
  }
}

# ============================================================================
# RDS Alarms (Additional to those in s3-rds-security.tf)
# ============================================================================

# Read Latency Alarm
resource "aws_cloudwatch_metric_alarm" "rds_read_latency_high" {
  alarm_name          = "rds-huntaze-postgres-read-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0.1" # 100ms
  alarm_description   = "RDS read latency > 100ms"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Name        = "rds-read-latency-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Write Latency Alarm
resource "aws_cloudwatch_metric_alarm" "rds_write_latency_high" {
  alarm_name          = "rds-huntaze-postgres-write-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "WriteLatency"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0.1" # 100ms
  alarm_description   = "RDS write latency > 100ms"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Name        = "rds-write-latency-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Disk Queue Depth Alarm
resource "aws_cloudwatch_metric_alarm" "rds_disk_queue_depth_high" {
  alarm_name          = "rds-huntaze-postgres-disk-queue-depth-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DiskQueueDepth"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "RDS disk queue depth > 10 (I/O bottleneck)"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Name        = "rds-disk-queue-depth-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# ============================================================================
# SQS Alarms
# ============================================================================

# Age of Oldest Message Alarm (FIFO Queue)
resource "aws_cloudwatch_metric_alarm" "sqs_age_of_oldest_message_fifo" {
  alarm_name          = "sqs-workflows-fifo-age-of-oldest-message-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "300" # 5 minutes
  alarm_description   = "SQS workflows FIFO queue has messages older than 5 minutes"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    QueueName = data.aws_sqs_queue.hybrid_workflows_fifo.name
  }

  tags = {
    Name        = "sqs-workflows-fifo-age-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Age of Oldest Message Alarm (Standard Queue)
resource "aws_cloudwatch_metric_alarm" "sqs_age_of_oldest_message_standard" {
  alarm_name          = "sqs-rate-limiter-age-of-oldest-message-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "300" # 5 minutes
  alarm_description   = "SQS rate-limiter queue has messages older than 5 minutes"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    QueueName = data.aws_sqs_queue.rate_limiter_queue.name
  }

  tags = {
    Name        = "sqs-rate-limiter-age-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Number of Messages Visible Alarm (FIFO Queue)
resource "aws_cloudwatch_metric_alarm" "sqs_messages_visible_fifo" {
  alarm_name          = "sqs-workflows-fifo-messages-visible-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "SQS workflows FIFO queue has > 1000 visible messages (backlog)"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    QueueName = data.aws_sqs_queue.hybrid_workflows_fifo.name
  }

  tags = {
    Name        = "sqs-workflows-fifo-backlog-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Number of Messages Visible Alarm (Standard Queue)
resource "aws_cloudwatch_metric_alarm" "sqs_messages_visible_standard" {
  alarm_name          = "sqs-rate-limiter-messages-visible-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "SQS rate-limiter queue has > 1000 visible messages (backlog)"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    QueueName = data.aws_sqs_queue.rate_limiter_queue.name
  }

  tags = {
    Name        = "sqs-rate-limiter-backlog-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# DLQ Depth Alarm (FIFO DLQ)
resource "aws_cloudwatch_metric_alarm" "sqs_dlq_depth_fifo" {
  alarm_name          = "sqs-workflows-fifo-dlq-depth-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "SQS workflows FIFO DLQ has > 10 messages (CRITICAL - investigate failures)"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = data.aws_sqs_queue.hybrid_workflows_dlq_fifo.name
  }

  tags = {
    Name        = "sqs-workflows-fifo-dlq-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "critical"
  }
}

# DLQ Depth Alarm (Standard DLQ)
resource "aws_cloudwatch_metric_alarm" "sqs_dlq_depth_standard" {
  alarm_name          = "sqs-rate-limiter-dlq-depth-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "SQS rate-limiter DLQ has > 10 messages (CRITICAL - investigate failures)"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.rate_limiter_dlq.name
  }

  tags = {
    Name        = "sqs-rate-limiter-dlq-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "critical"
  }
}

# ============================================================================
# Composite Alarms (Advanced)
# ============================================================================

# Service Health Composite Alarm (API)
resource "aws_cloudwatch_composite_alarm" "ecs_api_service_unhealthy" {
  alarm_name          = "ecs-huntaze-api-service-unhealthy"
  alarm_description   = "Composite alarm: huntaze-api service is unhealthy (multiple metrics breached)"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.ecs_service_task_count_low_api.alarm_name})",
    "(ALARM(${aws_cloudwatch_metric_alarm.ecs_service_cpu_high_api.alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.ecs_service_memory_high_api.alarm_name}))"
  ])

  tags = {
    Name        = "ecs-api-composite-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "critical"
  }
}

# Database Health Composite Alarm
resource "aws_cloudwatch_composite_alarm" "rds_database_unhealthy" {
  alarm_name          = "rds-huntaze-postgres-unhealthy"
  alarm_description   = "Composite alarm: RDS database is unhealthy (multiple metrics breached)"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.rds_cpu_high.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.rds_memory_low.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.rds_connections_high.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.rds_storage_low.alarm_name})"
  ])

  tags = {
    Name        = "rds-composite-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "critical"
  }
}

# ============================================================================
# CloudWatch Dashboard for Alarms
# ============================================================================

resource "aws_cloudwatch_dashboard" "alarms_overview" {
  dashboard_name = "Huntaze-Alarms-Overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "alarm"
        properties = {
          title  = "Critical Alarms"
          alarms = [
            aws_cloudwatch_metric_alarm.ecs_service_task_count_low_api.arn,
            aws_cloudwatch_metric_alarm.ecs_service_task_count_low_scraper.arn,
            aws_cloudwatch_metric_alarm.sqs_dlq_depth_fifo.arn,
            aws_cloudwatch_metric_alarm.sqs_dlq_depth_standard.arn
          ]
        }
      },
      {
        type = "alarm"
        properties = {
          title  = "ECS Service Alarms"
          alarms = [
            aws_cloudwatch_metric_alarm.ecs_service_cpu_high_api.arn,
            aws_cloudwatch_metric_alarm.ecs_service_memory_high_api.arn,
            aws_cloudwatch_metric_alarm.ecs_service_cpu_high_scraper.arn,
            aws_cloudwatch_metric_alarm.ecs_service_memory_high_scraper.arn
          ]
        }
      },
      {
        type = "alarm"
        properties = {
          title  = "RDS Alarms"
          alarms = [
            aws_cloudwatch_metric_alarm.rds_cpu_high.arn,
            aws_cloudwatch_metric_alarm.rds_memory_low.arn,
            aws_cloudwatch_metric_alarm.rds_connections_high.arn,
            aws_cloudwatch_metric_alarm.rds_read_latency_high.arn,
            aws_cloudwatch_metric_alarm.rds_write_latency_high.arn
          ]
        }
      },
      {
        type = "alarm"
        properties = {
          title  = "SQS Alarms"
          alarms = [
            aws_cloudwatch_metric_alarm.sqs_age_of_oldest_message_fifo.arn,
            aws_cloudwatch_metric_alarm.sqs_age_of_oldest_message_standard.arn,
            aws_cloudwatch_metric_alarm.sqs_messages_visible_fifo.arn,
            aws_cloudwatch_metric_alarm.sqs_messages_visible_standard.arn
          ]
        }
      }
    ]
  })
}
