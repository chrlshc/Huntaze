#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/ecs-describe-task.sh <cluster-arn-or-name> <task-arn> [region]
# Prints stoppedReason and container exit codes for quick diagnostics.

if [ $# -lt 2 ]; then
  echo "Usage: $0 <cluster> <task-arn> [region]" >&2
  exit 1
fi

CLUSTER="$1"
TASK_ARN="$2"
REGION="${3:-${AWS_REGION:-us-east-1}}"

aws ecs describe-tasks \
  --cluster "$CLUSTER" \
  --tasks "$TASK_ARN" \
  --region "$REGION" \
  --query 'tasks[].{stoppedReason:stoppedReason, containers:containers[].{name:name,exitCode:exitCode,reason:reason,lastStatus:lastStatus}}' \
  --output table

