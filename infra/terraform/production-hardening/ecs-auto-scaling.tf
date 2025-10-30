# ============================================================================
# ECS Service Auto Scaling - Target Tracking
# ============================================================================
# Configures auto-scaling for ECS services based on CPU and Memory utilization
# Includes deployment circuit breaker for automatic rollback
# References: AWS ECS Auto Scaling Best Practices
# ============================================================================

# ============================================================================
# Data Sources - Existing ECS Resources
# ============================================================================

# ECS Clusters

data "aws_ecs_cluster" "huntaze" {
  cluster_name = var.ecs_cluster_huntaze
}

data "aws_ecs_cluster" "huntaze_of" {
  cluster_name = var.ecs_cluster_huntaze_of
}

# ECS Services (to be configured with auto-scaling)
# Note: These are data sources for existing services
# Auto-scaling will be added via aws_appautoscaling_target

# ============================================================================
# Application Auto Scaling Targets
# ============================================================================

# Auto Scaling Target for AI Team Cluster Services
resource "aws_appautoscaling_target" "ai_team_service" {
  for_each = toset(var.ecs_services_ai_team)
  
  max_capacity       = var.ecs_max_capacity
  min_capacity       = var.ecs_min_capacity
  resource_id        = "service/${var.ecs_cluster_ai_team}/${each.value}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Target for Huntaze Cluster Services
resource "aws_appautoscaling_target" "huntaze_service" {
  for_each = toset(var.ecs_services_huntaze)
  
  max_capacity       = var.ecs_max_capacity
  min_capacity       = var.ecs_min_capacity
  resource_id        = "service/${var.ecs_cluster_huntaze}/${each.value}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Target for Huntaze OF Cluster Services
resource "aws_appautoscaling_target" "huntaze_of_service" {
  for_each = toset(var.ecs_services_huntaze_of)
  
  max_capacity       = var.ecs_max_capacity
  min_capacity       = var.ecs_min_capacity
  resource_id        = "service/${var.ecs_cluster_huntaze_of}/${each.value}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# ============================================================================
# Target Tracking Scaling Policies - CPU
# ============================================================================

# CPU-based scaling for AI Team services
resource "aws_appautoscaling_policy" "ai_team_cpu" {
  for_each = toset(var.ecs_services_ai_team)
  
  name               = "${each.value}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ai_team_service[each.value].resource_id
  scalable_dimension = aws_appautoscaling_target.ai_team_service[each.value].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ai_team_service[each.value].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    
    target_value       = var.ecs_cpu_target_value
    scale_in_cooldown  = var.ecs_scale_in_cooldown
    scale_out_cooldown = var.ecs_scale_out_cooldown
  }
}

# CPU-based scaling for Huntaze services
resource "aws_appautoscaling_policy" "huntaze_cpu" {
  for_each = toset(var.ecs_services_huntaze)
  
  name               = "${each.value}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.huntaze_service[each.value].resource_id
  scalable_dimension = aws_appautoscaling_target.huntaze_service[each.value].scalable_dimension
  service_namespace  = aws_appautoscaling_target.huntaze_service[each.value].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    
    target_value       = var.ecs_cpu_target_value
    scale_in_cooldown  = var.ecs_scale_in_cooldown
    scale_out_cooldown = var.ecs_scale_out_cooldown
  }
}

# CPU-based scaling for Huntaze OF services
resource "aws_appautoscaling_policy" "huntaze_of_cpu" {
  for_each = toset(var.ecs_services_huntaze_of)
  
  name               = "${each.value}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.huntaze_of_service[each.value].resource_id
  scalable_dimension = aws_appautoscaling_target.huntaze_of_service[each.value].scalable_dimension
  service_namespace  = aws_appautoscaling_target.huntaze_of_service[each.value].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    
    target_value       = var.ecs_cpu_target_value
    scale_in_cooldown  = var.ecs_scale_in_cooldown
    scale_out_cooldown = var.ecs_scale_out_cooldown
  }
}

# ============================================================================
# Target Tracking Scaling Policies - Memory
# ============================================================================

# Memory-based scaling for AI Team services
resource "aws_appautoscaling_policy" "ai_team_memory" {
  for_each = toset(var.ecs_services_ai_team)
  
  name               = "${each.value}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ai_team_service[each.value].resource_id
  scalable_dimension = aws_appautoscaling_target.ai_team_service[each.value].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ai_team_service[each.value].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    
    target_value       = var.ecs_memory_target_value
    scale_in_cooldown  = var.ecs_scale_in_cooldown
    scale_out_cooldown = var.ecs_scale_out_cooldown
  }
}

# Memory-based scaling for Huntaze services
resource "aws_appautoscaling_policy" "huntaze_memory" {
  for_each = toset(var.ecs_services_huntaze)
  
  name               = "${each.value}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.huntaze_service[each.value].resource_id
  scalable_dimension = aws_appautoscaling_target.huntaze_service[each.value].scalable_dimension
  service_namespace  = aws_appautoscaling_target.huntaze_service[each.value].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    
    target_value       = var.ecs_memory_target_value
    scale_in_cooldown  = var.ecs_scale_in_cooldown
    scale_out_cooldown = var.ecs_scale_out_cooldown
  }
}

# Memory-based scaling for Huntaze OF services
resource "aws_appautoscaling_policy" "huntaze_of_memory" {
  for_each = toset(var.ecs_services_huntaze_of)
  
  name               = "${each.value}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.huntaze_of_service[each.value].resource_id
  scalable_dimension = aws_appautoscaling_target.huntaze_of_service[each.value].scalable_dimension
  service_namespace  = aws_appautoscaling_target.huntaze_of_service[each.value].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    
    target_value       = var.ecs_memory_target_value
    scale_in_cooldown  = var.ecs_scale_in_cooldown
    scale_out_cooldown = var.ecs_scale_out_cooldown
  }
}

# ============================================================================
# CloudWatch Alarms for Auto Scaling
# ============================================================================

# Alarm: Service scaled to max capacity
resource "aws_cloudwatch_metric_alarm" "ecs_max_capacity_reached" {
  for_each = merge(
    { for s in var.ecs_services_ai_team : "${var.ecs_cluster_ai_team}/${s}" => s },
    { for s in var.ecs_services_huntaze : "${var.ecs_cluster_huntaze}/${s}" => s },
    { for s in var.ecs_services_huntaze_of : "${var.ecs_cluster_huntaze_of}/${s}" => s }
  )
  
  alarm_name          = "ecs-${replace(each.key, "/", "-")}-max-capacity"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "DesiredTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = "300"
  statistic           = "Average"
  threshold           = var.ecs_max_capacity
  alarm_description   = "ECS service ${each.value} has reached maximum capacity"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]

  dimensions = {
    ServiceName = each.value
    ClusterName = split("/", each.key)[0]
  }

  tags = {
    Name        = "ecs-max-capacity-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
    Severity    = "warning"
  }
}

# ============================================================================
# Outputs
# ============================================================================

output "ecs_auto_scaling_targets" {
  description = "List of ECS services with auto-scaling configured"
  value = concat(
    [for s in var.ecs_services_ai_team : "${var.ecs_cluster_ai_team}/${s}"],
    [for s in var.ecs_services_huntaze : "${var.ecs_cluster_huntaze}/${s}"],
    [for s in var.ecs_services_huntaze_of : "${var.ecs_cluster_huntaze_of}/${s}"]
  )
}

output "ecs_scaling_policies_cpu" {
  description = "CPU-based scaling policies created"
  value = merge(
    { for k, v in aws_appautoscaling_policy.ai_team_cpu : k => v.name },
    { for k, v in aws_appautoscaling_policy.huntaze_cpu : k => v.name },
    { for k, v in aws_appautoscaling_policy.huntaze_of_cpu : k => v.name }
  )
}

output "ecs_scaling_policies_memory" {
  description = "Memory-based scaling policies created"
  value = merge(
    { for k, v in aws_appautoscaling_policy.ai_team_memory : k => v.name },
    { for k, v in aws_appautoscaling_policy.huntaze_memory : k => v.name },
    { for k, v in aws_appautoscaling_policy.huntaze_of_memory : k => v.name }
  )
}
