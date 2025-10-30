# ============================================================================
# Outputs - AWS Production Hardening
# ============================================================================

# SQS Queue URLs
output "sqs_hybrid_workflows_url" {
  description = "URL of the hybrid workflows FIFO queue"
  value       = aws_sqs_queue.hybrid_workflows.url
}

output "sqs_hybrid_workflows_arn" {
  description = "ARN of the hybrid workflows FIFO queue"
  value       = aws_sqs_queue.hybrid_workflows.arn
}

output "sqs_rate_limiter_url" {
  description = "URL of the rate limiter queue"
  value       = aws_sqs_queue.rate_limiter.url
}

output "sqs_rate_limiter_arn" {
  description = "ARN of the rate limiter queue"
  value       = aws_sqs_queue.rate_limiter.arn
}

# DynamoDB Table Names
output "dynamodb_ai_costs_table_name" {
  description = "Name of the AI costs tracking table"
  value       = aws_dynamodb_table.ai_costs.name
}

output "dynamodb_ai_costs_table_arn" {
  description = "ARN of the AI costs tracking table"
  value       = aws_dynamodb_table.ai_costs.arn
}

output "dynamodb_cost_alerts_table_name" {
  description = "Name of the cost alerts table"
  value       = aws_dynamodb_table.cost_alerts.name
}

output "dynamodb_cost_alerts_table_arn" {
  description = "ARN of the cost alerts table"
  value       = aws_dynamodb_table.cost_alerts.arn
}

# SNS Topic
output "sns_cost_alerts_arn" {
  description = "ARN of the cost alerts SNS topic"
  value       = aws_sns_topic.cost_alerts.arn
}

output "sns_cost_alerts_name" {
  description = "Name of the cost alerts SNS topic"
  value       = aws_sns_topic.cost_alerts.name
}

# Budget
output "budget_name" {
  description = "Name of the monthly budget"
  value       = aws_budgets_budget.monthly.name
}

# Summary
output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    sqs_queues = {
      hybrid_workflows = aws_sqs_queue.hybrid_workflows.name
      rate_limiter     = aws_sqs_queue.rate_limiter.name
    }
    dynamodb_tables = {
      ai_costs     = aws_dynamodb_table.ai_costs.name
      cost_alerts  = aws_dynamodb_table.cost_alerts.name
    }
    sns_topics = {
      cost_alerts = aws_sns_topic.cost_alerts.name
    }
    budgets = {
      monthly = aws_budgets_budget.monthly.name
    }
  }
}

# Security Services Outputs
output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = aws_guardduty_detector.main.id
}

output "guardduty_findings_sns_topic_arn" {
  description = "SNS topic ARN for GuardDuty findings"
  value       = aws_sns_topic.guardduty_findings.arn
}

output "securityhub_account_id" {
  description = "Security Hub account ID"
  value       = aws_securityhub_account.main.id
}

output "securityhub_findings_sns_topic_arn" {
  description = "SNS topic ARN for Security Hub findings"
  value       = aws_sns_topic.securityhub_findings.arn
}

output "cloudtrail_name" {
  description = "CloudTrail trail name"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "CloudTrail trail ARN"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_s3_bucket" {
  description = "S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "cloudtrail_kms_key_id" {
  description = "KMS key ID for CloudTrail encryption"
  value       = aws_kms_key.cloudtrail_encryption.key_id
}

# S3 Security Outputs
output "s3_encryption_kms_key_id" {
  description = "KMS key ID for S3 encryption"
  value       = aws_kms_key.s3_encryption.key_id
}

output "s3_encryption_kms_key_arn" {
  description = "KMS key ARN for S3 encryption"
  value       = aws_kms_key.s3_encryption.arn
}

output "s3_vpc_endpoint_id" {
  description = "S3 VPC endpoint ID"
  value       = aws_vpc_endpoint.s3.id
}

output "s3_account_public_access_block_enabled" {
  description = "Whether S3 account-level public access block is enabled"
  value       = aws_s3_account_public_access_block.account_level.id
}

# RDS Security Outputs
output "rds_encryption_kms_key_id" {
  description = "KMS key ID for RDS encryption"
  value       = aws_kms_key.rds_encryption.key_id
}

output "rds_encryption_kms_key_arn" {
  description = "KMS key ARN for RDS encryption"
  value       = aws_kms_key.rds_encryption.arn
}

output "rds_parameter_group_name" {
  description = "RDS parameter group name with TLS enforced"
  value       = aws_db_parameter_group.postgres_tls.name
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds_postgres.id
}

output "rds_credentials_secret_arn" {
  description = "ARN of RDS credentials secret in Secrets Manager"
  value       = aws_secretsmanager_secret.rds_credentials.arn
  sensitive   = true
}

# Container Insights & Logs Outputs
output "container_insights_enabled_clusters" {
  description = "List of clusters with Container Insights enabled"
  value = [
    "ai-team",
    "huntaze-cluster",
    "huntaze-of-fargate"
  ]
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name for Container Insights"
  value       = aws_cloudwatch_dashboard.ecs_container_insights.dashboard_name
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.ecs_container_insights.dashboard_name}"
}

output "log_groups_created" {
  description = "List of CloudWatch Log Groups created with retention"
  value = [
    aws_cloudwatch_log_group.ecs_huntaze_api.name,
    aws_cloudwatch_log_group.ecs_huntaze_onlyfans_scraper.name,
    aws_cloudwatch_log_group.ecs_huntaze_playwright.name,
    aws_cloudwatch_log_group.ecs_ai_team_orchestrator.name,
    aws_cloudwatch_log_group.lambda_rate_limiter.name
  ]
}

# CloudWatch Alarms Outputs
output "ops_alerts_sns_topic_arn" {
  description = "SNS topic ARN for operational alerts"
  value       = aws_sns_topic.ops_alerts.arn
}

output "alarms_dashboard_name" {
  description = "CloudWatch dashboard name for alarms overview"
  value       = aws_cloudwatch_dashboard.alarms_overview.dashboard_name
}

output "alarms_dashboard_url" {
  description = "CloudWatch dashboard URL for alarms overview"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.alarms_overview.dashboard_name}"
}

output "critical_alarms" {
  description = "List of critical alarm names"
  value = [
    aws_cloudwatch_metric_alarm.ecs_service_task_count_low_api.alarm_name,
    aws_cloudwatch_metric_alarm.ecs_service_task_count_low_scraper.alarm_name,
    aws_cloudwatch_metric_alarm.sqs_dlq_depth_fifo.alarm_name,
    aws_cloudwatch_metric_alarm.sqs_dlq_depth_standard.alarm_name
  ]
}

output "composite_alarms" {
  description = "List of composite alarm names"
  value = [
    aws_cloudwatch_composite_alarm.ecs_api_service_unhealthy.alarm_name,
    aws_cloudwatch_composite_alarm.rds_database_unhealthy.alarm_name
  ]
}

# Rate Limiter Lambda Outputs
output "rate_limiter_lambda_arn" {
  description = "ARN of the rate limiter Lambda function"
  value       = aws_lambda_function.rate_limiter.arn
}

output "rate_limiter_lambda_name" {
  description = "Name of the rate limiter Lambda function"
  value       = aws_lambda_function.rate_limiter.function_name
}

output "rate_limiter_dashboard_name" {
  description = "CloudWatch dashboard name for rate limiter"
  value       = aws_cloudwatch_dashboard.rate_limiter.dashboard_name
}

output "rate_limiter_dashboard_url" {
  description = "CloudWatch dashboard URL for rate limiter"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.rate_limiter.dashboard_name}"
}

output "rate_limiter_configuration" {
  description = "Rate limiter configuration"
  value = {
    tokens_per_window  = var.rate_limiter_tokens_per_window
    window_seconds     = var.rate_limiter_window_seconds
    bucket_capacity    = var.rate_limiter_bucket_capacity
    batch_size         = var.rate_limiter_batch_size
    max_concurrency    = var.rate_limiter_maximum_concurrency
  }
}
