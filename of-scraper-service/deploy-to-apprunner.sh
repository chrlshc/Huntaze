#!/bin/bash
# 🚀 Deploy OF Scraper Worker to AWS App Runner
# 
# Prerequisites:
# - AWS CLI configured
# - Docker installed
# - ECR repository created

set -e

# Configuration - FORCE us-east-2 (même région que RDS/SQS)
AWS_REGION="us-east-2"
export AWS_DEFAULT_REGION="us-east-2"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="huntaze-of-scraper"
IMAGE_TAG="latest"
SERVICE_NAME="huntaze-of-scraper"

echo "🔧 Configuration:"
echo "   Region: $AWS_REGION"
echo "   Account: $AWS_ACCOUNT_ID"
echo "   Repository: $ECR_REPO"

# 1. Create ECR repository if not exists
echo ""
echo "📦 Creating ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION 2>/dev/null || \
  aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION

# 2. Login to ECR
echo ""
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 3. Build Docker image
echo ""
echo "🏗️ Building Docker image..."
docker build -t $ECR_REPO:$IMAGE_TAG .

# 4. Tag and push to ECR
echo ""
echo "📤 Pushing to ECR..."
docker tag $ECR_REPO:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG

# 5. Check if App Runner service exists
echo ""
echo "🔍 Checking App Runner service..."
SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION \
  --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
  --output text 2>/dev/null || echo "")

if [ -z "$SERVICE_ARN" ]; then
  echo "📝 Creating new App Runner service..."
  
  # Create service configuration
  cat > /tmp/apprunner-config.json << EOF
{
  "ServiceName": "$SERVICE_NAME",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production"
        }
      }
    },
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/AppRunnerECRAccessRole"
    }
  },
  "InstanceConfiguration": {
    "Cpu": "1024",
    "Memory": "2048"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }
}
EOF

  aws apprunner create-service \
    --cli-input-json file:///tmp/apprunner-config.json \
    --region $AWS_REGION
    
  echo "⏳ Waiting for service to be created..."
  sleep 30
else
  echo "🔄 Updating existing service..."
  aws apprunner start-deployment \
    --service-arn $SERVICE_ARN \
    --region $AWS_REGION
fi

# 6. Get service URL
echo ""
echo "🔍 Getting service URL..."
sleep 10
SERVICE_URL=$(aws apprunner describe-service \
  --service-arn $(aws apprunner list-services --region $AWS_REGION \
    --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
    --output text) \
  --region $AWS_REGION \
  --query "Service.ServiceUrl" \
  --output text 2>/dev/null || echo "pending...")

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Add REDIS_URL to App Runner environment variables"
echo "   2. Set OF_SCRAPER_WORKER_URL=https://$SERVICE_URL in Vercel"
echo "   3. Test: curl https://$SERVICE_URL/health"
echo ""
echo "🔗 Service URL: https://$SERVICE_URL"
