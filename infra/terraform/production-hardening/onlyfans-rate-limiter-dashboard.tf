# ============================================================================
# OnlyFans Rate Limiter - CloudWatch Dashboard
# ============================================================================
# Comprehensive dashboard for monitoring rate limiter performance
# ============================================================================

resource "aws_cloudwatch_dashboard" "onlyfans_rate_limiter" {
  dashboard_name = "Huntaze-OnlyFans-Rate-Limiter"

  dashboard_body = jsonencode({
    widgets = [
      # Row 1: Overview Metrics
      {
        type = "metric"
        x    = 0
        y    = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["Huntaze/OnlyFans", "MessagesQueued", { stat = "Sum", label = "Queued", color = "#1f77b4" }],
            [".", "MessagesSent", { stat = "Sum", label = "Sent", color = "#2ca02c" }],
            [".", "MessagesFailed", { stat = "Sum", label = "Failed", color = "#d62728" }],
            [".", "RateLimitedMessages", { stat = "Sum", label = "Rate Limited", color = "#ff7f0e" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Messages Overview"
          period  = 300
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      },
      {
        type = "metric"
        x    = 12
        y    = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["Huntaze/OnlyFans", "QueueLatency", { stat = "Average", label = "Avg Latency" }],
            ["...", { stat = "Maximum", label = "Max Latency" }],
            ["...", { stat = "p99", label = "P99 Latency" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Queue Latency"
          period  = 300
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },

      # Row 2: SQS Queue Metrics
      {
        type = "metric"
        x    = 0
        y    = 6
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", { stat = "Average" }, { QueueName = "huntaze-rate-limiter-queue" }],
            [".", "ApproximateNumberOfMessagesNotVisible", { stat = "Average" }, { QueueName = "huntaze-rate-limiter-queue" }]
          ]
          view    = "timeSeries"
          stacked = true
          region  = var.aws_region
          title   = "SQS Queue Depth"
          period  = 300
          yAxis = {
            left = {
              label = "Messages"
            }
          }
        }
      },
      {
        type = "metric"
        x    = 8
        y    = 6
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", { stat = "Maximum" }, { QueueName = "huntaze-rate-limiter-queue" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Oldest Message Age"
          period  = 300
          yAxis = {
            left = {
              label = "Seconds"
            }
          }
        }
      },
      {
        type = "metric"
        x    = 16
        y    = 6
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", { stat = "Sum" }, { QueueName = "huntaze-rate-limiter-queue" }],
            [".", "NumberOfMessagesReceived", { stat = "Sum" }, { QueueName = "huntaze-rate-limiter-queue" }],
            [".", "NumberOfMessagesDeleted", { stat = "Sum" }, { QueueName = "huntaze-rate-limiter-queue" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "SQS Operations"
          period  = 300
        }
      },

      # Row 3: Lambda Metrics
      {
        type = "metric"
        x    = 0
        y    = 12
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum" }, { FunctionName = "huntaze-rate-limiter" }],
            [".", "Errors", { stat = "Sum" }, { FunctionName = "huntaze-rate-limiter" }],
            [".", "Throttles", { stat = "Sum" }, { FunctionName = "huntaze-rate-limiter" }]
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
        x    = 8
        y    = 12
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average" }, { FunctionName = "huntaze-rate-limiter" }],
            ["...", { stat = "Maximum" }],
            ["...", { stat = "p99" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Duration"
          period  = 300
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type = "metric"
        x    = 16
        y    = 12
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "ConcurrentExecutions", { stat = "Maximum" }, { FunctionName = "huntaze-rate-limiter" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Concurrency"
          period  = 300
        }
      },

      # Row 4: Error Rate & Success Rate
      {
        type = "metric"
        x    = 0
        y    = 18
        width  = 12
        height = 6
        properties = {
          metrics = [
            [{ expression = "(failed / queued) * 100", label = "Error Rate (%)", id = "error_rate" }],
            ["Huntaze/OnlyFans", "MessagesFailed", { id = "failed", visible = false }],
            [".", "MessagesQueued", { id = "queued", visible = false }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Error Rate"
          period  = 300
          yAxis = {
            left = {
              label = "Percentage"
              min   = 0
              max   = 100
            }
          }
        }
      },
      {
        type = "metric"
        x    = 12
        y    = 18
        width  = 12
        height = 6
        properties = {
          metrics = [
            [{ expression = "(sent / queued) * 100", label = "Success Rate (%)", id = "success_rate" }],
            ["Huntaze/OnlyFans", "MessagesSent", { id = "sent", visible = false }],
            [".", "MessagesQueued", { id = "queued", visible = false }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Success Rate"
          period  = 300
          yAxis = {
            left = {
              label = "Percentage"
              min   = 0
              max   = 100
            }
          }
        }
      },

      # Row 5: Priority Breakdown
      {
        type = "metric"
        x    = 0
        y    = 24
        width  = 24
        height = 6
        properties = {
          metrics = [
            ["Huntaze/OnlyFans", "MessagesQueued", { stat = "Sum" }, { priority = "high" }],
            ["...", { priority = "medium" }],
            ["...", { priority = "low" }]
          ]
          view    = "timeSeries"
          stacked = true
          region  = var.aws_region
          title   = "Messages by Priority"
          period  = 300
        }
      },

      # Row 6: Recent Logs
      {
        type = "log"
        x    = 0
        y    = 30
        width  = 24
        height = 6
        properties = {
          query   = <<-EOT
            SOURCE '/aws/lambda/huntaze-rate-limiter'
            | fields @timestamp, @message
            | filter @message like /Token bucket result/ or @message like /Message.*sent/
            | sort @timestamp desc
            | limit 50
          EOT
          region  = var.aws_region
          title   = "Recent Rate Limiter Activity"
        }
      }
    ]
  })
}
