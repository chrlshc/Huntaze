#!/bin/bash

# Worker Deployment Script for Content Posting System
# Deploys the worker to AWS Lambda or ECS

set -e

# Configuration
WORKER_NAME="content-worker"
AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${ENVIRONMENT:-development}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "🚀 Deploying Content Worker..."
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo "Image Tag: $IMAGE_TAG"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

# Check if Docker is installed (for container builds)
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install it first."
    exit 1
fi

# Build the worker
echo "📦 Building worker..."
npm run build:worker

# Option 1: Deploy to AWS Lambda
deploy_lambda() {
    echo "📡 Deploying to AWS Lambda..."
    
    # Package the worker
    cd worker
    zip -r ../worker.zip .
    cd ..
    
    # Create or update Lambda function
    if aws lambda get-function --function-name $WORKER_NAME --region $AWS_REGION &> /dev/null; then
        echo "Updating existing Lambda function..."
        aws lambda update-function-code \
            --function-name $WORKER_NAME \
            --zip-file fileb://worker.zip \
            --region $AWS_REGION
    else
        echo "Creating new Lambda function..."
        aws lambda create-function \
            --function-name $WORKER_NAME \
            --runtime nodejs20.x \
            --handler index.handler \
            --zip-file fileb://worker.zip \
            --role arn:aws:iam::$AWS_ACCOUNT_ID:role/lambda-execution-role \
            --region $AWS_REGION \
            --environment Variables="{
                NODE_ENV=$ENVIRONMENT,
                DATABASE_URL=$DATABASE_URL,
                AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID,
                AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY,
                SQS_QUEUE_URL=$SQS_QUEUE_URL,
                S3_BUCKET=$S3_BUCKET,
                TOKEN_ENCRYPTION_KEY=$TOKEN_ENCRYPTION_KEY,
                REDIS_URL=$REDIS_URL
            }"
    fi
    
    # Clean up
    rm worker.zip
    
    echo "✅ Lambda deployment complete!"
}

# Option 2: Deploy to ECS (recommended for production)
deploy_ecs() {
    echo "🐳 Deploying to ECS..."
    
    # Build Docker image
    docker build -t $WORKER_NAME:$IMAGE_TAG -f worker/Dockerfile .
    
    # Tag for ECR
    ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$WORKER_NAME"
    docker tag $WORKER_NAME:$IMAGE_TAG $ECR_REPO:$IMAGE_TAG
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
    
    # Push to ECR
    docker push $ECR_REPO:$IMAGE_TAG
    
    # Update ECS service
    aws ecs update-service \
        --cluster huntaze-cluster \
        --service $WORKER_NAME \
        --force-new-deployment \
        --region $AWS_REGION
    
    echo "✅ ECS deployment complete!"
}

# Option 3: Deploy as Fargate task
deploy_fargate() {
    echo "🎯 Deploying to Fargate..."
    
    # Build and push image (same as ECS)
    docker build -t $WORKER_NAME:$IMAGE_TAG -f worker/Dockerfile .
    ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$WORKER_NAME"
    docker tag $WORKER_NAME:$IMAGE_TAG $ECR_REPO:$IMAGE_TAG
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
    docker push $ECR_REPO:$IMAGE_TAG
    
    # Run task
    aws ecs run-task \
        --cluster huntaze-cluster \
        --task-definition $WORKER_NAME \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
        --region $AWS_REGION
    
    echo "✅ Fargate deployment complete!"
}

# Main deployment logic
DEPLOYMENT_TYPE="${DEPLOYMENT_TYPE:-lambda}"

case $DEPLOYMENT_TYPE in
    "lambda")
        deploy_lambda
        ;;
    "ecs")
        deploy_ecs
        ;;
    "fargate")
        deploy_fargate
        ;;
    *)
        echo "❌ Unknown deployment type: $DEPLOYMENT_TYPE"
        echo "Valid options: lambda, ecs, fargate"
        exit 1
        ;;
esac

echo "🎉 Worker deployment complete!"
echo ""
echo "Next steps:"
echo "1. Monitor the worker logs in CloudWatch"
echo "2. Verify SQS messages are being processed"
echo "3. Check task status in the database"
