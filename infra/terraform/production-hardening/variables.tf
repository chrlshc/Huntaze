# ============================================================================
# Variables - AWS Production Hardening
# ============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = string
  default     = "500"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "huntaze"
    ManagedBy   = "terraform"
    Environment = "production"
  }
}

# Security Services variables
variable "security_alert_email" {
  description = "Email address for security alerts (GuardDuty, Security Hub)"
  type        = string
  default     = "security@huntaze.com"
}

variable "enable_guardduty_s3_protection" {
  description = "Enable GuardDuty S3 protection"
  type        = bool
  default     = true
}

variable "enable_guardduty_eks_protection" {
  description = "Enable GuardDuty EKS protection"
  type        = bool
  default     = false
}

variable "cloudtrail_log_retention_days" {
  description = "CloudWatch Logs retention for CloudTrail (days)"
  type        = number
  default     = 90
}

# S3 Security variables
variable "s3_buckets_to_secure" {
  description = "List of S3 bucket names to apply security hardening"
  type        = list(string)
  default     = []
}

# RDS Security variables

variable "rds_parameter_group_family" {
  description = "RDS parameter group family (e.g., postgres16, postgres15)"
  type        = string
  default     = "postgres16"
}

variable "allowed_security_groups" {
  description = "Security groups allowed to access RDS"
  type        = list(string)
  default     = []
}

variable "rotation_lambda_arn" {
  description = "ARN of Lambda function for Secrets Manager rotation"
  type        = string
  default     = ""
}

# Container Insights & Logs variables
variable "ecs_app_log_retention_days" {
  description = "CloudWatch Logs retention for ECS application logs (days)"
  type        = number
  default     = 30
}

variable "ecs_batch_log_retention_days" {
  description = "CloudWatch Logs retention for ECS batch job logs (days)"
  type        = number
  default     = 14
}

variable "lambda_log_retention_days" {
  description = "CloudWatch Logs retention for Lambda logs (days)"
  type        = number
  default     = 30
}

variable "enable_automated_log_retention" {
  description = "Enable automated log retention management via Lambda"
  type        = bool
  default     = false
}

# CloudWatch Alarms variables
variable "ops_alert_email" {
  description = "Email address for operational alerts"
  type        = string
  default     = "ops@huntaze.com"
}

variable "alarm_evaluation_periods" {
  description = "Number of evaluation periods for alarms"
  type        = number
  default     = 2
}

variable "alarm_period_seconds" {
  description = "Period in seconds for alarm evaluation"
  type        = number
  default     = 300
}

# Rate Limiter Lambda variables
variable "rate_limiter_reserved_concurrency" {
  description = "Reserved concurrent executions for rate limiter Lambda"
  type        = number
  default     = 1
}

variable "rate_limiter_tokens_per_window" {
  description = "Number of tokens per time window (messages per minute)"
  type        = string
  default     = "10"
}

variable "rate_limiter_window_seconds" {
  description = "Time window in seconds"
  type        = string
  default     = "60"
}

variable "rate_limiter_bucket_capacity" {
  description = "Maximum burst capacity (tokens)"
  type        = string
  default     = "10"
}

variable "rate_limiter_batch_size" {
  description = "SQS batch size for Lambda"
  type        = number
  default     = 5
}

variable "rate_limiter_maximum_concurrency" {
  description = "Maximum concurrent Lambda executions"
  type        = number
  default     = 2
}

variable "redis_encrypted_endpoint" {
  description = "Redis encrypted cluster endpoint"
  type        = string
  default     = ""
}
