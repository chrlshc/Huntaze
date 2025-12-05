#!/bin/bash
# AWS credentials - use environment variables or AWS CLI profile
# export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY_ID"
# export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_ACCESS_KEY"
# export AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN"
export AWS_DEFAULT_REGION="us-east-2"

ECS_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=huntaze-ai-router-ecs-sg" --query 'SecurityGroups[0].GroupId' --output text)
echo "ECS_SG: $ECS_SG"

aws ecs create-service \
  --cluster huntaze-ai-router \
  --service-name huntaze-ai-router-service \
  --task-definition huntaze-ai-router:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-00b7422149f5745ab,subnet-0e743017fa5ebadbb],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-2:317805897534:targetgroup/huntaze-ai-router-tg/9812eaaa90282b6f,containerName=ai-router,containerPort=8000"
