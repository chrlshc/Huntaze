#!/bin/bash
set -euo pipefail

STACK_NAME="huntaze-sqs-core-queues"
PROFILE="${AWS_PROFILE:-huntaze}"
REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Deploying SQS Core Queues"
echo "Profile: $PROFILE | Region: $REGION | Stack: $STACK_NAME"

aws cloudformation validate-template \
  --template-body file://sqs-core-queues.yaml \
  --profile "$PROFILE" \
  --region "$REGION" >/dev/null

aws cloudformation deploy \
  --template-file sqs-core-queues.yaml \
  --stack-name "$STACK_NAME" \
  --profile "$PROFILE" \
  --region "$REGION"

echo "\n✅ SQS queues deployed"

AI_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`AiProcessingQueueUrl`].OutputValue' --output text --profile "$PROFILE" --region "$REGION")
AN_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`AnalyticsQueueUrl`].OutputValue' --output text --profile "$PROFILE" --region "$REGION")
WH_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`WebhooksQueueUrl`].OutputValue' --output text --profile "$PROFILE" --region "$REGION")
EM_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`EmailQueueUrl`].OutputValue' --output text --profile "$PROFILE" --region "$REGION")

cat > .env.sqs-core <<EOF
# Generated: $(date)
AWS_REGION=$REGION

SQS_AI_QUEUE=huntaze-ai-processing
SQS_ANALYTICS_QUEUE=huntaze-analytics
SQS_WEBHOOKS_QUEUE=huntaze-webhooks
SQS_EMAIL_QUEUE=huntaze-email

# URLs (informational)
SQS_AI_QUEUE_URL=$AI_URL
SQS_ANALYTICS_QUEUE_URL=$AN_URL
SQS_WEBHOOKS_QUEUE_URL=$WH_URL
SQS_EMAIL_QUEUE_URL=$EM_URL
EOF

echo "\n📝 Saved SQS env defaults to .env.sqs-core"
echo "   AI:        $AI_URL"
echo "   Analytics: $AN_URL"
echo "   Webhooks:  $WH_URL"
echo "   Email:     $EM_URL"

echo "\n🎯 Next: ensure app runs with AWS_REGION=$REGION so clients use us-east-1"

