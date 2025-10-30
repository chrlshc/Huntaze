#!/bin/bash

# Huntaze AWS Infrastructure Setup Script
# Creates missing DynamoDB tables, SQS queues, and SNS topics

set -e

REGION="us-east-1"
ACCOUNT_ID="317805897534"

echo "🚀 Huntaze AWS Infrastructure Setup"
echo "=================================="
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS credentials OK${NC}"
echo ""

# Function to create DynamoDB table if not exists
create_dynamodb_table() {
    local table_name=$1
    local hash_key=$2
    local range_key=$3
    
    echo "Checking DynamoDB table: $table_name"
    
    if aws dynamodb describe-table --table-name "$table_name" --region "$REGION" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Table already exists: $table_name${NC}"
    else
        echo "Creating table: $table_name"
        
        if [ -z "$range_key" ]; then
            # Hash key only
            aws dynamodb create-table \
                --table-name "$table_name" \
                --attribute-definitions AttributeName="$hash_key",AttributeType=S \
                --key-schema AttributeName="$hash_key",KeyType=HASH \
                --billing-mode PAY_PER_REQUEST \
                --region "$REGION" \
                > /dev/null
        else
            # Hash + Range key
            aws dynamodb create-table \
                --table-name "$table_name" \
                --attribute-definitions \
                    AttributeName="$hash_key",AttributeType=S \
                    AttributeName="$range_key",AttributeType=S \
                --key-schema \
                    AttributeName="$hash_key",KeyType=HASH \
                    AttributeName="$range_key",KeyType=RANGE \
                --billing-mode PAY_PER_REQUEST \
                --region "$REGION" \
                > /dev/null
        fi
        
        echo -e "${GREEN}✅ Created table: $table_name${NC}"
    fi
}

# Function to create SQS queue if not exists
create_sqs_queue() {
    local queue_name=$1
    
    echo "Checking SQS queue: $queue_name"
    
    if aws sqs get-queue-url --queue-name "$queue_name" --region "$REGION" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Queue already exists: $queue_name${NC}"
    else
        echo "Creating queue: $queue_name"
        aws sqs create-queue \
            --queue-name "$queue_name" \
            --region "$REGION" \
            > /dev/null
        echo -e "${GREEN}✅ Created queue: $queue_name${NC}"
    fi
}

# Function to create SNS topic if not exists
create_sns_topic() {
    local topic_name=$1
    
    echo "Checking SNS topic: $topic_name"
    
    local topic_arn="arn:aws:sns:$REGION:$ACCOUNT_ID:$topic_name"
    
    if aws sns get-topic-attributes --topic-arn "$topic_arn" --region "$REGION" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Topic already exists: $topic_name${NC}"
    else
        echo "Creating topic: $topic_name"
        aws sns create-topic \
            --name "$topic_name" \
            --region "$REGION" \
            > /dev/null
        echo -e "${GREEN}✅ Created topic: $topic_name${NC}"
    fi
}

echo "📦 Creating DynamoDB Tables..."
echo "------------------------------"
create_dynamodb_table "huntaze-ai-costs-production" "id" "timestamp"
create_dynamodb_table "huntaze-cost-alerts-production" "id" ""
echo ""

echo "📬 Creating SQS Queues..."
echo "-------------------------"
create_sqs_queue "huntaze-hybrid-workflows"
create_sqs_queue "huntaze-rate-limiter-queue"
echo ""

echo "📢 Creating SNS Topics..."
echo "-------------------------"
create_sns_topic "huntaze-cost-alerts"
echo ""

echo "🎉 Infrastructure setup complete!"
echo ""
echo "Next steps:"
echo "1. Subscribe to SNS topic for email alerts:"
echo "   aws sns subscribe --topic-arn arn:aws:sns:$REGION:$ACCOUNT_ID:huntaze-cost-alerts --protocol email --notification-endpoint your-email@example.com"
echo ""
echo "2. Update your .env file with the new resource names"
echo ""
echo "3. Deploy your application to ECS"
echo ""
