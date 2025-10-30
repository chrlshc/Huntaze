# ============================================================================
# Rate Limiter Lambda - Token Bucket with Redis
# ============================================================================
# Implements OnlyFans rate limiting (10 msg/min) using token bucket algorithm
# References: AWS Lambda + SQS Best Practices
# ============================================================================

# ============================================================================
# IAM Role for Lambda
# ============================================================================

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "rate_limiter_lambda" {
  name               = "huntaze-rate-limiter-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name        = "huntaze-rate-limiter-lambda-role"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Rate limiter Lambda execution role"
  }
}

# IAM Policy for Lambda
data "aws_iam_policy_document" "rate_limiter_lambda_policy" {
  # CloudWatch Logs
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/lambda/huntaze-rate-limiter:*"]
  }

  # SQS - Read and change visibility
  statement {
    sid    = "AllowSQSOperations"
    effect = "Allow"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ChangeMessageVisibility"
    ]
    resources = [data.aws_sqs_queue.rate_limiter_queue.arn]
  }

  # Secrets Manager - Get Redis AUTH token
  # Commented out - secret doesn't exist yet
  # statement {
  #   sid    = "AllowSecretsManagerRead"
  #   effect = "Allow"
  #   actions = [
  #     "secretsmanager:GetSecretValue"
  #   ]
  #   resources = [data.aws_secretsmanager_secret.redis_auth_token.arn]
  # }

  # VPC - For VPC Lambda (if needed)
  statement {
    sid    = "AllowVPCOperations"
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:AssignPrivateIpAddresses",
      "ec2:UnassignPrivateIpAddresses"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "rate_limiter_lambda" {
  name   = "huntaze-rate-limiter-lambda-policy"
  role   = aws_iam_role.rate_limiter_lambda.id
  policy = data.aws_iam_policy_document.rate_limiter_lambda_policy.json
}

# ============================================================================
# Lambda Function
# ============================================================================

resource "aws_lambda_function" "rate_limiter" {
  function_name = "huntaze-rate-limiter"
  role          = aws_iam_role.rate_limiter_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  filename      = "${path.module}/../../../dist/rate-limiter.zip"
  
  source_code_hash = fileexists("${path.module}/../../../dist/rate-limiter.zip") ? filebase64sha256("${path.module}/../../../dist/rate-limiter.zip") : null

  timeout     = 30
  memory_size = 256

  # Reserved concurrency to prevent runaway costs
  reserved_concurrent_executions = var.rate_limiter_reserved_concurrency

  environment {
    variables = {
      QUEUE_URL                    = data.aws_sqs_queue.rate_limiter_queue.url
      REDIS_HOST                   = var.redis_encrypted_endpoint
      REDIS_PORT                   = "6379"
      # REDIS_AUTH_TOKEN_SECRET_ARN  = data.aws_secretsmanager_secret.redis_auth_token.arn  # Commented - secret doesn't exist
      TOKENS_PER_WINDOW            = var.rate_limiter_tokens_per_window
      WINDOW_SECONDS               = var.rate_limiter_window_seconds
      BUCKET_CAPACITY              = var.rate_limiter_bucket_capacity
      REGION                       = var.aws_region  # Changed from AWS_REGION (reserved)
    }
  }

  # VPC configuration (if Redis is in VPC)
  # Uncomment if needed
  # vpc_config {
  #   subnet_ids         = var.lambda_subnet_ids
  #   security_group_ids = [aws_security_group.rate_limiter_lambda.id]
  # }

  tags = {
    Name        = "huntaze-rate-limiter"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "OnlyFans rate limiting"
  }

  depends_on = [
    aws_iam_role_policy.rate_limiter_lambda,
    aws_cloudwatch_log_group.rate_limiter_lambda
  ]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "rate_limiter_lambda" {
  name              = "/aws/lambda/huntaze-rate-limiter"
  retention_in_days = var.lambda_log_retention_days

  tags = {
    Name        = "huntaze-rate-limiter-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Rate limiter Lambda logs"
  }
}

# ============================================================================
# SQS Event Source Mapping
# ============================================================================

resource "aws_lambda_event_source_mapping" "rate_limiter_sqs" {
  event_source_arn = data.aws_sqs_queue.rate_limiter_queue.arn
  function_name    = aws_lambda_function.rate_limiter.arn

  # Batch configuration
  batch_size                         = var.rate_limiter_batch_size
  maximum_batching_window_in_seconds = 0 # Process immediately

  # Partial Batch Response - only retry failed messages
  function_response_types = ["ReportBatchItemFailures"]

  # Scaling configuration - limit concurrency
  scaling_config {
    maximum_concurrency = var.rate_limiter_maximum_concurrency
  }

  # Error handling
  enabled = true

  depends_on = [
    aws_iam_role_policy.rate_limiter_lambda
  ]
}

# ============================================================================
# CloudWatch Alarms for Lambda
# ============================================================================

# Lambda Errors Alarm
resource "aws_cloudwatch_metric_alarm" "rate_limiter_errors" {
  alarm_name          = "lambda-rate-limiter-errors-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Rate limiter Lambda has high error count"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.rate_limiter.function_name
  }

  tags = {
    Name        = "lambda-rate-limiter-errors-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Lambda Throttles Alarm
resource "aws_cloudwatch_metric_alarm" "rate_limiter_throttles" {
  alarm_name          = "lambda-rate-limiter-throttles-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Rate limiter Lambda is being throttled"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.rate_limiter.function_name
  }

  tags = {
    Name        = "lambda-rate-limiter-throttles-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# Lambda Duration Alarm
resource "aws_cloudwatch_metric_alarm" "rate_limiter_duration" {
  alarm_name          = "lambda-rate-limiter-duration-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "25000" # 25 seconds (timeout is 30s)
  alarm_description   = "Rate limiter Lambda duration approaching timeout"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.rate_limiter.function_name
  }

  tags = {
    Name        = "lambda-rate-limiter-duration-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# ============================================================================
# CloudWatch Dashboard Widget for Rate Limiter
# ============================================================================

resource "aws_cloudwatch_dashboard" "rate_limiter" {
  dashboard_name = "Huntaze-Rate-Limiter"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Invocations" }, { FunctionName = aws_lambda_function.rate_limiter.function_name }],
            [".", "Errors", { stat = "Sum", label = "Errors" }, { FunctionName = aws_lambda_function.rate_limiter.function_name }],
            [".", "Throttles", { stat = "Sum", label = "Throttles" }, { FunctionName = aws_lambda_function.rate_limiter.function_name }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Invocations & Errors"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average", label = "Avg Duration" }, { FunctionName = aws_lambda_function.rate_limiter.function_name }],
            ["...", { stat = "Maximum", label = "Max Duration" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Duration (ms)"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", { stat = "Average" }, { QueueName = data.aws_sqs_queue.rate_limiter_queue.name }],
            [".", "ApproximateAgeOfOldestMessage", { stat = "Maximum" }, { QueueName = data.aws_sqs_queue.rate_limiter_queue.name }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "SQS Queue Metrics"
          period  = 300
        }
      },
      {
        type = "log"
        properties = {
          query   = <<-EOT
            SOURCE '/aws/lambda/huntaze-rate-limiter'
            | fields @timestamp, @message
            | filter @message like /Token bucket result/
            | sort @timestamp desc
            | limit 20
          EOT
          region  = var.aws_region
          title   = "Recent Rate Limit Decisions"
        }
      }
    ]
  })
}
