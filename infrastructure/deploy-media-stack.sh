#!/bin/bash
set -e

# Configuration
STACK_NAME="huntaze-media-processing"
ENVIRONMENT=${1:-production}
REGION="us-east-1"
PROFILE="huntaze"
ALERT_EMAIL=${2:-alerts@huntaze.com}

echo "🚀 Deploying Huntaze Media Processing Stack"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Alert Email: $ALERT_EMAIL"

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
aws sts get-caller-identity --profile $PROFILE > /dev/null || {
    echo "❌ AWS credentials not valid. Run: aws sso login --profile huntaze"
    exit 1
}

# Validate template
echo "✅ Validating CloudFormation template..."
aws cloudformation validate-template \
    --profile $PROFILE \
    --region $REGION \
    --template-body file://huntaze-media-stack-v2.yaml

# Skip Lambda packaging since we use inline code
echo "📦 Using inline Lambda code (no packaging needed)..."

# No need to upload since we use inline code

# Deploy stack
echo "🏗️ Deploying CloudFormation stack..."
aws cloudformation deploy \
    --profile $PROFILE \
    --region $REGION \
    --template-file huntaze-media-stack-v2.yaml \
    --stack-name $STACK_NAME-$ENVIRONMENT \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        AlertEmail=$ALERT_EMAIL \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset

# Get outputs
echo "📋 Getting stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
    --profile $PROFILE \
    --region $REGION \
    --stack-name $STACK_NAME-$ENVIRONMENT \
    --query 'Stacks[0].Outputs' \
    --output json)

echo "$OUTPUTS" | jq -r '.[] | "\(.OutputKey): \(.OutputValue)"'

# Save outputs to env file
echo "💾 Saving outputs to .env.media..."
cat > .env.media << EOF
# Huntaze Media Processing Stack Outputs
# Generated: $(date)
# Environment: $ENVIRONMENT

MEDIA_BUCKET=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="BucketName") | .OutputValue')
MEDIA_TABLE=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="TableName") | .OutputValue')
PROCESSOR_ARN=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="LambdaFunctionArn") | .OutputValue')
ALERT_TOPIC=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="AlertTopicArn") | .OutputValue')
DASHBOARD_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="DashboardURL") | .OutputValue')
EOF

echo "✅ Deployment complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Confirm email subscription at: $ALERT_EMAIL"
echo "2. Test by uploading an image to: s3://$MEDIA_BUCKET/test-user/test-image.jpg"
echo "3. View dashboard at: $DASHBOARD_URL"
echo "4. Add .env.media values to your main .env.local"

# Cleanup
rm -f lambda-package.zip