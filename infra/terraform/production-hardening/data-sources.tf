# ============================================================================
# Data Sources - Existing Infrastructure Resources
# ============================================================================
# References to existing resources that are managed outside this module
# ============================================================================

# Existing SQS Queues
data "aws_sqs_queue" "rate_limiter_queue" {
  name = "huntaze-rate-limiter-queue"
}

data "aws_sqs_queue" "hybrid_workflows_fifo" {
  name = "huntaze-hybrid-workflows.fifo"
}

data "aws_sqs_queue" "hybrid_workflows_dlq_fifo" {
  name = "huntaze-hybrid-workflows-dlq.fifo"
}

# Existing Secrets Manager Secret (if exists)
# Commented out - secret doesn't exist yet
# data "aws_secretsmanager_secret" "redis_auth_token" {
#   name = "huntaze/redis/auth-token"
# }
