# ============================================================================
# OnlyFans Rate Limiter - CloudWatch Alarms
# ============================================================================
# Alarms for monitoring rate limiter health and performance
# ============================================================================

# High Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "rate_limiter_high_error_rate" {
  alarm_name          = "onlyfans-rate-limiter-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  threshold           = "5" # 5% error rate
  alarm_description   = "OnlyFans rate limiter has high error rate (>5%)"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(failed / queued) * 100"
    label       = "Error Rate (%)"
    return_data = true
  }

  metric_query {
    id = "failed"
    metric {
      namespace   = "Huntaze/OnlyFans"
      metric_name = "MessagesFailed"
      period      = 300
      stat        = "Sum"
      dimensions = {
        Environment = "production"
      }
    }
  }

  metric_query {
    id = "queued"
    metric {
      namespace   = "Huntaze/OnlyFans"
      metric_name = "MessagesQueued"
      period      = 300
      stat        = "Sum"
      dimensions = {
        Environment = "production"
      }
    }
  }

  tags = {
    Name        = "onlyfans-rate-limiter-high-error-rate"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Queue Depth High Alarm
resource "aws_cloudwatch_metric_alarm" "rate_limiter_queue_depth_high" {
  alarm_name          = "onlyfans-rate-limiter-queue-depth-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "100"
  alarm_description   = "OnlyFans rate limiter queue has >100 messages"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    QueueName = "huntaze-rate-limiter-queue"
  }

  tags = {
    Name        = "onlyfans-rate-limiter-queue-depth-high"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Queue Age High Alarm
resource "aws_cloudwatch_metric_alarm" "rate_limiter_queue_age_high" {
  alarm_name          = "onlyfans-rate-limiter-queue-age-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "600" # 10 minutes
  alarm_description   = "OnlyFans rate limiter queue has messages older than 10 minutes"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    QueueName = "huntaze-rate-limiter-queue"
  }

  tags = {
    Name        = "onlyfans-rate-limiter-queue-age-high"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Lambda Errors Alarm (already exists in rate-limiter-lambda.tf)
# Referencing it here for completeness

# High Latency Alarm
resource "aws_cloudwatch_metric_alarm" "rate_limiter_high_latency" {
  alarm_name          = "onlyfans-rate-limiter-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "QueueLatency"
  namespace           = "Huntaze/OnlyFans"
  period              = "300"
  statistic           = "Average"
  threshold           = "5000" # 5 seconds
  alarm_description   = "OnlyFans rate limiter has high queue latency (>5s)"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    Environment = "production"
  }

  tags = {
    Name        = "onlyfans-rate-limiter-high-latency"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Rate Limited Messages Alarm (informational)
resource "aws_cloudwatch_metric_alarm" "rate_limiter_rate_limited_messages" {
  alarm_name          = "onlyfans-rate-limiter-rate-limited-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RateLimitedMessages"
  namespace           = "Huntaze/OnlyFans"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50" # More than 50 rate limited messages in 5 minutes
  alarm_description   = "OnlyFans rate limiter is rate limiting many messages"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    Environment = "production"
  }

  tags = {
    Name        = "onlyfans-rate-limiter-rate-limited-messages"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "info"
  }
}
