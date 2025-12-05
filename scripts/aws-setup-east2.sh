#!/bin/bash
# AWS credentials - use environment variables or AWS CLI profile
# export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY_ID"
# export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_ACCESS_KEY"
# export AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN"
R="us-east-2"

echo "=== Cluster ECS ==="
aws ecs create-cluster --region $R --cluster-name huntaze-ai-router 2>/dev/null || echo "existe"

echo "=== SG ECS ==="
VPC=$(aws ec2 describe-vpcs --region $R --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)
SG=$(aws ec2 create-security-group --region $R --group-name hz-ecs-sg --description "ECS" --vpc-id $VPC --query 'GroupId' --output text 2>/dev/null)
[ -z "$SG" ] && SG=$(aws ec2 describe-security-groups --region $R --filters "Name=group-name,Values=hz-ecs-sg" --query 'SecurityGroups[0].GroupId' --output text)
echo "SG: $SG"
aws ec2 authorize-security-group-ingress --region $R --group-id $SG --protocol tcp --port 8000 --cidr 0.0.0.0/0 2>/dev/null

echo "=== Service ECS ==="
aws ecs create-service --region $R \
  --cluster huntaze-ai-router \
  --service-name hz-router-svc \
  --task-definition huntaze-ai-router:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-00b7422149f5745ab,subnet-0e743017fa5ebadbb],securityGroups=[$SG],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-2:317805897534:targetgroup/huntaze-ai-router-tg/9812eaaa90282b6f,containerName=ai-router,containerPort=8000"
