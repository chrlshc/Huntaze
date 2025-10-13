#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   CLUSTER_ARN=arn:aws:ecs:... \
#   TASK_DEF_ARN=arn:aws:ecs:... \
#   SUBNETS=subnet-aaa,subnet-bbb \
#   SECURITY_GROUP=sg-1234567890abcdef \
#   USER_ID=your-user-id \
#   aws ecs run-task --cluster "$CLUSTER_ARN" --task-definition "$TASK_DEF_ARN" \
#     --launch-type FARGATE \
#     --network-configuration "awsvpcConfiguration={assignPublicIp=DISABLED,subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUP]}" \
#     --overrides "{\"containerOverrides\":[{\"name\":\"of-browser-worker\",\"environment\":[{\"name\":\"ACTION\",\"value\":\"login\"},{\"name\":\"USER_ID\",\"value\":\"$USER_ID\"},{\"name\":\"OF_CREDS_SECRET_ID\",\"value\":\"of/creds/$USER_ID\"}]}]}"

echo "See header for usage. This is a template wrapper around aws ecs run-task."

