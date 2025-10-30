#!/bin/bash

# ============================================================================
# Apply DynamoDB TTL Configuration
# ============================================================================
# Enables Time-To-Live on DynamoDB tables for automatic data expiration
# TTL deletes expired items without consuming write capacity
# ============================================================================

set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"

# Tables with TTL configuration (table_name:ttl_attribute:description)
TABLES=(
  "huntaze-ai-costs-production:ttl:90 days"
  "huntaze-cost-alerts-production:ttl:30 days"
  "huntaze-analytics-events:ttl:90 days"
)

echo "============================================"
echo "Apply DynamoDB TTL Configuration"
echo "============================================"
echo "Region: $AWS_REGION"
echo "Tables: ${#TABLES[@]}"
echo "============================================"
echo ""

# Function to enable TTL on a table
enable_ttl() {
  local table=$1
  local ttl_attribute=$2
  local description=$3
  
  echo "📋 Table: $table"
  echo "   TTL Attribute: $ttl_attribute"
  echo "   Retention: $description"
  
  # Check if table exists
  if ! aws dynamodb describe-table \
    --table-name "$table" \
    --region "$AWS_REGION" \
    --query 'Table.TableName' \
    --output text &>/dev/null; then
    echo "   ⚠️  Table not found, skipping"
    echo ""
    return 0
  fi
  
  # Check current TTL status
  current_status=$(aws dynamodb describe-time-to-live \
    --table-name "$table" \
    --region "$AWS_REGION" \
    --query 'TimeToLiveDescription.TimeToLiveStatus' \
    --output text)
  
  if [ "$current_status" == "ENABLED" ]; then
    current_attr=$(aws dynamodb describe-time-to-live \
      --table-name "$table" \
      --region "$AWS_REGION" \
      --query 'TimeToLiveDescription.AttributeName' \
      --output text)
    
    echo "   ✅ TTL already enabled on attribute: $current_attr"
    echo ""
    return 0
  fi
  
  # Enable TTL
  echo "   🔧 Enabling TTL..."
  aws dynamodb update-time-to-live \
    --table-name "$table" \
    --region "$AWS_REGION" \
    --time-to-live-specification "Enabled=true,AttributeName=$ttl_attribute" \
    --output json > /dev/null
  
  if [ $? -eq 0 ]; then
    echo "   ✅ TTL enabled successfully"
  else
    echo "   ❌ Failed to enable TTL"
    return 1
  fi
  
  echo ""
}

# Process each table
for table_config in "${TABLES[@]}"; do
  IFS=':' read -r table ttl_attr description <<< "$table_config"
  enable_ttl "$table" "$ttl_attr" "$description"
done

echo "============================================"
echo "Verification"
echo "============================================"
echo ""

# Verify TTL status on all tables
for table_config in "${TABLES[@]}"; do
  IFS=':' read -r table ttl_attr description <<< "$table_config"
  
  if ! aws dynamodb describe-table \
    --table-name "$table" \
    --region "$AWS_REGION" \
    --query 'Table.TableName' \
    --output text &>/dev/null; then
    continue
  fi
  
  status=$(aws dynamodb describe-time-to-live \
    --table-name "$table" \
    --region "$AWS_REGION" \
    --query 'TimeToLiveDescription.TimeToLiveStatus' \
    --output text)
  
  attr=$(aws dynamodb describe-time-to-live \
    --table-name "$table" \
    --region "$AWS_REGION" \
    --query 'TimeToLiveDescription.AttributeName' \
    --output text)
  
  echo "Table: $table"
  echo "  Status: $status"
  echo "  Attribute: $attr"
  echo "  Retention: $description"
  echo ""
done

echo "============================================"
echo "TTL Configuration Complete"
echo "============================================"
echo ""
echo "ℹ️  Notes:"
echo "  - TTL deletions occur within 48 hours of expiration"
echo "  - Deletions do not consume write capacity"
echo "  - Set 'ttl' attribute to Unix epoch timestamp"
echo "  - Example: ttl = Math.floor(Date.now()/1000) + (90*24*3600)"
echo ""
echo "✅ Done!"
