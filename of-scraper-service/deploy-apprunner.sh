#!/bin/bash
set -e

# FORCE us-east-2 (même région que RDS/SQS/DynamoDB)
AWS_REGION="us-east-2"
export AWS_DEFAULT_REGION="us-east-2"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/of-scraper-worker:latest"
SERVICE_NAME="of-scraper-worker"

echo "🚀 Création du service App Runner..."
echo "   Region: ${AWS_REGION}"
echo "   Image: ${ECR_URI}"

# Créer le rôle IAM pour App Runner ECR access (si n'existe pas)
ROLE_NAME="AppRunnerECRAccessRole"
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "build.apprunner.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'

echo "📋 Création du rôle IAM..."
aws iam create-role \
  --role-name ${ROLE_NAME} \
  --assume-role-policy-document "${TRUST_POLICY}" \
  --region ${AWS_REGION} 2>/dev/null || echo "   Rôle existe déjà"

aws iam attach-role-policy \
  --role-name ${ROLE_NAME} \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess \
  2>/dev/null || echo "   Policy déjà attachée"

# Attendre que le rôle soit propagé
echo "⏳ Attente propagation IAM (10s)..."
sleep 10

ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"

echo "🔧 Création du service App Runner..."
aws apprunner create-service \
  --service-name ${SERVICE_NAME} \
  --source-configuration "{
    \"AuthenticationConfiguration\": {
      \"AccessRoleArn\": \"${ROLE_ARN}\"
    },
    \"AutoDeploymentsEnabled\": true,
    \"ImageRepository\": {
      \"ImageIdentifier\": \"${ECR_URI}\",
      \"ImageRepositoryType\": \"ECR\",
      \"ImageConfiguration\": {
        \"Port\": \"8080\"
      }
    }
  }" \
  --instance-configuration "{
    \"Cpu\": \"1024\",
    \"Memory\": \"2048\"
  }" \
  --health-check-configuration "{
    \"Protocol\": \"HTTP\",
    \"Path\": \"/health\",
    \"Interval\": 10,
    \"Timeout\": 5,
    \"HealthyThreshold\": 1,
    \"UnhealthyThreshold\": 5
  }" \
  --region ${AWS_REGION}

echo ""
echo "✅ Service App Runner créé!"
echo ""
echo "⏳ Attente du déploiement (peut prendre 3-5 min)..."
echo "   Vérifie le statut avec:"
echo "   aws apprunner describe-service --service-arn \$(aws apprunner list-services --region ${AWS_REGION} --query \"ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn\" --output text) --region ${AWS_REGION}"
