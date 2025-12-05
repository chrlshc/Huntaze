# =============================================================================
# ECS Service for AI Router with Auto-Scaling
# =============================================================================
# Terraform configuration for deploying the AI Router to AWS ECS Fargate
#
# Usage:
#   terraform init
#   terraform plan
#   terraform apply
# =============================================================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_id" {
  description = "VPC ID for the ECS service"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
  type        = list(string)
}

# -----------------------------------------------------------------------------
# ECS Cluster
# -----------------------------------------------------------------------------
resource "aws_ecs_cluster" "ai_router" {
  name = "huntaze-ai-router-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Project     = "Huntaze"
    Service     = "AI-Router"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# Security Group for ECS Tasks
# -----------------------------------------------------------------------------
resource "aws_security_group" "ai_router_tasks" {
  name        = "huntaze-ai-router-tasks-${var.environment}"
  description = "Security group for AI Router ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow traffic from ALB"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.ai_router_alb.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "huntaze-ai-router-tasks-${var.environment}"
    Project     = "Huntaze"
    Service     = "AI-Router"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# Security Group for ALB
# -----------------------------------------------------------------------------
resource "aws_security_group" "ai_router_alb" {
  name        = "huntaze-ai-router-alb-${var.environment}"
  description = "Security group for AI Router ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTP (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "huntaze-ai-router-alb-${var.environment}"
    Project     = "Huntaze"
    Service     = "AI-Router"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# Application Load Balancer
# -----------------------------------------------------------------------------
resource "aws_lb" "ai_router" {
  name               = "huntaze-ai-router-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.ai_router_alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.environment == "production"

  tags = {
    Project     = "Huntaze"
    Service     = "AI-Router"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# ALB Target Group
# -----------------------------------------------------------------------------
resource "aws_lb_target_group" "ai_router" {
  name        = "huntaze-ai-router-${var.environment}"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
  }

  tags = {
    Project     = "Huntaze"
    Service     = "AI-Router"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# ALB Listener (HTTP - for initial testing)
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "ai_router_http" {
  load_balancer_arn = aws_lb.ai_router.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ai_router.arn
  }
}

# -----------------------------------------------------------------------------
# ALB Listener (HTTPS) - Optional, enable when certificate is available
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "ai_router_https" {
  count             = var.certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.ai_router.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ai_router.arn
  }
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional, leave empty for HTTP only)"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# ECS Service
# -----------------------------------------------------------------------------
resource "aws_ecs_service" "ai_router" {
  name            = "huntaze-ai-router"
  cluster         = aws_ecs_cluster.ai_router.id
  task_definition = aws_ecs_task_definition.ai_router.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ai_router_tasks.id]
    assign_public_ip = true  # Required for public subnets to access ECR/internet
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.ai_router.arn
    container_name   = "ai-router"
    container_port   = 8000
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = {
    Project     = "Huntaze"
    Service     = "AI-Router"
    Environment = var.environment
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

# -----------------------------------------------------------------------------
# ECS Task Definition
# -----------------------------------------------------------------------------
resource "aws_ecs_task_definition" "ai_router" {
  family                   = "huntaze-ai-router"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "ai-router"
      image     = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/huntaze/ai-router:latest"
      essential = true
      
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "ROUTER_PORT", value = "8000" },
        { name = "ROUTER_HOST", value = "0.0.0.0" },
        { name = "ROUTER_WORKERS", value = "2" },
        { name = "ROUTER_REGION", value = "eastus2" }
      ]

      secrets = [
        {
          name      = "AZURE_AI_CHAT_ENDPOINT"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:huntaze/ai-router/azure-endpoint"
        },
        {
          name      = "AZURE_AI_CHAT_KEY"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:huntaze/ai-router/azure-key"
        },
        {
          name      = "AI_ROUTER_API_KEY"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:huntaze/ai-router/api-key"
        }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 10
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/huntaze-ai-router"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ai-router"
          "awslogs-create-group"  = "true"
        }
      }
    }
  ])

  tags = {
    Project     = "Huntaze"
    Service     = "AI-Router"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# Auto Scaling
# -----------------------------------------------------------------------------
resource "aws_appautoscaling_target" "ai_router" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.ai_router.name}/${aws_ecs_service.ai_router.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Scale based on CPU utilization (target: 70%)
resource "aws_appautoscaling_policy" "ai_router_cpu" {
  name               = "huntaze-ai-router-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ai_router.resource_id
  scalable_dimension = aws_appautoscaling_target.ai_router.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ai_router.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Scale based on request count
resource "aws_appautoscaling_policy" "ai_router_requests" {
  name               = "huntaze-ai-router-request-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ai_router.resource_id
  scalable_dimension = aws_appautoscaling_target.ai_router.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ai_router.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.ai_router.arn_suffix}/${aws_lb_target_group.ai_router.arn_suffix}"
    }
    target_value       = 1000.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# -----------------------------------------------------------------------------
# IAM Roles
# -----------------------------------------------------------------------------
resource "aws_iam_role" "ecs_execution" {
  name = "huntaze-ai-router-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project     = "Huntaze"
    Service     = "AI-Router"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "secrets-access"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:huntaze/ai-router/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "huntaze-ai-router-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project     = "Huntaze"
    Service     = "AI-Router"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Log Group
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "ai_router" {
  name              = "/ecs/huntaze-ai-router"
  retention_in_days = 30

  tags = {
    Project     = "Huntaze"
    Service     = "AI-Router"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.ai_router.dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID for Route53"
  value       = aws_lb.ai_router.zone_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.ai_router.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.ai_router.name
}
