#!/bin/bash

# ============================================================================
# Enable ECS Deployment Circuit Breaker
# ============================================================================
# This script enables the deployment circuit breaker on ECS services
# Circuit breaker automatically rolls back failed deployments
# ============================================================================

set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
CLUSTERS=("ai-team" "huntaze-cluster" "huntaze-of-fargate")

echo "============================================"
echo "Enable ECS Deployment Circuit Breaker"
echo "============================================"
echo "Region: $AWS_REGION"
echo "Clusters: ${CLUSTERS[*]}"
echo "============================================"
echo ""

# Function to enable circuit breaker on a service
enable_circuit_breaker() {
  local cluster=$1
  local service=$2
  
  echo "🔧 Enabling circuit breaker on $cluster/$service..."
  
  # Update service with circuit breaker
  aws ecs update-service \
    --cluster "$cluster" \
    --service "$service" \
    --region "$AWS_REGION" \
    --deployment-configuration "{
      \"deploymentCircuitBreaker\": {
        \"enable\": true,
        \"rollback\": true
      },
      \"maximumPercent\": 200,
      \"minimumHealthyPercent\": 100
    }" \
    --output json > /dev/null
  
  if [ $? -eq 0 ]; then
    echo "   ✅ Circuit breaker enabled on $service"
  else
    echo "   ❌ Failed to enable circuit breaker on $service"
    return 1
  fi
}

# Process each cluster
for cluster in "${CLUSTERS[@]}"; do
  echo "📋 Processing cluster: $cluster"
  echo ""
  
  # List services in cluster
  services=$(aws ecs list-services \
    --cluster "$cluster" \
    --region "$AWS_REGION" \
    --query 'serviceArns[*]' \
    --output text)
  
  if [ -z "$services" ]; then
    echo "   ⚠️  No services found in cluster $cluster"
    echo ""
    continue
  fi
  
  # Extract service names from ARNs
  service_names=()
  for service_arn in $services; do
    service_name=$(echo "$service_arn" | awk -F'/' '{print $NF}')
    service_names+=("$service_name")
  done
  
  echo "   Found ${#service_names[@]} services"
  echo ""
  
  # Enable circuit breaker on each service
  for service in "${service_names[@]}"; do
    # Check if circuit breaker is already enabled
    cb_enabled=$(aws ecs describe-services \
      --cluster "$cluster" \
      --services "$service" \
      --region "$AWS_REGION" \
      --query 'services[0].deploymentConfiguration.deploymentCircuitBreaker.enable' \
      --output text)
    
    if [ "$cb_enabled" == "True" ]; then
      echo "   ✅ Circuit breaker already enabled on $service"
      continue
    fi
    
    # Enable circuit breaker
    enable_circuit_breaker "$cluster" "$service"
  done
  
  echo ""
done

echo "============================================"
echo "Summary"
echo "============================================"

# Count services with circuit breaker enabled
total_services=0
enabled_services=0

for cluster in "${CLUSTERS[@]}"; do
  services=$(aws ecs list-services \
    --cluster "$cluster" \
    --region "$AWS_REGION" \
    --query 'serviceArns[*]' \
    --output text)
  
  for service_arn in $services; do
    service_name=$(echo "$service_arn" | awk -F'/' '{print $NF}')
    total_services=$((total_services + 1))
    
    cb_enabled=$(aws ecs describe-services \
      --cluster "$cluster" \
      --services "$service_name" \
      --region "$AWS_REGION" \
      --query 'services[0].deploymentConfiguration.deploymentCircuitBreaker.enable' \
      --output text)
    
    if [ "$cb_enabled" == "True" ]; then
      enabled_services=$((enabled_services + 1))
    fi
  done
done

echo "Total services: $total_services"
echo "Circuit breaker enabled: $enabled_services"
echo "============================================"
echo ""

if [ "$enabled_services" -eq "$total_services" ]; then
  echo "✅ All services have circuit breaker enabled"
  exit 0
else
  echo "⚠️  Some services do not have circuit breaker enabled"
  exit 1
fi
