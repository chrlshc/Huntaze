#!/bin/bash
# AWS credentials - use environment variables or AWS CLI profile
# export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY_ID"
# export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_ACCESS_KEY"
# export AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN"
export AWS_DEFAULT_REGION="us-east-2"

echo "=== Vérification identité ==="
aws sts get-caller-identity

echo "=== Création cluster ECS ==="
aws ecs create-cluster --cluster-name huntaze-ai-router 2>/dev/null || echo "Cluster existe déjà"

echo "=== Création SG ECS ==="
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)
ECS_SG=$(aws ec2 create-security-group --group-name huntaze-ai-router-ecs-sg2 --description "ECS SG" --vpc-id $VPC_ID --query 'GroupId' --output text 2>/dev/null)
if [ -z "$ECS_SG" ] || [ "$ECS_SG" == "None" ]; then
  ECS_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=huntaze-ai-router-ecs-sg2" --query 'SecurityGroups[0].GroupId' --output text)
fi
echo "ECS_SG: $ECS_SG"

echo "=== Ajout règle SG ==="
aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 8000 --cidr 0.0.0.0/0 2>/dev/null || echo "Règle existe"

echo "=== Création service ECS ==="
aws ecs create-service \
  --cluster huntaze-ai-router \
  --service-name huntaze-ai-router-svc \
  --task-definition huntaze-ai-router:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-00b7422149f5745ab,subnet-0e743017fa5ebadbb],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-2:317805897534:targetgroup/huntaze-ai-router-tg/9812eaaa90282b6f,containerName=ai-router,containerPort=8000"

echo "=== DONE ==="
