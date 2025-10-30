# ============================================================================
# ECS Container Insights & CloudWatch Logs Retention
# ============================================================================
# Enables enhanced observability for ECS clusters and configures log retention
# References: AWS Container Insights Documentation, CloudWatch Logs Best Practices
# ============================================================================

# ============================================================================
# Data Sources: Existing ECS Clusters
# ============================================================================

data "aws_ecs_cluster" "ai_team" {
  cluster_name = "ai-team"
}

data "aws_ecs_cluster" "huntaze_cluster" {
  cluster_name = "huntaze-cluster"
}

data "aws_ecs_cluster" "huntaze_of_fargate" {
  cluster_name = "huntaze-of-fargate"
}

# ============================================================================
# Enable Container Insights (Enhanced Observability)
# ============================================================================

# Note: Container Insights must be enabled via AWS CLI or Console for existing clusters
# For new clusters, use the setting block in aws_ecs_cluster resource
# 
# To enable on existing clusters, run:
# aws ecs update-cluster-settings --cluster <name> --settings name=containerInsights,value=enhanced

# Account-level default for new clusters
resource "null_resource" "enable_container_insights_account_default" {
  provisioner "local-exec" {
    command = <<-EOT
      aws ecs put-account-setting \
        --name containerInsights \
        --value enhanced \
        --principal-arn arn:aws:iam::${var.aws_account_id}:root \
        --region ${var.aws_region} || true
    EOT
  }

  triggers = {
    always_run = timestamp()
  }
}

# Enable Container Insights on existing clusters
resource "null_resource" "enable_container_insights_ai_team" {
  provisioner "local-exec" {
    command = <<-EOT
      aws ecs update-cluster-settings \
        --cluster ai-team \
        --settings name=containerInsights,value=enhanced \
        --region ${var.aws_region}
    EOT
  }

  triggers = {
    cluster_arn = data.aws_ecs_cluster.ai_team.arn
  }
}

resource "null_resource" "enable_container_insights_huntaze_cluster" {
  provisioner "local-exec" {
    command = <<-EOT
      aws ecs update-cluster-settings \
        --cluster huntaze-cluster \
        --settings name=containerInsights,value=enhanced \
        --region ${var.aws_region}
    EOT
  }

  triggers = {
    cluster_arn = data.aws_ecs_cluster.huntaze_cluster.arn
  }
}

resource "null_resource" "enable_container_insights_huntaze_of_fargate" {
  provisioner "local-exec" {
    command = <<-EOT
      aws ecs update-cluster-settings \
        --cluster huntaze-of-fargate \
        --settings name=containerInsights,value=enhanced \
        --region ${var.aws_region}
    EOT
  }

  triggers = {
    cluster_arn = data.aws_ecs_cluster.huntaze_of_fargate.arn
  }
}

# ============================================================================
# CloudWatch Log Groups with Retention
# ============================================================================

# ECS Application Logs (30 days retention)
resource "aws_cloudwatch_log_group" "ecs_huntaze_api" {
  name              = "/ecs/huntaze/api"
  retention_in_days = var.ecs_app_log_retention_days

  tags = {
    Name        = "huntaze-api-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "ECS application logs"
    LogType     = "application"
  }
}

resource "aws_cloudwatch_log_group" "ecs_huntaze_onlyfans_scraper" {
  name              = "/ecs/huntaze/onlyfans-scraper"
  retention_in_days = var.ecs_app_log_retention_days

  tags = {
    Name        = "huntaze-onlyfans-scraper-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "OnlyFans scraper logs"
    LogType     = "application"
  }
}

resource "aws_cloudwatch_log_group" "ecs_huntaze_playwright" {
  name              = "/ecs/huntaze/playwright"
  retention_in_days = var.ecs_batch_log_retention_days

  tags = {
    Name        = "huntaze-playwright-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Playwright batch job logs"
    LogType     = "batch"
  }
}

resource "aws_cloudwatch_log_group" "ecs_ai_team_orchestrator" {
  name              = "/ecs/ai-team/orchestrator"
  retention_in_days = var.ecs_app_log_retention_days

  tags = {
    Name        = "ai-team-orchestrator-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "AI orchestrator logs"
    LogType     = "application"
  }
}

# Lambda Logs (30 days retention)
resource "aws_cloudwatch_log_group" "lambda_rate_limiter" {
  name              = "/aws/lambda/huntaze-rate-limiter"
  retention_in_days = var.lambda_log_retention_days

  tags = {
    Name        = "huntaze-rate-limiter-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Rate limiter Lambda logs"
    LogType     = "lambda"
  }
}

# ============================================================================
# CloudWatch Alarms for Container Insights Metrics
# ============================================================================

# CPU Utilization Alarm (per cluster)
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high_ai_team" {
  alarm_name          = "ecs-ai-team-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CpuUtilized"
  namespace           = "ECS/ContainerInsights"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "ECS ai-team cluster CPU utilization is high"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    ClusterName = "ai-team"
  }

  tags = {
    Name        = "ecs-ai-team-cpu-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high_huntaze_cluster" {
  alarm_name          = "ecs-huntaze-cluster-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CpuUtilized"
  namespace           = "ECS/ContainerInsights"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "ECS huntaze-cluster CPU utilization is high"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    ClusterName = "huntaze-cluster"
  }

  tags = {
    Name        = "ecs-huntaze-cluster-cpu-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high_huntaze_of_fargate" {
  alarm_name          = "ecs-huntaze-of-fargate-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CpuUtilized"
  namespace           = "ECS/ContainerInsights"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "ECS huntaze-of-fargate cluster CPU utilization is high"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    ClusterName = "huntaze-of-fargate"
  }

  tags = {
    Name        = "ecs-huntaze-of-fargate-cpu-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Memory Utilization Alarm (per cluster)
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high_ai_team" {
  alarm_name          = "ecs-ai-team-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilized"
  namespace           = "ECS/ContainerInsights"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS ai-team cluster memory utilization is high"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    ClusterName = "ai-team"
  }

  tags = {
    Name        = "ecs-ai-team-memory-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high_huntaze_cluster" {
  alarm_name          = "ecs-huntaze-cluster-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilized"
  namespace           = "ECS/ContainerInsights"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS huntaze-cluster memory utilization is high"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    ClusterName = "huntaze-cluster"
  }

  tags = {
    Name        = "ecs-huntaze-cluster-memory-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high_huntaze_of_fargate" {
  alarm_name          = "ecs-huntaze-of-fargate-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilized"
  namespace           = "ECS/ContainerInsights"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS huntaze-of-fargate cluster memory utilization is high"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    ClusterName = "huntaze-of-fargate"
  }

  tags = {
    Name        = "ecs-huntaze-of-fargate-memory-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Task Count Alarm (service availability)
resource "aws_cloudwatch_metric_alarm" "ecs_task_count_low" {
  alarm_name          = "ecs-huntaze-api-task-count-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "ECS huntaze-api service has no running tasks"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    ServiceName = "huntaze-api"
    ClusterName = "huntaze-cluster"
  }

  tags = {
    Name        = "ecs-huntaze-api-task-count-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Container Restart Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_restart_count_high" {
  alarm_name          = "ecs-huntaze-api-restart-count-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RestartCount"
  namespace           = "ECS/ContainerInsights"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "ECS huntaze-api service has high restart count"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    ServiceName = "huntaze-api"
    ClusterName = "huntaze-cluster"
  }

  tags = {
    Name        = "ecs-huntaze-api-restart-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# ============================================================================
# CloudWatch Dashboard for Container Insights
# ============================================================================

resource "aws_cloudwatch_dashboard" "ecs_container_insights" {
  dashboard_name = "Huntaze-ECS-Container-Insights"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["ECS/ContainerInsights", "CpuUtilized", { stat = "Average", label = "ai-team" }, { ClusterName = "ai-team" }],
            ["...", { stat = "Average", label = "huntaze-cluster" }, { ClusterName = "huntaze-cluster" }],
            ["...", { stat = "Average", label = "huntaze-of-fargate" }, { ClusterName = "huntaze-of-fargate" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "CPU Utilization by Cluster"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["ECS/ContainerInsights", "MemoryUtilized", { stat = "Average", label = "ai-team" }, { ClusterName = "ai-team" }],
            ["...", { stat = "Average", label = "huntaze-cluster" }, { ClusterName = "huntaze-cluster" }],
            ["...", { stat = "Average", label = "huntaze-of-fargate" }, { ClusterName = "huntaze-of-fargate" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Memory Utilization by Cluster"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["ECS/ContainerInsights", "RunningTaskCount", { stat = "Average" }, { ClusterName = "ai-team" }],
            ["...", { ClusterName = "huntaze-cluster" }],
            ["...", { ClusterName = "huntaze-of-fargate" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Running Task Count by Cluster"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["ECS/ContainerInsights", "RestartCount", { stat = "Sum" }, { ClusterName = "ai-team" }],
            ["...", { ClusterName = "huntaze-cluster" }],
            ["...", { ClusterName = "huntaze-of-fargate" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Container Restart Count by Cluster"
          period  = 300
        }
      },
      {
        type = "log"
        properties = {
          query   = <<-EOT
            SOURCE '/ecs/huntaze/api'
            | fields @timestamp, @message
            | filter @message like /ERROR/
            | sort @timestamp desc
            | limit 20
          EOT
          region  = var.aws_region
          title   = "Recent Errors - Huntaze API"
        }
      },
      {
        type = "log"
        properties = {
          query   = <<-EOT
            SOURCE '/ecs/huntaze/onlyfans-scraper'
            | fields @timestamp, @message
            | filter @message like /ERROR/
            | sort @timestamp desc
            | limit 20
          EOT
          region  = var.aws_region
          title   = "Recent Errors - OnlyFans Scraper"
        }
      }
    ]
  })
}

# ============================================================================
# Automated Log Retention Management (for existing log groups)
# ============================================================================

# Lambda function to automatically set retention on new log groups
resource "aws_lambda_function" "log_retention_manager" {
  count = var.enable_automated_log_retention ? 1 : 0

  filename      = "${path.module}/lambda/log-retention-manager.zip"
  function_name = "huntaze-log-retention-manager"
  role          = aws_iam_role.log_retention_manager[0].arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 60

  environment {
    variables = {
      DEFAULT_RETENTION_DAYS = var.ecs_app_log_retention_days
    }
  }

  tags = {
    Name        = "huntaze-log-retention-manager"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Automated log retention management"
  }
}

# IAM role for Lambda
resource "aws_iam_role" "log_retention_manager" {
  count = var.enable_automated_log_retention ? 1 : 0

  name = "huntaze-log-retention-manager-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "huntaze-log-retention-manager-role"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# IAM policy for Lambda
resource "aws_iam_role_policy" "log_retention_manager" {
  count = var.enable_automated_log_retention ? 1 : 0

  name = "huntaze-log-retention-manager-policy"
  role = aws_iam_role.log_retention_manager[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:PutRetentionPolicy",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/lambda/huntaze-log-retention-manager:*"
      }
    ]
  })
}

# EventBridge rule to trigger Lambda on new log group creation
resource "aws_cloudwatch_event_rule" "log_group_created" {
  count = var.enable_automated_log_retention ? 1 : 0

  name        = "huntaze-log-group-created"
  description = "Trigger Lambda when new CloudWatch Log Group is created"

  event_pattern = jsonencode({
    source      = ["aws.logs"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = ["CreateLogGroup"]
    }
  })

  tags = {
    Name        = "huntaze-log-group-created-rule"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# EventBridge target
resource "aws_cloudwatch_event_target" "log_retention_manager" {
  count = var.enable_automated_log_retention ? 1 : 0

  rule      = aws_cloudwatch_event_rule.log_group_created[0].name
  target_id = "LogRetentionManager"
  arn       = aws_lambda_function.log_retention_manager[0].arn
}

# Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  count = var.enable_automated_log_retention ? 1 : 0

  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.log_retention_manager[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.log_group_created[0].arn
}
