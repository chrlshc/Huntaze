#!/usr/bin/env bash
set -euo pipefail

# Quick deploy of the OnlyFans scraper agent to ECS Fargate.
# Prereqs: AWS CLI configured (SSO or env vars), pushed image in ECR.

# Config (override via env if needed)
ACCOUNT_ID=${ACCOUNT_ID:-317805897534}
REGION=${REGION:-us-east-1}
CLUSTER=${CLUSTER:-huntaze-cluster}
SERVICE=${SERVICE:-onlyfans-scraper}
FAMILY=${FAMILY:-huntaze-onlyfans-scraper}
REPO_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/huntaze-onlyfans-scraper"
LOG_GROUP=${LOG_GROUP:-/ecs/huntaze-scraper}
RESULT_BUCKET=${RESULT_BUCKET:-huntaze-scraper-results}

echo "[info] Region:        $REGION"
echo "[info] Account:       $ACCOUNT_ID"
echo "[info] Cluster:       $CLUSTER"
echo "[info] Service:       $SERVICE"
echo "[info] Family:        $FAMILY"
echo "[info] Image:         $REPO_URI:latest"
echo "[info] Log group:     $LOG_GROUP"
echo "[info] Result bucket: $RESULT_BUCKET"

aws sts get-caller-identity >/dev/null

echo "[step] Ensure CloudWatch Logs group"
aws logs create-log-group --log-group-name "$LOG_GROUP" --region "$REGION" 2>/dev/null || true

echo "[step] Ensure ECR repo exists"
aws ecr describe-repositories --repository-names "$FAMILY" --region "$REGION" >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name "$FAMILY" --region "$REGION" >/dev/null

echo "[step] Ensure IAM roles exist"
# Execution role (pull image, write logs)
set +e
EXEC_ROLE_ARN=$(aws iam get-role --role-name ecsTaskExecutionRole --query Role.Arn --output text 2>/dev/null)
set -e
if [ -z "${EXEC_ROLE_ARN:-}" ] || [ "$EXEC_ROLE_ARN" = "None" ]; then
  echo "[role] Creating ecsTaskExecutionRole"
  cat > /tmp/ecs-exec-trust.json <<'JSON'
{ "Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}
JSON
  EXEC_ROLE_ARN=$(aws iam create-role --role-name ecsTaskExecutionRole \
    --assume-role-policy-document file:///tmp/ecs-exec-trust.json \
    --query Role.Arn --output text)
  aws iam attach-role-policy --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy >/dev/null
fi

# Task role (app permissions)
set +e
TASK_ROLE_ARN=$(aws iam get-role --role-name huntazeScraperTaskRole --query Role.Arn --output text 2>/dev/null)
set -e
if [ -z "${TASK_ROLE_ARN:-}" ] || [ "$TASK_ROLE_ARN" = "None" ]; then
  echo "[role] Creating huntazeScraperTaskRole"
  cat > /tmp/huntaze-task-trust.json <<'JSON'
{ "Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}
JSON
  TASK_ROLE_ARN=$(aws iam create-role --role-name huntazeScraperTaskRole \
    --assume-role-policy-document file:///tmp/huntaze-task-trust.json \
    --query Role.Arn --output text)
  cat > /tmp/huntaze-task-policy.json <<JSON
{ "Version":"2012-10-17","Statement":[
  { "Effect":"Allow","Action":["s3:PutObject","s3:PutObjectAcl"],"Resource":["arn:aws:s3:::$RESULT_BUCKET/*"] }
]}
JSON
  aws iam put-role-policy --role-name huntazeScraperTaskRole \
    --policy-name HuntazeScraperTaskPolicy \
    --policy-document file:///tmp/huntaze-task-policy.json >/dev/null
fi

echo "[step] Resolve WS_URL from CloudFormation (if available)"
set +e
WS_URL=$(aws cloudformation describe-stacks --stack-name HuntazeByoIpStack --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='WebSocketUrl'].OutputValue" --output text 2>/dev/null)
set -e
if [ -z "${WS_URL:-}" ] || [ "$WS_URL" = "None" ]; then
  echo "[warn] WS_URL not found in CFN. Set WS_URL env to override. Using placeholder."
  WS_URL="wss://YOUR_API_ID.execute-api.$REGION.amazonaws.com/prod"
fi

echo "[step] Ensure S3 bucket exists (optional results bucket)"
set +e
aws s3api head-bucket --bucket "$RESULT_BUCKET" >/dev/null 2>&1
HEAD_RC=$?
set -e
if [ $HEAD_RC -ne 0 ]; then
  echo "[s3] Creating bucket $RESULT_BUCKET in $REGION"
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$RESULT_BUCKET" --region "$REGION" >/dev/null
  else
    aws s3api create-bucket --bucket "$RESULT_BUCKET" --create-bucket-configuration LocationConstraint="$REGION" --region "$REGION" >/dev/null
  fi
fi

echo "[step] Register task definition"
cat > /tmp/huntaze-task-def.json <<JSON
{
  "family": "$FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "$EXEC_ROLE_ARN",
  "taskRoleArn": "$TASK_ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "puppeteer-agent",
      "image": "$REPO_URI:latest",
      "essential": true,
      "environment": [
        {"name":"WS_URL","value":"$WS_URL"},
        {"name":"RESULT_BUCKET","value":"$RESULT_BUCKET"},
        {"name":"AWS_REGION","value":"$REGION"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "$LOG_GROUP",
          "awslogs-region": "$REGION",
          "awslogs-stream-prefix": "fargate"
        }
      }
    }
  ]
}
JSON

aws ecs register-task-definition --cli-input-json file:///tmp/huntaze-task-def.json --region "$REGION" >/dev/null
TD_ARN=$(aws ecs list-task-definitions --family-prefix "$FAMILY" --sort DESC \
  --query 'taskDefinitionArns[0]' --output text --region "$REGION")
echo "[ok] Task definition: $TD_ARN"

echo "[step] Ensure cluster exists"
set +e
CL_STATUS=$(aws ecs describe-clusters --clusters "$CLUSTER" --region "$REGION" --query 'clusters[0].status' --output text 2>/dev/null)
set -e
if [ -z "${CL_STATUS:-}" ] || [ "$CL_STATUS" = "MISSING" ] || [ "$CL_STATUS" = "None" ]; then
  aws ecs create-cluster --cluster-name "$CLUSTER" --region "$REGION" >/dev/null
fi

echo "[step] Resolve default VPC public subnets"
VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text --region "$REGION")
SUBNETS=$(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC_ID" \
  --query 'Subnets[?MapPublicIpOnLaunch==`true`].SubnetId' --output text --region "$REGION")
if [ -z "${SUBNETS:-}" ]; then
  echo "[error] No public subnets found in default VPC $VPC_ID. Please set SUBNET_IDS env."
  exit 1
fi
# Build a JSON-quoted list of subnet IDs to avoid formatting issues (tabs/newlines)
SUBNETS_JSON=$(printf "%s" "$SUBNETS" | tr '\t' '\n' | awk 'NF {printf "\"%s\",", $0}' | sed 's/,$//')

echo "[step] Ensure security group (egress only)"
set +e
SG_ID=$(aws ec2 describe-security-groups --filters Name=vpc-id,Values="$VPC_ID" Name=group-name,Values=onlyfans-scraper-sg \
  --query 'SecurityGroups[0].GroupId' --output text --region "$REGION" 2>/dev/null)
set -e
if [ -z "${SG_ID:-}" ] || [ "$SG_ID" = "None" ]; then
  SG_ID=$(aws ec2 create-security-group --group-name onlyfans-scraper-sg \
    --description "Egress-only for Huntaze scraper" --vpc-id "$VPC_ID" \
    --query 'GroupId' --output text --region "$REGION")
fi

echo "[step] Create or update ECS service"
echo "      subnets=[$SUBNETS_JSON]"
echo "      securityGroup=$SG_ID"
set +e
aws ecs create-service \
  --cluster "$CLUSTER" \
  --service-name "$SERVICE" \
  --task-definition "$TD_ARN" \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS_JSON],securityGroups=[\"$SG_ID\"],assignPublicIp=ENABLED}" \
  --region "$REGION"
CREATE_RC=$?
set -e
if [ $CREATE_RC -ne 0 ]; then
  echo "[svc] Updating existing service"
  aws ecs update-service \
    --cluster "$CLUSTER" \
    --service "$SERVICE" \
    --task-definition "$TD_ARN" \
    --force-new-deployment \
    --region "$REGION" >/dev/null
fi

echo "[ok] Service status"
aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" --region "$REGION" \
  --query 'services[0].{Status:status,Running:runningCount,Pending:pendingCount,TaskDef:taskDefinition}' --output table

echo "[tip] Tail logs: aws logs tail $LOG_GROUP --follow --region $REGION"
