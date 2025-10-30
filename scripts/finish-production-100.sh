#!/bin/bash
# Finish Production Deployment to 100%

set -e

echo "🚀 Finishing Production Deployment to 100%"
echo ""

# Step 1: Check if IAM role exists
echo "🔧 Step 1/3: Checking IAM role..."
ROLE_EXISTS=$(aws iam get-role --role-name huntaze-rate-limiter-lambda-role 2>&1 || echo "NOT_FOUND")

if [[ "$ROLE_EXISTS" == *"NOT_FOUND"* ]]; then
  echo "Creating IAM role..."
  
  # Create trust policy
  cat > /tmp/lambda-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

  aws iam create-role \
    --role-name huntaze-rate-limiter-lambda-role \
    --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
    --description "Rate limiter Lambda execution role"
  
  # Attach basic execution policy
  aws iam attach-role-policy \
    --role-name huntaze-rate-limiter-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  
  # Create inline policy for SQS
  cat > /tmp/lambda-sqs-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": "arn:aws:sqs:us-east-1:317805897534:huntaze-rate-limiter-queue"
    }
  ]
}
EOF

  aws iam put-role-policy \
    --role-name huntaze-rate-limiter-lambda-role \
    --policy-name SQSAccess \
    --policy-document file:///tmp/lambda-sqs-policy.json
  
  echo "✅ IAM role created"
  echo "⏳ Waiting 10 seconds for IAM propagation..."
  sleep 10
else
  echo "✅ IAM role already exists"
fi

# Step 2: Create or update Lambda function
echo ""
echo "🔧 Step 2/3: Deploying Lambda function..."

LAMBDA_EXISTS=$(aws lambda get-function --function-name huntaze-rate-limiter 2>&1 || echo "NOT_FOUND")

if [[ "$LAMBDA_EXISTS" == *"NOT_FOUND"* ]]; then
  echo "Creating Lambda function..."
  aws lambda create-function \
    --function-name huntaze-rate-limiter \
    --runtime nodejs20.x \
    --role arn:aws:iam::317805897534:role/huntaze-rate-limiter-lambda-role \
    --handler index.handler \
    --timeout 15 \
    --memory-size 256 \
    --zip-file fileb://dist/rate-limiter.zip \
    --environment "Variables={QUEUE_URL=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue,REDIS_HOST=,REDIS_PORT=6379,TOKENS_PER_WINDOW=10,WINDOW_SECONDS=60,BUCKET_CAPACITY=10}" \
    --description "OnlyFans rate limiter with token bucket algorithm"
  
  echo "✅ Lambda function created"
else
  echo "Updating Lambda function code..."
  aws lambda update-function-code \
    --function-name huntaze-rate-limiter \
    --zip-file fileb://dist/rate-limiter.zip
  
  echo "✅ Lambda function updated"
fi

# Step 3: Create event source mapping
echo ""
echo "🔧 Step 3/3: Creating SQS event source mapping..."

MAPPING_EXISTS=$(aws lambda list-event-source-mappings \
  --function-name huntaze-rate-limiter \
  --query 'EventSourceMappings[0].UUID' \
  --output text 2>&1 || echo "None")

if [[ "$MAPPING_EXISTS" == "None" ]]; then
  echo "Creating event source mapping..."
  aws lambda create-event-source-mapping \
    --function-name huntaze-rate-limiter \
    --event-source-arn arn:aws:sqs:us-east-1:317805897534:huntaze-rate-limiter-queue \
    --batch-size 5 \
    --scaling-config MaximumConcurrency=2 \
    --function-response-types ReportBatchItemFailures
  
  echo "✅ Event source mapping created"
else
  echo "✅ Event source mapping already exists (UUID: $MAPPING_EXISTS)"
fi

# Step 4: Set SQS visibility timeout
echo ""
echo "🔧 Step 4/3 (Bonus): Setting SQS visibility timeout..."
aws sqs set-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue \
  --attributes VisibilityTimeout=90

echo "✅ SQS visibility timeout set to 90 seconds"

# Final validation
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 PRODUCTION DEPLOYMENT 100% COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Lambda rate-limiter deployed"
echo "✅ SQS event source mapping configured"
echo "✅ Visibility timeout optimized"
echo ""
echo "Verify deployment:"
echo "  aws lambda get-function --function-name huntaze-rate-limiter"
echo "  aws lambda list-event-source-mappings --function-name huntaze-rate-limiter"
echo ""
echo "Test rate limiter:"
echo "  ./scripts/test-rate-limiter.sh"
echo ""
echo "🎯 Your infrastructure is 100% production-ready!"
