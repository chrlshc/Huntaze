terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" { region = var.aws_region }

# Caller identity (for account-scoped ARNs)
data "aws_caller_identity" "current" {}

# --- Secrets (DATABASE_URL) ---
data "aws_secretsmanager_secret" "database_url" {
  name = "ai-team/database-url"
}

# --- Secrets (Azure OpenAI)
data "aws_secretsmanager_secret" "azure_openai" {
  name = "ai-team/azure-openai"
}

# --- IAM inline policy for ECS task execution role to read Secrets Manager (env injection) ---
data "aws_iam_policy_document" "ecs_exec_secrets" {
  statement {
    sid     = "ReadSecretsForEnvInjection"
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      "arn:aws:secretsmanager:us-east-1:${data.aws_caller_identity.current.account_id}:secret:ai-team/azure-openai-*",
      "arn:aws:secretsmanager:us-east-1:${data.aws_caller_identity.current.account_id}:secret:ai-team/database-url-*",
    ]
  }
  # Optional KMS (uncomment and set your CMK ARN if secrets use a customer-managed key)
  # statement {
  #   sid       = "DecryptSecretsKms"
  #   actions   = ["kms:Decrypt"]
  #   resources = [var.secrets_kms_key_arn]
  # }
}

resource "aws_iam_role_policy" "ecs_exec_secrets" {
  name   = "ecs-exec-secrets-ai-team"
  role   = aws_iam_role.task_execution.name
  policy = data.aws_iam_policy_document.ecs_exec_secrets.json
}

# --- DLQ for EventBridge (SQS) ---
resource "aws_sqs_queue" "eb_dlq" {
  name                      = "ai-team-eventbridge-dlq"
  message_retention_seconds = 1209600 # 14 days
}

# --- ECS Cluster ---
resource "aws_ecs_cluster" "ai" { name = "ai-team" }

# --- IAM Roles ---
data "aws_iam_policy_document" "events_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com", "scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "events_to_ecs" {
  name               = "events-to-ecs-role-use1"
  assume_role_policy = data.aws_iam_policy_document.events_assume.json
}

resource "aws_iam_role" "task_execution" {
  name = "ecsTaskExecutionRole-ai-summarizer-use1"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy_attachment" "exec_logs" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "task_role" {
  name               = "ecsTaskRole-ai-summarizer-use1"
  assume_role_policy = aws_iam_role.task_execution.assume_role_policy
}

resource "aws_iam_role_policy" "events_to_ecs_policy" {
  role = aws_iam_role.events_to_ecs.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { Effect = "Allow", Action = ["ecs:RunTask"], Resource = [aws_ecs_task_definition.summarizer.arn] },
      { Effect = "Allow", Action = ["iam:PassRole"], Resource = [aws_iam_role.task_execution.arn, aws_iam_role.task_role.arn] }
    ]
  })
}

# --- Logs ---
resource "aws_cloudwatch_log_group" "summarizer" {
  name              = "/ecs/ai-summarizer"
  retention_in_days = 14
}

# --- Task Definition (Fargate) ---
resource "aws_ecs_task_definition" "summarizer" {
  family                   = "ai-summarizer"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name      = "summarizer"
      image     = var.summarizer_image
      command   = ["node","dist/run-summarizer.js"]
      environment = [
        { name = "LLM_PROVIDER", value = "azure" }
      ]
      secrets = [
        { name = "DATABASE_URL", valueFrom = data.aws_secretsmanager_secret.database_url.arn },
        { name = "AZURE_OPENAI_ENDPOINT", valueFrom = "${data.aws_secretsmanager_secret.azure_openai.arn}:AZURE_OPENAI_ENDPOINT::" },
        { name = "AZURE_OPENAI_DEPLOYMENT", valueFrom = "${data.aws_secretsmanager_secret.azure_openai.arn}:AZURE_OPENAI_DEPLOYMENT::" },
        { name = "AZURE_OPENAI_API_KEY", valueFrom = "${data.aws_secretsmanager_secret.azure_openai.arn}:AZURE_OPENAI_API_KEY::" },
        { name = "AZURE_OPENAI_API_VERSION", valueFrom = "${data.aws_secretsmanager_secret.azure_openai.arn}:AZURE_OPENAI_API_VERSION::" }
      ]
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = aws_cloudwatch_log_group.summarizer.name,
          awslogs-region        = var.aws_region,
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# --- EventBridge Rule: on AI events, run summarizer ---
resource "aws_cloudwatch_event_rule" "ai_insights_ready" {
  name          = "ai-insights-ready"
  description   = "Run summarizer on AI_INSIGHTS_READY or CONTENT_READY"
  event_pattern = <<EOF
{
  "source": ["app.ai-team"],
  "detail-type": ["AI_INSIGHTS_READY","CONTENT_READY"]
}
EOF
}

resource "aws_cloudwatch_event_target" "summarizer_target" {
  rule      = aws_cloudwatch_event_rule.ai_insights_ready.name
  target_id = "ecs-run-summarizer"
  arn       = aws_ecs_cluster.ai.arn
  role_arn  = aws_iam_role.events_to_ecs.arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.summarizer.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets         = var.private_subnets
      security_groups = [var.sg_id]
      assign_public_ip = true
    }
    platform_version = "LATEST"
  }

  dead_letter_config { arn = aws_sqs_queue.eb_dlq.arn }
  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 3
  }
}

# --- EventBridge Scheduler (cron) ---
resource "aws_scheduler_schedule" "summarizer_cron" {
  name                         = "ai-summarizer-every-15min"
  schedule_expression          = "cron(0/15 * * * ? *)"
  schedule_expression_timezone = "Europe/Paris"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_ecs_cluster.ai.arn
    role_arn = aws_iam_role.events_to_ecs.arn

    ecs_parameters {
      task_definition_arn = aws_ecs_task_definition.summarizer.arn
      launch_type          = "FARGATE"
      network_configuration {
        subnets          = var.private_subnets
        security_groups  = [var.sg_id]
        assign_public_ip = true
      }
      platform_version = "LATEST"
    }

    dead_letter_config {
      arn = aws_sqs_queue.eb_dlq.arn
    }
    retry_policy {
      maximum_event_age_in_seconds = 3600
      maximum_retry_attempts       = 3
    }
  }
}
