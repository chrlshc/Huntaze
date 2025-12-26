#!/bin/bash
set -e

# Configuration - FORCE us-east-2 (même région que RDS/SQS/DynamoDB)
AWS_REGION="us-east-2"
export AWS_DEFAULT_REGION="us-east-2"

ECR_REPO_NAME="of-scraper-worker"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo "🚀 Déploiement OF Scraper Worker sur AWS"
echo "   Region: ${AWS_REGION}"
echo "   Account: ${AWS_ACCOUNT_ID}"
echo ""

# 1. Créer le repo ECR s'il n'existe pas
echo "📦 Création du repo ECR..."
aws ecr describe-repositories --repository-names ${ECR_REPO_NAME} --region ${AWS_REGION} 2>/dev/null || \
aws ecr create-repository --repository-name ${ECR_REPO_NAME} --region ${AWS_REGION}

# 2. Login Docker vers ECR
echo "🔐 Login Docker vers ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# 3. Build de l'image
echo "🔨 Build de l'image Docker..."
docker build -t ${ECR_REPO_NAME} .

# 4. Tag et Push
echo "📤 Push vers ECR..."
docker tag ${ECR_REPO_NAME}:latest ${ECR_URI}:latest
docker push ${ECR_URI}:latest

echo ""
echo "✅ Image poussée avec succès!"
echo "   URI: ${ECR_URI}:latest"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Aller sur AWS Console -> App Runner"
echo "   2. Create Service -> Source: Amazon ECR"
echo "   3. Sélectionner l'image: ${ECR_URI}:latest"
echo "   4. Configuration:"
echo "      - CPU: 1 vCPU"
echo "      - Memory: 2 GB"
echo "      - Port: 8080"
echo "   5. Deployment: Automatic"
echo ""
echo "🔗 Une fois déployé, tu auras une URL HTTPS du type:"
echo "   https://xyz.awsapprunner.com"
