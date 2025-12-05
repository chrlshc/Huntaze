# ============================================
# EventBridge Rules for Offers Cron Jobs
# ============================================
# 
# These rules trigger the offers management crons:
# - expireOffers: Marks expired offers hourly
# - activateScheduledOffers: Activates scheduled offers hourly
#
# Deploy: terraform apply -target=module.offers_cron

variable "app_url" {
  description = "Base URL of the Huntaze application"
  type        = string
  default     = "https://huntaze.com"
}

variable "cron_secret" {
  description = "Secret for authenticating cron requests"
  type        = string
  sensitive   = true
}

# ============================================
# IAM Role for EventBridge to invoke API Gateway
# ============================================

resource "aws_iam_role" "eventbridge_cron_role" {
  name = "huntaze-eventbridge-cron-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project     = "huntaze"
    Environment = "production"
    Component   = "cron"
  }
}

# ============================================
# EventBridge Connection for API calls
# ============================================

resource "aws_cloudwatch_event_connection" "huntaze_api" {
  name               = "huntaze-api-connection"
  description        = "Connection to Huntaze API for cron jobs"
  authorization_type = "API_KEY"

  auth_parameters {
    api_key {
      key   = "Authorization"
      value = "Bearer ${var.cron_secret}"
    }
  }
}

# ============================================
# EventBridge API Destination
# ============================================

resource "aws_cloudwatch_event_api_destination" "offers_expire" {
  name                             = "huntaze-offers-expire"
  description                      = "Expire offers cron endpoint"
  invocation_endpoint              = "${var.app_url}/api/cron/offers/expire"
  http_method                      = "POST"
  invocation_rate_limit_per_second = 1
  connection_arn                   = aws_cloudwatch_event_connection.huntaze_api.arn
}

resource "aws_cloudwatch_event_api_destination" "offers_activate" {
  name                             = "huntaze-offers-activate"
  description                      = "Activate scheduled offers cron endpoint"
  invocation_endpoint              = "${var.app_url}/api/cron/offers/activate"
  http_method                      = "POST"
  invocation_rate_limit_per_second = 1
  connection_arn                   = aws_cloudwatch_event_connection.huntaze_api.arn
}

# ============================================
# EventBridge Rules - Hourly Schedule
# ============================================

resource "aws_cloudwatch_event_rule" "expire_offers" {
  name                = "huntaze-expire-offers"
  description         = "Expire offers past their validUntil date - runs hourly"
  schedule_expression = "rate(1 hour)"
  state               = "ENABLED"

  tags = {
    Project     = "huntaze"
    Environment = "production"
    Component   = "offers"
    Type        = "cron"
  }
}

resource "aws_cloudwatch_event_rule" "activate_offers" {
  name                = "huntaze-activate-offers"
  description         = "Activate scheduled offers - runs hourly"
  schedule_expression = "rate(1 hour)"
  state               = "ENABLED"

  tags = {
    Project     = "huntaze"
    Environment = "production"
    Component   = "offers"
    Type        = "cron"
  }
}

# ============================================
# EventBridge Targets
# ============================================

resource "aws_cloudwatch_event_target" "expire_offers_target" {
  rule      = aws_cloudwatch_event_rule.expire_offers.name
  target_id = "expire-offers-api"
  arn       = aws_cloudwatch_event_api_destination.offers_expire.arn
  role_arn  = aws_iam_role.eventbridge_cron_role.arn

  http_target {
    header_parameters = {
      "Content-Type" = "application/json"
    }
  }

  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 3
  }

  dead_letter_config {
    arn = aws_sqs_queue.cron_dlq.arn
  }
}

resource "aws_cloudwatch_event_target" "activate_offers_target" {
  rule      = aws_cloudwatch_event_rule.activate_offers.name
  target_id = "activate-offers-api"
  arn       = aws_cloudwatch_event_api_destination.offers_activate.arn
  role_arn  = aws_iam_role.eventbridge_cron_role.arn

  http_target {
    header_parameters = {
      "Content-Type" = "application/json"
    }
  }

  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 3
  }

  dead_letter_config {
    arn = aws_sqs_queue.cron_dlq.arn
  }
}

# ============================================
# Dead Letter Queue for failed cron jobs
# ============================================

resource "aws_sqs_queue" "cron_dlq" {
  name                      = "huntaze-cron-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Project     = "huntaze"
    Environment = "production"
    Component   = "cron"
  }
}

# ============================================
# CloudWatch Alarms for monitoring
# ============================================

resource "aws_cloudwatch_metric_alarm" "cron_failures" {
  alarm_name          = "huntaze-cron-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when cron jobs are failing"

  dimensions = {
    QueueName = aws_sqs_queue.cron_dlq.name
  }

  tags = {
    Project     = "huntaze"
    Environment = "production"
  }
}

# ============================================
# Outputs
# ============================================

output "expire_offers_rule_arn" {
  description = "ARN of the expire offers EventBridge rule"
  value       = aws_cloudwatch_event_rule.expire_offers.arn
}

output "activate_offers_rule_arn" {
  description = "ARN of the activate offers EventBridge rule"
  value       = aws_cloudwatch_event_rule.activate_offers.arn
}

output "cron_dlq_url" {
  description = "URL of the cron dead letter queue"
  value       = aws_sqs_queue.cron_dlq.url
}
