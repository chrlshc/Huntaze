# ============================================================================
# AWS Production Hardening - Main Infrastructure
# ============================================================================
# Account: 317805897534
# Region: us-east-1
# Purpose: Create missing resources for hybrid orchestrator and cost monitoring
# ============================================================================

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# ============================================================================
# SQS QUEUES - Hybrid Workflows (FIFO)
# ============================================================================

# DLQ for hybrid workflows
resource "aws_sqs_queue" "hybrid_workflows_dlq" {
  name                      = "huntaze-hybrid-workflows-dlq.fifo"
  fifo_queue                = true
  content_based_deduplication = true
  message_retention_seconds = 1209600  # 14 days
  
  tags = {
    Name        = "huntaze-hybrid-workflows-dlq"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "DLQ for hybrid orchestrator workflows"
  }
}

# Main hybrid workflows queue (FIFO with high-throughput)
resource "aws_sqs_queue" "hybrid_workflows" {
  name                       = "huntaze-hybrid-workflows.fifo"
  fifo_queue                 = true
  content_based_deduplication = true
  visibility_timeout_seconds = 120
  receive_wait_time_seconds  = 20  # Long polling
  message_retention_seconds  = 345600  # 4 days
  
  # High-throughput FIFO (per message group ID)
  fifo_throughput_limit = "perMessageGroupId"
  deduplication_scope   = "messageGroup"
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.hybrid_workflows_dlq.arn
    maxReceiveCount     = 5
  })
  
  tags = {
    Name        = "huntaze-hybrid-workflows"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Multi-agent workflow orchestration"
  }
}

# ============================================================================
# SQS QUEUES - Rate Limiter (Standard)
# ============================================================================

# DLQ for rate limiter
resource "aws_sqs_queue" "rate_limiter_dlq" {
  name                      = "huntaze-rate-limiter-queue-dlq"
  message_retention_seconds = 1209600  # 14 days
  
  tags = {
    Name        = "huntaze-rate-limiter-dlq"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "DLQ for OnlyFans rate limiter"
  }
}

# Main rate limiter queue (Standard with long polling)
resource "aws_sqs_queue" "rate_limiter" {
  name                       = "huntaze-rate-limiter-queue"
  visibility_timeout_seconds = 90
  receive_wait_time_seconds  = 20  # Long polling
  message_retention_seconds  = 345600  # 4 days
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.rate_limiter_dlq.arn
    maxReceiveCount     = 5
  })
  
  tags = {
    Name        = "huntaze-rate-limiter"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "OnlyFans 10 msg/min rate limiting"
  }
}

# ============================================================================
# DYNAMODB TABLES - Cost Tracking
# ============================================================================

# AI costs tracking table
resource "aws_dynamodb_table" "ai_costs" {
  name         = "huntaze-ai-costs-production"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"
  
  attribute {
    name = "pk"
    type = "S"
  }
  
  attribute {
    name = "sk"
    type = "S"
  }
  
  ttl {
    enabled        = true
    attribute_name = "ttl"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name        = "huntaze-ai-costs-production"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "AI cost tracking by provider/agent/date"
  }
}

# Cost alerts history table
resource "aws_dynamodb_table" "cost_alerts" {
  name         = "huntaze-cost-alerts-production"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"
  
  attribute {
    name = "pk"
    type = "S"
  }
  
  attribute {
    name = "sk"
    type = "S"
  }
  
  ttl {
    enabled        = true
    attribute_name = "ttl"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name        = "huntaze-cost-alerts-production"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Cost alert history and webhooks"
  }
}

# ============================================================================
# SNS TOPIC - Cost Alerts
# ============================================================================

# SNS topic for cost alerts
resource "aws_sns_topic" "cost_alerts" {
  name = "huntaze-cost-alerts"
  
  tags = {
    Name        = "huntaze-cost-alerts"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Budget and cost anomaly alerts"
  }
}

# SNS topic policy allowing AWS Budgets to publish
resource "aws_sns_topic_policy" "cost_alerts_policy" {
  arn = aws_sns_topic.cost_alerts.arn
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowBudgetsToPublish"
        Effect = "Allow"
        Principal = {
          Service = "budgets.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.cost_alerts.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# ============================================================================
# AWS BUDGETS - Monthly Cost Budget
# ============================================================================

# Monthly budget with forecasted and actual alerts
resource "aws_budgets_budget" "monthly" {
  name         = "huntaze-monthly"
  budget_type  = "COST"
  time_unit    = "MONTHLY"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  
  # Forecasted alert at 80%
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "FORECASTED"
    subscriber_sns_topic_arns = [aws_sns_topic.cost_alerts.arn]
  }
  
  # Actual alert at 100%
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.cost_alerts.arn]
  }
  
  depends_on = [aws_sns_topic_policy.cost_alerts_policy]
}

# ============================================================================
# Variables - RDS Performance Insights
# ============================================================================

variable "rds_instance_identifier" {
  description = "RDS instance identifier"
  type        = string
  default     = "huntaze-postgres-production"
}

variable "performance_insights_log_retention_days" {
  description = "Performance Insights log retention in days"
  type        = number
  default     = 7
}

variable "rds_db_load_threshold" {
  description = "DB Load threshold (average active sessions)"
  type        = number
  default     = 0.8  # 80% of vCPU
}

variable "rds_lock_wait_threshold" {
  description = "Lock wait threshold in milliseconds"
  type        = number
  default     = 100
}

variable "rds_read_latency_threshold" {
  description = "Read latency threshold in milliseconds"
  type        = number
  default     = 100
}

variable "rds_write_latency_threshold" {
  description = "Write latency threshold in milliseconds"
  type        = number
  default     = 100
}

# ============================================================================
# Variables - ECS Auto Scaling
# ============================================================================

variable "ecs_cluster_ai_team" {
  description = "AI Team ECS cluster name"
  type        = string
  default     = "ai-team"
}

variable "ecs_cluster_huntaze" {
  description = "Huntaze ECS cluster name"
  type        = string
  default     = "huntaze-cluster"
}

variable "ecs_cluster_huntaze_of" {
  description = "Huntaze OnlyFans ECS cluster name"
  type        = string
  default     = "huntaze-of-fargate"
}

variable "ecs_services_ai_team" {
  description = "List of ECS services in AI Team cluster"
  type        = list(string)
  default     = []  # To be populated with actual service names
}

variable "ecs_services_huntaze" {
  description = "List of ECS services in Huntaze cluster"
  type        = list(string)
  default     = []  # To be populated with actual service names
}

variable "ecs_services_huntaze_of" {
  description = "List of ECS services in Huntaze OF cluster"
  type        = list(string)
  default     = []  # To be populated with actual service names
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "ecs_cpu_target_value" {
  description = "Target CPU utilization percentage for auto-scaling"
  type        = number
  default     = 70
}

variable "ecs_memory_target_value" {
  description = "Target memory utilization percentage for auto-scaling"
  type        = number
  default     = 80
}

variable "ecs_scale_in_cooldown" {
  description = "Scale-in cooldown period in seconds"
  type        = number
  default     = 300  # 5 minutes
}

variable "ecs_scale_out_cooldown" {
  description = "Scale-out cooldown period in seconds"
  type        = number
  default     = 60  # 1 minute
}

# ============================================================================
# Variables - Cost Optimization
# ============================================================================

variable "vpc_id" {
  description = "VPC ID for VPC endpoints"
  type        = string
  default     = ""  # To be populated with actual VPC ID
}

variable "private_route_table_ids" {
  description = "List of private route table IDs for VPC endpoints"
  type        = list(string)
  default     = []  # To be populated with actual route table IDs
}

variable "s3_buckets_for_tiering" {
  description = "List of S3 buckets to enable Intelligent-Tiering"
  type        = list(string)
  default = [
    "huntaze-of-traces-317805897534-us-east-1",
    "huntaze-playwright-artifacts-317805897534-us-east-1",
    "huntaze-synthetics-artifacts-317805897534"
  ]
}
