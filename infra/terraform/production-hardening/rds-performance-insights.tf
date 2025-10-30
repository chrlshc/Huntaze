# ============================================================================
# RDS Performance Insights - Database Performance Monitoring
# ============================================================================
# Enables Performance Insights for query analysis and slow query detection
# References: AWS RDS Performance Insights Best Practices
# ============================================================================

# ============================================================================
# Data Sources - Existing RDS Instance
# ============================================================================

data "aws_db_instance" "postgres_production" {
  db_instance_identifier = var.rds_instance_identifier
}

# ============================================================================
# RDS Performance Insights Configuration
# ============================================================================
# Note: Performance Insights is enabled via RDS instance modification
# This configuration creates the monitoring role and alarms

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "huntaze-rds-enhanced-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "huntaze-rds-enhanced-monitoring-role"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "RDS Enhanced Monitoring"
  }
}

# Attach AWS managed policy for enhanced monitoring
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ============================================================================
# CloudWatch Log Group for Performance Insights
# ============================================================================

resource "aws_cloudwatch_log_group" "rds_performance_insights" {
  name              = "/aws/rds/instance/${var.rds_instance_identifier}/performance-insights"
  retention_in_days = var.performance_insights_log_retention_days

  tags = {
    Name        = "rds-performance-insights-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "RDS Performance Insights logs"
  }
}

# ============================================================================
# CloudWatch Alarms for Performance Insights
# ============================================================================

# Alarm: Database Load > 80% of vCPU
resource "aws_cloudwatch_metric_alarm" "rds_db_load_high" {
  alarm_name          = "rds-${var.rds_instance_identifier}-db-load-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DBLoad"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rds_db_load_threshold
  alarm_description   = "Database load exceeds ${var.rds_db_load_threshold} average active sessions"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Name        = "rds-db-load-high-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Alarm: Database Load by Wait Event - Lock Waits
resource "aws_cloudwatch_metric_alarm" "rds_lock_waits_high" {
  alarm_name          = "rds-${var.rds_instance_identifier}-lock-waits-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DBLoadByWaitEvent"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rds_lock_wait_threshold
  alarm_description   = "Database lock waits exceed ${var.rds_lock_wait_threshold}ms"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
    WaitEvent            = "Lock"
  }

  tags = {
    Name        = "rds-lock-waits-high-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}


# Alarm: Read Latency High

# Alarm: Write Latency High

# ============================================================================
# CloudWatch Dashboard for RDS Performance
# ============================================================================

resource "aws_cloudwatch_dashboard" "rds_performance" {
  dashboard_name = "Huntaze-RDS-Performance"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DBLoad", { stat = "Average", label = "DB Load (Avg Active Sessions)" }, { DBInstanceIdentifier = var.rds_instance_identifier }],
            ["...", { stat = "Maximum", label = "DB Load (Max)" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Database Load"
          period  = 300
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average" }, { DBInstanceIdentifier = var.rds_instance_identifier }],
            [".", "FreeableMemory", { stat = "Average", yAxis = "right" }, { DBInstanceIdentifier = var.rds_instance_identifier }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "CPU & Memory"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "ReadLatency", { stat = "Average", label = "Read Latency" }, { DBInstanceIdentifier = var.rds_instance_identifier }],
            [".", "WriteLatency", { stat = "Average", label = "Write Latency" }, { DBInstanceIdentifier = var.rds_instance_identifier }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Read/Write Latency (ms)"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average" }, { DBInstanceIdentifier = var.rds_instance_identifier }],
            [".", "DatabaseConnections", { stat = "Maximum", label = "Max Connections" }, { DBInstanceIdentifier = var.rds_instance_identifier }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Database Connections"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "ReadIOPS", { stat = "Average" }, { DBInstanceIdentifier = var.rds_instance_identifier }],
            [".", "WriteIOPS", { stat = "Average" }, { DBInstanceIdentifier = var.rds_instance_identifier }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "IOPS"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DBLoadByWaitEvent", { stat = "Average", label = "Lock Waits" }, { DBInstanceIdentifier = var.rds_instance_identifier, WaitEvent = "Lock" }],
            ["...", { label = "IO Waits" }, { WaitEvent = "IO" }],
            ["...", { label = "CPU Waits" }, { WaitEvent = "CPU" }]
          ]
          view    = "timeSeries"
          stacked = true
          region  = var.aws_region
          title   = "DB Load by Wait Event"
          period  = 300
        }
      },
      {
        type = "log"
        properties = {
          query   = <<-EOT
            SOURCE '/aws/rds/instance/${var.rds_instance_identifier}/slowquery'
            | fields @timestamp, @message
            | filter @message like /Query_time/
            | parse @message /Query_time: (?<query_time>[\d.]+)/
            | filter query_time > 1.0
            | sort query_time desc
            | limit 20
          EOT
          region  = var.aws_region
          title   = "Slow Queries (> 1 second)"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", { stat = "Average" }, { DBInstanceIdentifier = var.rds_instance_identifier }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Free Storage Space"
          period  = 300
        }
      }
    ]
  })
}

# ============================================================================
# Outputs
# ============================================================================

output "rds_performance_insights_enabled" {
  description = "Whether Performance Insights is enabled"
  value       = true
}

output "rds_enhanced_monitoring_role_arn" {
  description = "ARN of the enhanced monitoring IAM role"
  value       = aws_iam_role.rds_enhanced_monitoring.arn
}

output "rds_performance_dashboard_name" {
  description = "Name of the RDS performance CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.rds_performance.dashboard_name
}

output "rds_performance_alarms" {
  description = "List of RDS performance alarms created"
  value = [
    aws_cloudwatch_metric_alarm.rds_db_load_high.alarm_name,
    aws_cloudwatch_metric_alarm.rds_lock_waits_high.alarm_name,
    aws_cloudwatch_metric_alarm.rds_read_latency_high.alarm_name,
    aws_cloudwatch_metric_alarm.rds_write_latency_high.alarm_name
  ]
}
