#!/bin/bash

# ============================================================================
# Validate ECS Auto Scaling Configuration
# ============================================================================
# This script validates that auto-scaling is properly configured on ECS services
# ============================================================================

set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
CLUSTERS=("ai-team" "huntaze-cluster" "huntaze-of-fargate")

echo "============================================"
echo "Validate ECS Auto Scaling"
echo "============================================"
echo "Region: $AWS_REGION"
echo "============================================"
echo ""

total_services=0
services_with_scaling=0
services_with_circuit_breaker=0

# Process each cluster
for cluster in "${CLUSTERS[@]}"; do
  echo "📋 Cluster: $cluster"
  echo ""
  
  # List services
  services=$(aws ecs list-services \
    --cluster "$cluster" \
    --region "$AWS_REGION" \
    --query 'serviceArns[*]' \
    --output text)
  
  if [ -z "$services" ]; then
    echo "   ⚠️  No services found"
    echo ""
    continue
  fi
  
  # Process each service
  for service_arn in $services; do
    service_name=$(echo "$service_arn" | awk -F'/' '{print $NF}')
    total_services=$((total_services + 1))
    
    echo "   Service: $service_name"
    
    # Check auto-scaling target
    resource_id="service/$cluster/$service_name"
    scaling_target=$(aws application-autoscaling describe-scalable-targets \
      --service-namespace ecs \
      --resource-ids "$resource_id" \
      --region "$AWS_REGION" \
      --query 'ScalableTargets[0]' \
      --output json 2>/dev/null)
    
    if [ -n "$scaling_target" ] && [ "$scaling_target" != "null" ]; then
      services_with_scaling=$((services_with_scaling + 1))
      
      min_capacity=$(echo "$scaling_target" | jq -r '.MinCapacity')
      max_capacity=$(echo "$scaling_target" | jq -r '.MaxCapacity')
      
      echo "      ✅ Auto-scaling: Enabled (min: $min_capacity, max: $max_capacity)"
      
      # Check scaling policies
      policies=$(aws application-autoscaling describe-scaling-policies \
        --service-namespace ecs \
        --resource-id "$resource_id" \
        --region "$AWS_REGION" \
        --query 'ScalingPolicies[*].PolicyName' \
        --output text)
      
      if [ -n "$policies" ]; then
        policy_count=$(echo "$policies" | wc -w)
        echo "      ✅ Scaling policies: $policy_count configured"
      else
        echo "      ⚠️  Scaling policies: None configured"
      fi
    else
      echo "      ❌ Auto-scaling: Not configured"
    fi
    
    # Check circuit breaker
    cb_enabled=$(aws ecs describe-services \
      --cluster "$cluster" \
      --services "$service_name" \
      --region "$AWS_REGION" \
      --query 'services[0].deploymentConfiguration.deploymentCircuitBreaker.enable' \
      --output text)
    
    if [ "$cb_enabled" == "True" ]; then
      services_with_circuit_breaker=$((services_with_circuit_breaker + 1))
      echo "      ✅ Circuit breaker: Enabled"
    else
      echo "      ❌ Circuit breaker: Disabled"
    fi
    
    echo ""
  done
done

echo "============================================"
echo "Validation Summary"
echo "============================================"
echo "Total services: $total_services"
echo "Auto-scaling configured: $services_with_scaling"
echo "Circuit breaker enabled: $services_with_circuit_breaker"
echo "============================================"
echo ""

# Calculate percentages
if [ "$total_services" -gt 0 ]; then
  scaling_pct=$((services_with_scaling * 100 / total_services))
  cb_pct=$((services_with_circuit_breaker * 100 / total_services))
  
  echo "Auto-scaling coverage: $scaling_pct%"
  echo "Circuit breaker coverage: $cb_pct%"
  echo ""
fi

# Determine exit code
if [ "$services_with_scaling" -eq "$total_services" ] && [ "$services_with_circuit_breaker" -eq "$total_services" ]; then
  echo "✅ All services properly configured"
  exit 0
elif [ "$services_with_scaling" -gt 0 ] || [ "$services_with_circuit_breaker" -gt 0 ]; then
  echo "⚠️  Partial configuration - some services need attention"
  exit 0
else
  echo "❌ No services configured with auto-scaling or circuit breaker"
  exit 1
fi
